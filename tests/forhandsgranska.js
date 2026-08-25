// Oppnar ett RIKTIGT webblasarfonster med kundens skarpa sajt, men med den
// LOKALA (opushade) bannern inladdad. Bjorn kan scrolla och klicka sjalv.
//
// Tekniken: Playwright fangar upp anropet till CDN:et och svarar med filen
// fran hardisken i stallet. Kundens sajt vet ingenting om det - all deras
// CSS, deras typsnitt och deras Lenis ar kvar.
const { chromium } = require('playwright');
const fs = require('fs');

const path = require('path');
const BANNER = path.join(__dirname, '..', 'src', 'v1', 'banner.js');
// Adress som argument, annars brevenshus.
const START = process.argv[2] || 'https://www.brevenshus.se/?seos_farsk=1';

(async () => {
  const lokal = fs.readFileSync(BANNER, 'utf8');

  const wb = await chromium.launch({
    headless: false,
    args: ['--window-size=1400,950', '--window-position=60,40'],
  });
  const ctx = await wb.newContext({ viewport: null });

  // Byt ut CDN-filen mot den lokala, pa alla sidor i fonstret
  await ctx.route('**/v1/banner.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      body: lokal,
    })
  );

  // Inga robotsamtycken i kundens bevislogg, aven om han klickar
  await ctx.route('**/seos-cookie-banner-api.vercel.app/consent', (route) =>
    route.request().method() === 'POST' ? route.abort() : route.continue()
  );

  const sida = await ctx.newPage();

  // Natverket kan glappa vid uppstart. Ge det nagra forsok, och lat fonstret
  // vara oppet aven om det misslyckas - da kan man ladda om for hand.
  let uppe = false;
  for (let i = 1; i <= 4 && !uppe; i++) {
    try {
      await sida.goto(START, { waitUntil: 'domcontentloaded', timeout: 45000 });
      uppe = true;
    } catch (e) {
      console.log('Forsok ' + i + ' misslyckades: ' + e.message.split(String.fromCharCode(10))[0]);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  if (uppe) {
    try {
      await sida.locator('#cookie-banner').waitFor({ state: 'visible', timeout: 30000 });
      await sida.locator('#cookie-banner .policy-link').click();
    } catch (e) {
      console.log('Kunde inte oppna policyn automatiskt - klicka pa lanken i bannern.');
    }
  } else {
    console.log('Sidan gick inte att ladda. Ladda om i fonstret (F5).');
  }

  console.log('');
  console.log('  Fonstret ar oppet. Bannern ar din LOKALA version.');
  console.log('  Scrolla i policyrutan med mus eller styrplatta.');
  console.log('  Du kan ocksa skriva www.seosdesign.se i adressfaltet -');
  console.log('  den lokala bannern foljer med dit.');
  console.log('');
  console.log('  Stang fonstret nar du ar klar.');
  console.log('');

  // Hall processen vid liv tills fonstret stangs
  await new Promise((klar) => {
    wb.on('disconnected', klar);
    ctx.on('close', klar);
  });
  console.log('Fonstret stangt.');
})();
