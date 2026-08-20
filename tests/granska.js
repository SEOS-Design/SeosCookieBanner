// Granskar bannerns tillganglighet pa en riktig sajt.
//
//   npm run granska -- https://www.brevenshus.se/
//
// Testsviten granskar bannerns STANDARDDESIGN, den vi styr over. Men fargerna
// satts per sajt av kunden, och kontrastkraven (WCAG 1.4.3) beror darfor pa
// varje kunds egna varden. Det gar inte att garantera centralt - det maste
// matas dar bannern faktiskt kor. Kor det har vid varje ny sajt, och nar en
// kund andrar sin formgivning.
//
// Skriptet LASER bara. Det klickar fram installningsrutan men skickar aldrig
// nagot samtycke, sa kundens bevislogg paverkas inte.

const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const url = process.argv[2];
if (!url) {
  console.error('Ange en adress:  npm run granska -- https://www.exempel.se/');
  process.exit(1);
}

(async () => {
  const webblasare = await chromium.launch();
  // Axe kraver en context, inte en losryckt sida.
  const context = await webblasare.newContext({ viewport: { width: 1280, height: 900 } });
  const sida = await context.newPage();

  const fel = [];
  sida.on('pageerror', (e) => fel.push(e.message));

  console.log(`\nGranskar ${url}\n`);
  await sida.goto(url, { waitUntil: 'domcontentloaded' });

  try {
    await sida.locator('#cookie-banner').waitFor({ state: 'visible', timeout: 25000 });
  } catch {
    console.error('Bannern visades aldrig. Har sajten redan ett sparat samtycke?');
    console.error('Skriptet kor i ett tomt lage, sa det bor inte handa - kontrollera sajten.');
    await webblasare.close();
    process.exit(1);
  }

  // Installningsrutan innehaller kategoritexterna, dar kontrastfel oftast sitter.
  await sida.locator('#cookie-banner .btn-customize').click();
  await sida.locator('#cookie-settings').waitFor({ state: 'visible' });
  await sida.waitForTimeout(400);

  const resultat = await new AxeBuilder({ page: sida })
    .include('#cookie-sectionId')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (fel.length) {
    console.log('JavaScript-fel pa sidan:');
    fel.forEach((f) => console.log('  ' + f));
    console.log();
  }

  if (!resultat.violations.length) {
    console.log('Inga tillganglighetsfel i bannern.\n');
    await webblasare.close();
    return;
  }

  console.log(`${resultat.violations.length} sorters fel:\n`);
  for (const brist of resultat.violations) {
    console.log(`  ${brist.id} - ${brist.help}  (${brist.nodes.length} element)`);
    for (const nod of brist.nodes) {
      const rad = (nod.failureSummary || '').replace(/\s+/g, ' ').trim();
      console.log(`     ${nod.target}`);
      console.log(`     ${rad.slice(0, 150)}`);
    }
    console.log(`     Las mer: ${brist.helpUrl}\n`);
  }

  console.log('Kontrastfel loses i kundens designblock, inte i bannerkoden.');
  console.log('Vanligast: --text-muted for ljus mot --bg-main.\n');

  await webblasare.close();
  process.exit(1);
})();
