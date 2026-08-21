// Cookie-skanner (D6).
//
//   npm run skanna                        kontroll fore samtycke - samma som den schemalagda koningen
//   npm run skanna -- --full              aven efter samtycke, for inventering (se varningen nedan)
//   npm run skanna -- --full brevenshus   bara en sajt
//
// VARFOR DEN FINNS:
//   Den 2026-08-21 upptacktes att BADA Webflow-sajterna satte _ga med 400 dagars
//   livslangd innan besokaren svarat. Webflows egen Google-integration injicerar
//   sin snutt fore all anpassad huvudkod, sa "config G-XXXX" hann fore
//   "consent default". Felet hade legat lange.
//
//   Inget skyddsnat hade fangat det. CI kontrollerar var kod, den syntetiska
//   overvakningen att bannern renderar, uptime att API:t finns. Ingen av dem
//   tittar pa vad KUNDENS sajt gor med besokarens enhet innan hen sagt ja.
//   Det ar precis den luckan har fyller.
//
// VAD DEN LARMAR PA - tva saker, bada fore samtycke:
//   1. Cookies som inte ar nodvandiga. Detta ar LAGKRAVET: LEK forbjuder
//      icke-nodvandig lagring pa besokarens enhet innan hen sagt ja. Den har
//      kontrollen ar absolut och gar inte att stanga av per sajt
//   2. Anrop till kanda sparare. Ingen cookie behover ha satts - en trackers
//      forsta anrop skickar IP och user agent vidare. Detta ar INTE ett
//      lagkrav utan var egen hallning, och den kan darfor sattas per sajt
//      med `tillatnaSparare` i sajter.js. En tillaten sparare larmar inte men
//      SYNS anda i rapporten - den ska aldrig kunna bli osynlig
//
// VAD DEN INTE LARMAR PA: allt annat. Nya bild-CDN:er, typsnitt och API:er
// listas i rapporten men vacker ingen. Ett larm som gar varje gang kunden
// lagger till en bild slutar betyda nagot - samma lardom som byggkontrollen.
//
// SKRIVER INGENTING till bevisloggen. I --full-lage klickas "acceptera alla"
// for att inventera vad sajten faktiskt drar in, men var egen POST /consent
// blockeras, sa ingen robotrad hamnar i kundens bevislogg.

const { chromium } = require('playwright');
const sajter = require('./sajter');

const TIDSGRANS = 30000;
// Sa lange vi latar sidan gora av sig innan matningen last. Sena skript ar
// precis de misstankta - matas det for tidigt ser allt renare ut an det ar.
const VILA = 5000;

// Cookies som far finnas fore samtycke pa alla sajter.
// Bannerns egna omfattas av LEK:s undantag for nodvandig lagring: utan dem kan
// vi inte respektera besokarens val. Cloudflares ar infrastruktur och satts av
// plattformen, inte av oss.
const NODVANDIGA_COOKIES = [
  'consent_status', // bannerns egna
  'consent_choices',
  'client_consent_id', // satts redan vid init, fore val - avsiktligt
  '_cfuvid', // Cloudflare, lastbalansering
  '__cf_bm', // Cloudflare, botskydd
  'cf_clearance',
];

// Kanda sparare. Traffas nagon av dem FORE samtycke ar det ett larm.
//
// googletagmanager.com star med FLIT INTE i listan: den adressen ar sjalva
// biblioteket (GTM eller gtag.js), och det MASTE ladda fore samtycke - annars
// finns ingen mottagare for bannerns consent-signal. Det ar insamlingen som ar
// problemet, inte biblioteket.
const KANDA_SPARARE = [
  'google-analytics.com',
  'analytics.google.com',
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'connect.facebook.net',
  'facebook.com/tr',
  'hotjar.com',
  'clarity.ms',
  'analytics.tiktok.com',
  'snap.licdn.com',
  'ads-twitter.com',
  'ct.pinterest.com',
  'bat.bing.com',
  'matomo',
  'piwik',
  'segment.io',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'mc.yandex',
];

// Tredjeparter som inte lagrar nagot men anda skickar besokarens IP vidare.
// Markeras i rapporten sa de gar att ta stallning till - larmar inte.
const GRAZONER = ['fonts.googleapis.com', 'fonts.gstatic.com', 'maps.googleapis.com'];

function vard(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function matchar(url, monster) {
  const text = vard(url) + new URL(url, 'https://x').pathname;
  return monster.filter((m) => text.includes(m));
}

async function skanna(webblasare, sajt, full) {
  // Egen context per sajt. En sparad cookie hade dolt bannern och gjort
  // matningen blind - samma skal som i den syntetiska overvakningen.
  const context = await webblasare.newContext({ viewport: { width: 1280, height: 900 } });
  const sida = await context.newPage();

  const anrop = [];
  sida.on('request', (r) => anrop.push(r.url()));

  // Var egen bevislogg ska inte fyllas med robotsamtycken. Kon i localStorage
  // tar hand om det misslyckade anropet, men den dor med contexten.
  await sida.route('**/seos-cookie-banner-api.vercel.app/consent', (rutt) =>
    rutt.request().method() === 'POST' ? rutt.abort() : rutt.continue()
  );

  const brister = [];
  const rapport = [];

  try {
    await sida.goto(sajt.url, { waitUntil: 'domcontentloaded', timeout: TIDSGRANS });
  } catch (fel) {
    await context.close();
    return { laddfel: 'kunde inte ladda sidan: ' + fel.message.split('\n')[0] };
  }

  // Vantar pa bannern men kraver den inte. Renderar den inte larmar den
  // syntetiska overvakningen redan om det - och en dod banner gor det MER
  // troligt att nagot satter cookies i onodan, sa matningen ska anda goras.
  await sida
    .locator('#cookie-banner')
    .waitFor({ state: 'visible', timeout: TIDSGRANS })
    .catch(() => rapport.push('  (bannern renderade inte - se den syntetiska overvakningen)'));

  await sida.waitForTimeout(VILA);

  // --- 1. Cookies fore samtycke ---
  const tillatna = NODVANDIGA_COOKIES.concat(sajt.tillatnaCookies || []);
  const foreCookies = await context.cookies();
  const otillatna = foreCookies.filter((c) => !tillatna.includes(c.name));

  rapport.push(
    '  cookies fore samtycke: ' + (foreCookies.map((c) => c.name).join(', ') || '(inga)')
  );

  for (const c of otillatna) {
    const dagar = c.expires > 0 ? Math.round((c.expires - Date.now() / 1000) / 86400) : 0;
    brister.push(
      `cookie \`${c.name}\` (${c.domain}) satt FORE samtycke` +
        (dagar > 0 ? `, lever ${dagar} dagar` : ', sessionscookie')
    );
  }

  // --- 2. Anrop till kanda sparare fore samtycke ---
  const foreAnrop = anrop.slice();
  const sparare = new Set();
  const grazoner = new Set();
  for (const url of foreAnrop) {
    matchar(url, KANDA_SPARARE).forEach((m) => sparare.add(m));
    matchar(url, GRAZONER).forEach((m) => grazoner.add(m));
  }

  // Sajtens egen hallning i pingfragan. Larmar inte - men skrivs ut, sa ett
  // medvetet undantag aldrig blir en tyst blind flack.
  const tillatnaSparare = sajt.tillatnaSparare || [];
  const larmande = [...sparare].filter((s) => !tillatnaSparare.includes(s));
  const medgivna = [...sparare].filter((s) => tillatnaSparare.includes(s));

  for (const s of larmande) {
    brister.push(`anrop till \`${s}\` FORE samtycke`);
  }
  if (medgivna.length) {
    rapport.push('  tillaten sparare (medvetet val, se sajter.js): ' + medgivna.join(', '));
  }
  if (grazoner.size) {
    rapport.push('  grazon (larmar inte): ' + [...grazoner].join(', '));
  }

  const foreVardar = [...new Set(foreAnrop.map(vard))].sort();
  rapport.push('  tredjeparter fore samtycke: ' + foreVardar.join(', '));

  // --- 3. Inventering efter samtycke, bara i --full ---
  if (full) {
    try {
      anrop.length = 0;
      await sida
        .locator('#cookie-banner')
        .getByRole('button', { name: sajt.accepteraText })
        .click({ timeout: TIDSGRANS });
      await sida.waitForTimeout(VILA);

      const efter = await context.cookies();
      const nya = efter.filter(
        (c) => !foreCookies.some((f) => f.name === c.name && f.domain === c.domain)
      );
      rapport.push(
        '  nya cookies efter samtycke: ' +
          (nya
            .map((c) => {
              const d = c.expires > 0 ? Math.round((c.expires - Date.now() / 1000) / 86400) : 0;
              return c.name + ' (' + (d > 0 ? d + 'd' : 'session') + ')';
            })
            .join(', ') || '(inga)')
      );
      rapport.push(
        '  nya tredjeparter efter samtycke: ' +
          ([...new Set(anrop.map(vard))].sort().join(', ') || '(inga)')
      );
      rapport.push('  ^ jamfor med cookietabellen i COOKIES-OCH-SAMTYCKE-OVERSIKT.md');
    } catch (fel) {
      rapport.push('  kunde inte klicka igenom: ' + fel.message.split('\n')[0]);
    }
  }

  await context.close();
  return { brister, rapport };
}

(async () => {
  const full = process.argv.includes('--full');

  if (process.env.TESTLARM === 'true') {
    console.log('TESTLARM - inget riktigt fel. Kontrollerar bara att notiser kommer fram.');
    console.log('::brister::TESTLARM: kontroll av notiskedjan');
    process.exit(1);
  }

  if (full) {
    // Ett paslaget samtycke betyder att kundens GA far ett riktigt besok fran
    // en serverhall. Enstaka korningar drunknar i trafiken; en schemalagd hade
    // lagt 24 robotbesok om dygnet i kundens statistik.
    console.log('\n--full: klickar igenom. Ger kundens GA ett besok - kor det inte schemalagt.');
  }

  // Valfritt sajtnamn som sista argument. Framst for --full, dar varje korning
  // ger kundens GA ett besok - da vill man kunna rikta den.
  const valda = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const koras = valda.length ? sajter.filter((s) => valda.includes(s.namn)) : sajter;
  if (!koras.length) {
    console.error(
      `Ingen sajt heter "${valda.join(', ')}". Finns: ` + sajter.map((s) => s.namn).join(', ')
    );
    process.exit(1);
  }

  const webblasare = await chromium.launch();
  const misslyckade = [];

  for (const sajt of koras) {
    let resultat = await skanna(webblasare, sajt, full);

    // Bara laddfel ar vart ett omforsok. Ett funnet fel forsvinner inte pa tio
    // sekunder, och att skanna om det hade bara kunnat dolja det.
    if (resultat.laddfel) {
      console.log(`  ${sajt.namn}: ${resultat.laddfel} - forsoker igen...`);
      await new Promise((r) => setTimeout(r, 10000));
      resultat = await skanna(webblasare, sajt, full);
    }

    if (resultat.laddfel) {
      console.log(`  ${sajt.namn.padEnd(14)} FEL`);
      console.log(`     ${resultat.laddfel}`);
      misslyckade.push(`**${sajt.namn}** (${sajt.url})\n  - ` + resultat.laddfel);
      continue;
    }

    const { brister, rapport } = resultat;
    console.log(`\n  ${sajt.namn.padEnd(14)} ${brister.length ? 'FEL' : 'ok'}`);
    rapport.forEach((r) => console.log(r));
    brister.forEach((b) => console.log(`     ${b}`));

    if (brister.length) {
      misslyckade.push(`**${sajt.namn}** (${sajt.url})\n  - ` + brister.join('\n  - '));
    }
  }

  await webblasare.close();

  if (misslyckade.length) {
    // Plockas upp av workflowen och hamnar i GitHub-issuet.
    console.log('\n::brister::' + misslyckade.join('\n\n').replace(/\n/g, '%0A'));
    process.exit(1);
  }
  console.log('\nInga otillatna cookies eller sparare fore samtycke.');
  console.log('Medvetna undantag star i rapporten ovan och i tests/sajter.js.');
})();
