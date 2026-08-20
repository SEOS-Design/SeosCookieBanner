const { test, expect } = require('@playwright/test');

const SIDA = {
  utanPixel: '/tests/fixtures/banner.html',
  medPixel: '/tests/fixtures/banner-meta.html',
  tidigLead: '/tests/fixtures/banner-meta-tidig-lead.html',
  kundCss: '/tests/fixtures/banner-kundcss.html',
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

/**
 * Bannern ligger i en shadow root sedan C3. Playwrights egna vayare gar igenom
 * skuggan av sig sjalva, men page.evaluate gor det inte - dar behovs den har.
 * Injiceras i sidan sa att testerna kan skriva skugga() rakt av.
 */
async function medSkugga(page) {
  await page.addInitScript(() => {
    window.skugga = () => document.getElementById('cookie-sectionId').shadowRoot;
  });
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
    await medSkugga(page);
    const externa = [];
    page.on('request', (r) => {
      const url = r.url();
      if (!url.startsWith('http://127.0.0.1:4173/')) externa.push(url);
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    // Stilmallen ska ligga som <style> med verkligt innehall - inte som <link>.
    // Ligger numera INUTI skuggan, inte i dokumentets <head>.
    const css = await page.evaluate(() => {
      const el = skugga().getElementById('seos-cookie-css');
      return { tagg: el && el.tagName, tecken: el ? el.textContent.length : 0 };
    });
    expect(css.tagg).toBe('STYLE');
    expect(css.tecken).toBeGreaterThan(1000);

    // Stilarna ska faktiskt tillampas, inte bara finnas i dokumentet.
    const position = await page.evaluate(
      () => getComputedStyle(skugga().querySelector('.cookie-section')).position,
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

// C3. Kundens CSS har forstort bannern tva ganger i produktion - typsnittet och
// badge-radhojden. Med Shadow DOM ska det inte kunna handa igen, och lika
// viktigt: var CSS ska sluta paverka kundens sida.
test.describe('Isolering fran kundens CSS', () => {
  test('kundens globala regler naar inte in i bannern', async ({ page }) => {
    await medSkugga(page);
    await page.goto(SIDA.kundCss);

    // Fixturen doljer .cookie och nollar .cookie-section med !important.
    // Traffade reglerna in vore bannern osynlig.
    await expect(page.locator('#cookie-banner')).toBeVisible();

    const s = await page.evaluate(() => {
      const banner = skugga().getElementById('cookie-banner');
      const knapp = skugga().querySelector('.btn-save');
      const sektion = skugga().querySelector('.cookie-section');
      const bs = getComputedStyle(banner);
      const ks = getComputedStyle(knapp);
      return {
        font: getComputedStyle(sektion).fontFamily,
        position: getComputedStyle(sektion).position,
        knappBg: ks.backgroundColor,
        knappRadie: ks.borderRadius,
        rubrikFarg: getComputedStyle(banner.querySelector('h2')).color,
        bannerVisas: bs.display,
      };
    });

    expect(s.font).not.toContain('Comic Sans');
    expect(s.position).toBe('fixed');
    expect(s.knappBg).not.toBe('rgb(255, 0, 255)'); // magenta
    expect(s.knappRadie).not.toBe('0px');
    expect(s.rubrikFarg).not.toBe('rgb(255, 0, 0)'); // rott
    expect(s.bannerVisas).toBe('flex');
  });

  test('kundens CSS-variabler pa vardelementet slaar fortfarande igenom', async ({ page }) => {
    // Skyddar brevenshus uppsattning: deras formgivning ar ~30 variabler satta
    // pa #cookie-sectionId. Slutar de arvas in genom skuggan tappar de sin design.
    await medSkugga(page);
    await page.goto(SIDA.kundCss);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    const s = await page.evaluate(() => {
      const banner = skugga().getElementById('cookie-banner');
      return {
        bakgrund: getComputedStyle(banner).backgroundColor,
        // Innehallsbredden, inte yttermattet: bannern har 1px ram pa varje sida.
        bredd: getComputedStyle(banner).width,
        knappText: getComputedStyle(skugga().querySelector('.btn-save')).color,
      };
    });

    expect(s.bakgrund).toBe('rgb(239, 225, 201)'); // --bg-main
    expect(s.bredd).toBe('640px'); // --banner-width
    expect(s.knappText).toBe('rgb(245, 240, 232)'); // --btn-accent-text
  });

  // Hovringen var otestad, och da hamnade de nya variablerna av misstag i ett
  // oanvant temablock i stallet for i :host. Bannern sag ratt ut i vilolage och
  // felet syntes forst vid hovring - alltsa exakt det ett test ska fanga.
  test('hovring anvander variablerna, med och utan kundens overstyrning', async ({ page }) => {
    await medSkugga(page);
    // Knapparna har transition: 0.2s, sa filtret maste hinna landa innan det
    // mats - annars fangas ett mellanvarde som brightness(1.014).
    const las = (sel) =>
      expect
        .poll(() =>
          page.evaluate((s) => getComputedStyle(skugga().querySelector(s)).filter, sel),
        )
        .toBe;

    // Standard: bada knapparna ljusnar vid hovring.
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-save').hover();
    await las('#cookie-banner .btn-save')('brightness(1.2)');
    expect(
      await page.evaluate(() =>
        skugga().querySelector('#cookie-banner .btn-save').matches(':hover'),
      ),
    ).toBe(true);

    // Kundens overstyrning: Anpassa slutar ljusna och far egen bakgrund,
    // medan Acceptera behaller standardbeteendet. Speglar brevenshus.
    await page.goto(SIDA.kundCss);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-customize').hover();
    await las('#cookie-banner .btn-customize')('none');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            getComputedStyle(skugga().querySelector('#cookie-banner .btn-customize'))
              .backgroundColor,
        ),
      )
      .toBe('rgba(89, 74, 60, 0.12)');

    await page.locator('#cookie-banner .btn-save').hover();
    await las('#cookie-banner .btn-save')('brightness(1.2)');
  });

  // Kategorikorten kopplades om fran inline-onclick till data-reglage i C3.
  // Gar den kopplingen sonder kan besokaren inte valja per kategori, och
  // "Spara installningar" sparar tyst fel svar - utan nagot felmeddelande.
  test('kategorireglagen gaar att vaxla och sparas', async ({ page }) => {
    await medSkugga(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    await page.locator('#cookie-banner .btn-customize').click();
    await expect(page.locator('#cookie-settings')).toBeVisible();

    const aktiv = (id) =>
      page.evaluate((i) => skugga().getElementById(i).classList.contains('active'), id);

    expect(await aktiv('performance-toggle')).toBe(false);

    // Klicket ligger pa kortet, inte pa reglaget - hela raden ar klickbar.
    await page.locator('#cookie-settings .cookie-category-card').nth(1).click();
    expect(await aktiv('performance-toggle')).toBe(true);
    expect(await aktiv('marketing-toggle')).toBe(false);

    await page.locator('#cookie-settings .btn-save').click();
    await expect(page.locator('#cookie-settings')).toBeHidden();

    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).toContain('consent_status=custom');
    expect(decodeURIComponent(cookies)).toContain('"analytics":true');
    expect(decodeURIComponent(cookies)).toContain('"marketing":false');
  });

  // Fore isoleringen lag bannern i kundens sida och arvde deras globala reset.
  // Webflow satter box-sizing: border-box och far knappar att arva typsnitt, sa
  // bannern sag ratt ut utan att sjalv be om det. Utestangd foll knapparna
  // tillbaka pa webblasarens Arial - upptackt forst i produktion.
  //
  // Testet kor mot en sida HELT utan CSS: finns ingen reset att luta sig mot
  // maste bannern bara sitt eget.
  test('bannern klarar sig utan reset fran sidan', async ({ page }) => {
    await medSkugga(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    const s = await page.evaluate(() => {
      const knapp = getComputedStyle(skugga().querySelector('#cookie-banner .btn-save'));
      const kort = getComputedStyle(skugga().querySelector('.cookie'));
      const rubrik = getComputedStyle(skugga().querySelector('.cookie-header h2'));
      return {
        knappFont: knapp.fontFamily,
        knappRadhojd: knapp.lineHeight,
        boxSizing: kort.boxSizing,
        rubrikRadhojd: rubrik.lineHeight,
      };
    });

    expect(s.knappFont).toContain('Mona Sans Narrow');
    expect(s.knappRadhojd).not.toBe('normal');
    expect(s.boxSizing).toBe('border-box');
    expect(s.rubrikRadhojd).not.toBe('normal');
  });

  test('bannerns CSS paverkar inte kundens egna knappar', async ({ page }) => {
    // Fore C3 lag var stilmall i kundens <head> med en naken button-regel, och
    // formade om varje knapp pa sajten. Uppmatt pa seosdesign.se: 21 skillnader.
    await page.goto(SIDA.kundCss);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    const s = await page.evaluate(() => {
      const k = getComputedStyle(document.querySelector('.kundknapp'));
      return { display: k.display, padding: k.padding, gap: k.gap };
    });

    expect(s.display).not.toBe('inline-flex'); // var button-regel satter denna
    expect(s.padding).toBe('40px'); // kundens egen regel, orord
    expect(s.gap).toBe('normal'); // var regel satter var(--space-xs)
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
