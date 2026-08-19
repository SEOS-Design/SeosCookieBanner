const { test, expect } = require('@playwright/test');

const SIDA = {
  utanPixel: '/tests/fixtures/banner.html',
  medPixel: '/tests/fixtures/banner-meta.html',
  tidigLead: '/tests/fixtures/banner-meta-tidig-lead.html',
};

/** Registrerar varje forsok att na Facebook, aven de vi blockerar. */
function spionaPaFacebook(page) {
  const anrop = [];
  page.on('request', (r) => {
    if (/facebook\.(net|com)/i.test(r.url())) anrop.push(r.url());
  });
  return anrop;
}

/**
 * Hindrar fbevents.js fran att laddas. Tva syften: testerna kontaktar aldrig
 * en tredje part, och kon i stubben toms aldrig - sa vi kan inspektera den.
 */
async function blockeraFacebook(page) {
  await page.route('**/connect.facebook.net/**', (route) => route.abort());
}

const knapp = {
  acceptera: (page) => page.getByRole('button', { name: 'Acceptera alla' }),
  neka: (page) => page.locator('#cookie-banner').getByRole('button', { name: 'Endast nödvändiga' }),
};

test.describe('Bannern', () => {
  // Lardom fran produktionsincidenten pa brevenshus.se 2026-08-03: skriptet
  // laddade men dog av en namnkollision, och HTML-kontroll avslojade ingenting.
  // Att kontrollera att bannern RENDERAR ar darfor det mest grundlaggande testet.
  test('renderar och visar bada valen', async ({ page }) => {
    await page.goto(SIDA.utanPixel);

    await expect(page.locator('#cookie-banner')).toBeVisible();
    await expect(knapp.acceptera(page)).toBeVisible();
    await expect(knapp.neka(page)).toBeVisible();
  });

  test('kraschar inte pa en sajt som deklarerar samma variabelnamn', async ({ page }) => {
    const fel = [];
    page.on('pageerror', (e) => fel.push(e.message));

    await page.addInitScript(() => {
      // Exakt kollisionen som dodade bannern pa brevenshus.se.
      // eslint-disable-next-line no-unused-vars
      window.eval('const t = "kundens egen variabel";');
    });
    await page.goto(SIDA.utanPixel);

    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(fel).toEqual([]);
  });
});

// Sedan bannern byggs till en fil laddas stilmallen och DOMPurify inte langre
// vid korning. Bada bytena ar tysta om de gar sonder: en tom stilmall ger en
// banner som fortfarande "syns" for ett test, och ett trasigt DOMPurify marks
// forst nar nagon oppnar policyn. Darfor kontrolleras de har.
test.describe('Allt ligger i en fil', () => {
  test('stilmallen ar inbakad, inte hamtad', async ({ page }) => {
    const externa = [];
    page.on('request', (r) => {
      const url = r.url();
      if (!url.startsWith('http://127.0.0.1:4173/')) externa.push(url);
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    // Stilmallen ska ligga som <style> med verkligt innehall - inte som <link>.
    const css = await page.evaluate(() => {
      const el = document.getElementById('seos-cookie-css');
      return { tagg: el && el.tagName, tecken: el ? el.textContent.length : 0 };
    });
    expect(css.tagg).toBe('STYLE');
    expect(css.tecken).toBeGreaterThan(1000);

    // Stilarna ska faktiskt tillampas, inte bara finnas i dokumentet.
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector('.cookie-section')).position,
    );
    expect(position).toBe('fixed');

    // Ingenting far hamtas fran en tredje part - varken unpkg eller CDN:et.
    expect(externa).toEqual([]);
  });

  test('policyn visas och saneras av inbakad DOMPurify', async ({ page }) => {
    // DOMPurify hamtades tidigare fran unpkg vid forsta oppningen av policyn.
    // Ligger den inte langre med i bundlen kastar det har testet.
    await page.route('**/consent/policy/latest*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content:
            '<h3>Testpolicy</h3><script>window.__xss = true;<\/script>' +
            '<a href="https://exempel.se" target="_blank" rel="noopener">Lank</a>',
        }),
      }),
    );

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    await page.getByRole('link', { name: /cookiepolicy/i }).click();

    await expect(page.locator('#cookie-policy')).toBeVisible();
    await expect(page.locator('#policy-content-area')).toContainText('Testpolicy');

    // Skriptet i policytexten ska ha saneras bort, inte kort.
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.locator('#policy-content-area').innerHTML()).not.toContain('<script');

    // target/rel star med i ADD_ATTR och ska overleva saneringen.
    await expect(page.locator('#policy-content-area a')).toHaveAttribute('target', '_blank');
  });
});

test.describe('Meta-pixeln laddas inte utan samtycke', () => {
  test('noll anrop till Facebook innan besokaren valt', async ({ page }) => {
    const anrop = spionaPaFacebook(page);
    await blockeraFacebook(page);

    await page.goto(SIDA.medPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    expect(anrop).toEqual([]);
  });

  test('noll anrop efter "endast nodvandiga"', async ({ page }) => {
    const anrop = spionaPaFacebook(page);
    await blockeraFacebook(page);

    await page.goto(SIDA.medPixel);
    await knapp.neka(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();

    expect(anrop).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).not.toContain('_fbp');
  });

  test('noll anrop aven nar sajten redan koat ett Lead', async ({ page }) => {
    const anrop = spionaPaFacebook(page);
    await blockeraFacebook(page);

    await page.goto(SIDA.tidigLead);
    await knapp.neka(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();

    // Anropet ligger kvar i minnet men far aldrig lamna webblasaren.
    expect(anrop).toEqual([]);
  });
});

test.describe('Meta-pixeln laddas vid samtycke', () => {
  test('fbevents.js hamtas forst efter "acceptera alla"', async ({ page }) => {
    const anrop = spionaPaFacebook(page);
    await blockeraFacebook(page);

    await page.goto(SIDA.medPixel);
    expect(anrop).toEqual([]);

    await knapp.acceptera(page).click();
    await expect.poll(() => anrop.length).toBeGreaterThan(0);
    expect(anrop.some((u) => u.includes('fbevents.js'))).toBe(true);
  });

  // REGRESSIONSTEST for buggen som hittades 2026-08-06.
  //
  // Metas skript spelar upp stubbens ko i tur och ordning och slanger allt som
  // ligger fore 'init'. Eftersom React hinner montera fore bannerskriptet lag
  // sajtens Lead nastan alltid forst i kon - och forsvann tyst, utan felmeddelande.
  //
  // Fixen: loadMetaPixel() plockar ut kon, lagger init forst och lagger tillbaka
  // de vantande anropen efterat. Gar det har testet sonder ar Lead-matningen dod
  // igen, utan att nagot annat markbart gar fel.
  test('ett Lead som koats fore samtycke hamnar efter init', async ({ page }) => {
    await blockeraFacebook(page);

    await page.goto(SIDA.tidigLead);

    const koFore = await page.evaluate(() =>
      window.fbq.queue.map((a) => Array.from(a).join(':')),
    );
    expect(koFore).toEqual(['track:Lead']);

    await knapp.acceptera(page).click();

    const ko = await page.evaluate(() => window.fbq.queue.map((a) => Array.from(a).join(':')));

    const initIndex = ko.findIndex((rad) => rad.startsWith('init'));
    const leadIndex = ko.indexOf('track:Lead');

    expect(initIndex, 'init ska finnas i kon').toBeGreaterThanOrEqual(0);
    expect(initIndex, 'init ska ligga allra forst').toBe(0);
    expect(leadIndex, 'Lead ska finnas kvar i kon').toBeGreaterThanOrEqual(0);
    expect(leadIndex, 'Lead ska ligga efter init').toBeGreaterThan(initIndex);
  });
});

test.describe('Aterkallat samtycke', () => {
  // Aldrig testat mot en skarp pixel. Har satts _fbp/_fbc for hand for att
  // kontrollera just raderingslogiken, som policytexten lovar att den gor.
  test('raderar _fbp och _fbc', async ({ page }) => {
    await blockeraFacebook(page);

    await page.goto(SIDA.medPixel);
    await knapp.acceptera(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();

    await page.evaluate(() => {
      document.cookie = '_fbp=fb.1.testvarde; path=/';
      document.cookie = '_fbc=fb.1.testvarde; path=/';
    });
    expect(await page.evaluate(() => document.cookie)).toContain('_fbp');

    await page.evaluate(() => window.openSettings());
    await page.locator('#cookie-settings').getByRole('button', { name: 'Endast nödvändiga' }).click();

    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('_fbp');
    expect(cookies).not.toContain('_fbc');
  });
});
