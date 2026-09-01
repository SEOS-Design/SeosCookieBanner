// Syntetisk overvakning (D3).
//
//   npm run overvaka
//
// Besoker kundsajterna som en riktig besokare och kontrollerar att bannern
// FUNGERAR dar - inte att koden ar ratt, utan att den gor sitt jobb hos kunden.
//
// VARFOR DEN BEHOVS TROTS ALLT ANNAT:
//   CI            svarar pa "fungerar koden vi skrev?"
//   uptime-pingen svarar pa "finns API:t?"
//   byggkontrollen svarar pa "ar filen pa CDN:et aktuell?"
//   ingen av dem  svarar pa "fungerar bannern hos kunden just nu?"
//
// Tva gangar har det bevisats: brevenshus 2026-08-03, dar bannern var helt dod
// pa kundens sajt medan koden i repot var korrekt hela tiden. Och 2026-08-20,
// dar knapparna tappade typsnittet efter en utrullning - upptackt bara for att
// nagon rakade mata for hand.
//
// SKRIVER INGENTING. Skriptet klickar aldrig pa ett samtyckesval, sa kundernas
// bevislogg fylls inte med robotsvar. Att verifiera aven SKRIVvagen kraver en
// egen testsajt registrerad i databasen - se OVERVAKNING-OCH-TESTER.md.

const { chromium } = require('playwright');
const sajter = require('./sajter');

const TIDSGRANS = 25000;

async function kontrollera(webblasare, sajt) {
  // Egen context per sajt: inga cookies folier med, sa bannern visas alltid.
  // Med en sparad consent-cookie hade den doljt sig och testet blivit blint.
  const context = await webblasare.newContext({ viewport: { width: 1280, height: 900 } });
  const sida = await context.newPage();

  const jsFel = [];
  const laddadeSkript = [];
  let vakt = false;
  sida.on('pageerror', (e) => jsFel.push(e.message));
  sida.on('request', (r) => {
    if (r.url().includes('seos-cookie-banner.vercel.app')) laddadeSkript.push(r.url());
  });

  const brister = [];
  try {
    await sida.goto(sajt.url, { waitUntil: 'domcontentloaded', timeout: TIDSGRANS });

    // Sjalva karnan: renderar bannern? Ett skript kan ladda och anda do tyst.
    try {
      await sida.locator('#cookie-banner').waitFor({ state: 'visible', timeout: TIDSGRANS });
    } catch {
      brister.push('bannern renderade inte inom ' + TIDSGRANS / 1000 + ' s');
      return { brister, jsFel };
    }

    // Ratt fil? Fangar en scripttagg som bytts tillbaka eller kopierats fel.
    if (!laddadeSkript.some((u) => u.includes(sajt.skript))) {
      brister.push(
        `forvantade ${sajt.skript}, laddade: ${laddadeSkript.join(', ') || 'ingenting'}`,
      );
    }

    // Gar det att valja? Bada alternativen ska finnas, och pa ratt sprak.
    const acceptera = sida.locator('#cookie-banner').getByRole('button', {
      name: sajt.accepteraText,
    });
    if ((await acceptera.count()) === 0) {
      brister.push(`knappen "${sajt.accepteraText}" saknas`);
    }

    // Policyn maste ga att lasa INNAN man samtycker - annars ar samtycket inte
    // informerat. Kontrollen gar hela vagen: banner -> API -> Neon -> sanering.
    await sida.locator('#cookie-banner .policy-link').click();
    await sida.locator('#cookie-policy').waitFor({ state: 'visible', timeout: TIDSGRANS });
    try {
      await sida.waitForFunction(
        () => {
          const rot = document.getElementById('cookie-sectionId');
          const s = rot && rot.shadowRoot ? rot.shadowRoot : document;
          const c = s.getElementById('policy-content-area');
          return c && c.textContent.trim().length > 400;
        },
        { timeout: TIDSGRANS },
      );
    } catch {
      const text = await sida.evaluate(() => {
        const rot = document.getElementById('cookie-sectionId');
        const s = rot && rot.shadowRoot ? rot.shadowRoot : document;
        const c = s.getElementById('policy-content-area');
        return c ? c.textContent.trim().slice(0, 80) : '(ingen ruta)';
      });
      brister.push(`policyn laddade inte: "${text}"`);
    }

    if (jsFel.length) brister.push('JavaScript-fel: ' + jsFel.join(' | '));

    // VAKTEN (C5 punkt 5). Rapporteras, larmar INTE.
    //
    // Snutten klistras in per sajt och gar inte att rulla ut fran var sida, sa
    // en sajt utan den ar inte trasig - den ar bara inte uppsatt an. Ett larm
    // som gar for varje sajt som inte hunnit slutar betyda nagot, samma
    // lardom som byggkontrollen och cookie-skannern.
    //
    // Men den ska SYNAS: utan raden i huvudet fangas ingenting som laddas
    // innan bannern hunnit, och det ar omojligt att se pa sidan.
    vakt = await sida.evaluate(() => typeof window.SEOS_GUARD === 'object');
  } catch (fel) {
    brister.push('kunde inte ladda sidan: ' + fel.message.split('\n')[0]);
  } finally {
    await context.close();
  }

  return { brister, jsFel, vakt };
}

(async () => {
  if (process.env.TESTLARM === 'true') {
    console.log('TESTLARM - inget riktigt fel. Kontrollerar bara att notiser kommer fram.');
    console.log('::brister::TESTLARM: kontroll av notiskedjan');
    process.exit(1);
  }

  const webblasare = await chromium.launch();
  const misslyckade = [];

  for (const sajt of sajter) {
    let resultat = await kontrollera(webblasare, sajt);

    // Ett forsok till innan vi larmar. Ett natverksglapp ska inte vacka nagon;
    // ett riktigt fel forsvinner inte pa tio sekunder.
    if (resultat.brister.length) {
      console.log(`  ${sajt.namn}: fel, forsoker igen...`);
      await new Promise((r) => setTimeout(r, 10000));
      resultat = await kontrollera(webblasare, sajt);
    }

    if (resultat.brister.length) {
      console.log(`  ${sajt.namn.padEnd(14)} FEL`);
      resultat.brister.forEach((b) => console.log(`     ${b}`));
      misslyckade.push(`**${sajt.namn}** (${sajt.url})\n  - ` + resultat.brister.join('\n  - '));
    } else {
      console.log(`  ${sajt.namn.padEnd(14)} ok${resultat.vakt ? '   vakt' : '   ingen vakt'}`);
    }
  }

  await webblasare.close();

  if (misslyckade.length) {
    // Plockas upp av workflowen och hamnar i GitHub-issuet.
    console.log('::brister::' + misslyckade.join('\n\n').replace(/\n/g, '%0A'));
    process.exit(1);
  }
  console.log('\nAlla sajter ok.');
})();
