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
      () => getComputedStyle(skugga().querySelector('.cookie-section')).position
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
      })
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

    // OBS: typsnittet star INTE i listan. Det arvs in med flit - se nasta test.
    expect(s.position).toBe('fixed');
    expect(s.knappBg).not.toBe('rgb(255, 0, 255)'); // magenta
    expect(s.knappRadie).not.toBe('0px');
    expect(s.rubrikFarg).not.toBe('rgb(255, 0, 0)'); // rott
    expect(s.bannerVisas).toBe('flex');
  });

  // Bannern ska smalta in pa sajten den hamnar pa. Typsnitt ar en arvd
  // CSS-egenskap och passerar skuggan, till skillnad fran vanliga regler -
  // det ar alltsa ett medvetet undantag fran isoleringen, inte en lucka.
  test('typsnittet arvs fran sidan, men gaar att laasa', async ({ page }) => {
    await medSkugga(page);
    const font = () =>
      page.evaluate(() => getComputedStyle(skugga().querySelector('.cookie-section')).fontFamily);

    // Sidan satter Comic Sans pa allt. Bannern ska folja med.
    await page.goto(SIDA.kundCss);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(await font()).toContain('Comic Sans');

    // Men en sajt som vill lasa utseendet satter --main-font och vinner.
    await page.addStyleTag({
      content: "#cookie-sectionId { --main-font: 'Courier New', monospace; }",
    });
    expect(await font()).toContain('Courier New');
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
      expect.poll(() =>
        page.evaluate((s) => getComputedStyle(skugga().querySelector(s)).filter, sel)
      ).toBe;

    // Standard: bada knapparna ljusnar vid hovring.
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-save').hover();
    await las('#cookie-banner .btn-save')('brightness(1.2)');
    expect(
      await page.evaluate(() =>
        skugga().querySelector('#cookie-banner .btn-save').matches(':hover')
      )
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
              .backgroundColor
        )
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

    expect(await aktiv('analytics-toggle')).toBe(false);

    // Klicket ligger pa kortet, inte pa reglaget - hela raden ar klickbar.
    await page.locator('#cookie-settings .cookie-category-card').nth(1).click();
    expect(await aktiv('analytics-toggle')).toBe(true);
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

    // Sidan har ett eget typsnitt men ingen reset - alltsa inget som far
    // knappar att arva det. Utan var egen regel far de webblasarens Arial.
    await page.addStyleTag({ content: "body { font-family: 'Courier New', monospace; }" });

    const s = await page.evaluate(() => {
      const knapp = getComputedStyle(skugga().querySelector('#cookie-banner .btn-save'));
      const sektion = getComputedStyle(skugga().querySelector('.cookie-section'));
      const kort = getComputedStyle(skugga().querySelector('.cookie'));
      const rubrik = getComputedStyle(skugga().querySelector('.cookie-header h2'));
      return {
        knappFont: knapp.fontFamily,
        sektionFont: sektion.fontFamily,
        knappRadhojd: knapp.lineHeight,
        boxSizing: kort.boxSizing,
        rubrikRadhojd: rubrik.lineHeight,
      };
    });

    // Knappen ska folja bannern, inte falla tillbaka pa webblasarens Arial.
    expect(s.knappFont).toBe(s.sektionFont);
    expect(s.knappFont).toContain('Courier New');
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

// C8. Fore detta var kategorireglagen <div> med onclick: onabara med tangentbord
// och stumma for skarmlasare. En besokare som inte kan anvanda mus kunde alltsa
// inte gora ett val per kategori - vilket gor det svart att havda att samtycket
// var "specifikt" och en "aktiv handling".
test.describe('Tillganglighet', () => {
  const oppnaInstallningar = async (page) => {
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-customize').click();
    await expect(page.locator('#cookie-settings')).toBeVisible();
  };

  test('reglagen gaar att naa och styra med bara tangentbord', async ({ page }) => {
    await medSkugga(page);
    await oppnaInstallningar(page);

    const reglage = page.locator('#analytics-toggle');
    await expect(reglage).toHaveAttribute('role', 'switch');
    await expect(reglage).toHaveAttribute('aria-checked', 'false');

    // Ingen mus: tabba fram till reglaget och slaa pa det med mellanslag.
    await reglage.focus();
    expect(await page.evaluate(() => skugga().activeElement.id)).toBe('analytics-toggle');
    await page.keyboard.press('Space');

    await expect(reglage).toHaveAttribute('aria-checked', 'true');
    expect(
      await page.evaluate(() =>
        skugga().getElementById('analytics-toggle').classList.contains('active')
      )
    ).toBe(true);

    // Valet ska ocksa spara ratt - inte bara se ratt ut.
    await page.locator('#cookie-settings .btn-save').click();
    expect(decodeURIComponent(await page.evaluate(() => document.cookie))).toContain(
      '"analytics":true'
    );
  });

  test('reglaget beraattar vad det heter och om det ar paa', async ({ page }) => {
    await medSkugga(page);
    await oppnaInstallningar(page);

    // Namnet kommer fran rubriken via aria-labelledby, statusen fran aria-checked.
    const namn = await page.evaluate(() => {
      const r = skugga().getElementById('marketing-toggle');
      return skugga().getElementById(r.getAttribute('aria-labelledby')).textContent.trim();
    });
    expect(namn).toBe('Marknadsföring');

    // Den obligatoriska kategorin ska synas som paslagen och inte gaa att andra.
    const nodvandig = page.locator('#cookie-settings .toggle-switch.always-active');
    await expect(nodvandig).toHaveAttribute('aria-checked', 'true');
    await expect(nodvandig).toBeDisabled();
  });

  test('rutorna ar dialoger och fokus foljer med in och ut', async ({ page }) => {
    await medSkugga(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    await expect(page.locator('#cookie-banner')).toHaveAttribute('role', 'dialog');

    const oppnaKnapp = page.locator('#cookie-banner .btn-customize');
    await oppnaKnapp.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#cookie-settings')).toBeVisible();

    // Fokus ska ha flyttat in i den oppnade rutan.
    const inne = await page.evaluate(() =>
      skugga().getElementById('cookie-settings').contains(skugga().activeElement)
    );
    expect(inne).toBe(true);

    // Escape stanger, och fokus ska tillbaka dit det kom ifran.
    await page.keyboard.press('Escape');
    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(await page.evaluate(() => skugga().activeElement.className)).toContain('btn-customize');
  });

  // Axe hoppar over dolda element. Forsta versionen granskade darfor bara
  // forsta rutan och missade ett kontrastfel i "KRÄVS"-etiketten, som bara
  // finns i installningsrutan. Bada lagena maste granskas.
  for (const [lage, forbered] of [
    ['bannern', async () => {}],
    [
      'installningarna',
      async (page) => {
        await page.locator('#cookie-banner .btn-customize').click();
        await page.locator('#cookie-settings').waitFor({ state: 'visible' });
      },
    ],
  ]) {
    test(`automatisk granskning hittar inga fel i ${lage}`, async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright');
      await page.goto(SIDA.utanPixel);
      await expect(page.locator('#cookie-banner')).toBeVisible();
      await forbered(page);

      // Granskar bannern, inte testsidan omkring den.
      const resultat = await new AxeBuilder({ page })
        .include('#cookie-sectionId')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Axe lagger kontraster den inte kan avgora i "incomplete", inte i
      // "violations". Uppmatt: med text i samma farg som bakgrunden blev det
      // fyra incomplete och NOLL violations. Ett test som bara laser violations
      // hade darfor varit tyst om ett uppenbart fel. Bada raknas.
      const brister = [...resultat.violations, ...resultat.incomplete];
      const fel = brister.flatMap((v) =>
        v.nodes.map(
          (n) =>
            `${v.id}: ${String(n.target)} - ${(n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 120)}`
        )
      );
      expect(fel, fel.join('\n')).toEqual([]);
    });
  }
});

// C4. Ar API:t nere nar nagon klickar galler valet anda - men BEVISET gick
// tidigare forlorat, och bevisbordan ar hela tjanstens karnlofte. Cookien
// sattes dessutom pa en timme, sa bannern kom tillbaka och fragade igen.
test.describe('Retry-ko for missade samtycken', () => {
  const KO = 'seos_consent_ko';

  /** Later API:t se ut som nere. Returnerar de anrop som forsokts. */
  async function apiNere(page) {
    const forsok = [];
    await page.route('**/consent', (route) => {
      forsok.push(JSON.parse(route.request().postData() || '{}'));
      return route.abort('failed');
    });
    return forsok;
  }

  // Kravet fran Bjorn, och det viktigaste i hela C4: ligger nagot nere ska
  // BESOKAREN inte marka av det. Bannern ska forsvinna, taggarna staller om,
  // och inget felmeddelande syns. Var bevislogg ar vart problem, inte kundens
  // besokares.
  test('besokaren markar ingenting nar API:t ar nere', async ({ page }) => {
    const synligaFel = [];
    page.on('pageerror', (e) => synligaFel.push(e.message));
    await apiNere(page);

    // Samma gtag-uppsattning som kundsajterna har i sitt consent-default-block.
    await page.addInitScript(() => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await knapp.acceptera(page).click();

    // 1. Bannern forsvinner - direkt, utan att vanta pa natverket.
    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 2000 });
    await expect(page.locator('#cookie-settings')).toBeHidden();
    await expect(page.locator('#cookie-policy')).toBeHidden();

    // 2. Valet tillampas anda - Google far signalen lokalt, utan var server.
    const gtagAnrop = await page.evaluate(() =>
      (window.dataLayer || []).map((a) => Array.from(a).join(':')).join(' | ')
    );
    expect(gtagAnrop).toContain('consent:update');

    // 3. Inga JavaScript-fel som kan stora sajten omkring.
    expect(synligaFel).toEqual([]);

    // 4. Och den nya vinsten: bannern kommer inte tillbaka om en timme.
    //
    //    Att bara ladda om sidan bevisar ingenting - en timgammal cookie ar
    //    giltig da ocksa. Utgangstiden ar det enda som skiljer gammalt fran
    //    nytt, sa den mats direkt.
    const cookie = (await page.context().cookies()).find((c) => c.name === 'consent_status');
    const dagarKvar = (cookie.expires * 1000 - Date.now()) / 86400000;
    expect(dagarKvar).toBeGreaterThan(25);
  });

  test('fungerar aven nar localStorage ar avstangt', async ({ page }) => {
    // Privat lage eller hard sekretessinstallning. Kon kan da inte sparas -
    // men samtycket ska anda ga igenom och bannern forsvinna.
    const synligaFel = [];
    page.on('pageerror', (e) => synligaFel.push(e.message));
    await page.addInitScript(() => {
      const kasta = () => {
        throw new Error('localStorage avstangt');
      };
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => ({ getItem: kasta, setItem: kasta, removeItem: kasta }),
      });
    });
    await apiNere(page);

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await knapp.acceptera(page).click();

    await expect(page.locator('#cookie-banner')).toBeHidden({ timeout: 2000 });
    expect(synligaFel).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toContain('consent_status=all');
  });

  test('samtycket koas nar API:t inte svarar', async ({ page }) => {
    const forsok = await apiNere(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    await knapp.acceptera(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
    expect(forsok.length).toBe(1);

    const ko = await page.evaluate((n) => JSON.parse(localStorage.getItem(n) || '[]'), KO);
    expect(ko).toHaveLength(1);
    expect(ko[0].payload.status).toBe('all');
    expect(ko[0].payload.analytics).toBe(true);

    // Cookien ska ha full livslangd anda - annars kommer bannern tillbaka om
    // en timme och fragar om samma sak.
    const utgang = await page.evaluate(async () => {
      const c = await document.cookie;
      return c.includes('consent_status=all');
    });
    expect(utgang).toBe(true);
  });

  test('kon toms vid nasta sidladdning och beviset behaller sin tidsstampel', async ({ page }) => {
    const forsokNere = await apiNere(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await knapp.acceptera(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
    const tidpunktVidKlick = (
      await page.evaluate((n) => JSON.parse(localStorage.getItem(n) || '[]'), KO)
    )[0].payload.timestamp;
    expect(forsokNere).toHaveLength(1);

    // API:t kommer tillbaka. Nasta sidladdning ska skicka det koade.
    await page.unroute('**/consent');
    const mottagna = [];
    await page.route('**/consent', (route) => {
      mottagna.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto(SIDA.utanPixel);
    await expect.poll(() => mottagna.length).toBe(1);

    // Tidsstampeln ska vara fran KLICKET, inte fran nar det kom fram - annars
    // ljuger bevisloggen om nar samtycket gavs.
    expect(mottagna[0].timestamp).toBe(tidpunktVidKlick);

    await expect.poll(() => page.evaluate((n) => localStorage.getItem(n), KO)).toBe(null);
  });

  test('ett avvisat samtycke koas inte - det skulle aldrig lyckas', async ({ page }) => {
    // 403 betyder att API:t forstod oss och sa nej (fel site key, fel origin).
    // Att forsoka om det for evigt ger samma svar.
    const forsok = [];
    await page.route('**/consent', (route) => {
      forsok.push(1);
      return route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await knapp.acceptera(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();

    expect(forsok).toHaveLength(1);
    expect(await page.evaluate((n) => localStorage.getItem(n), KO)).toBe(null);
  });

  test('for gamla samtycken slangs i stallet for att skickas', async ({ page }) => {
    const mottagna = [];
    await page.route('**/consent', (route) => {
      mottagna.push(1);
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    // 40 dagar gammalt - besokaren har for lange sedan fatt fragan igen.
    await page.addInitScript((n) => {
      const gammal = new Date(Date.now() - 40 * 86400000).toISOString();
      localStorage.setItem(
        n,
        JSON.stringify([{ payload: { status: 'all', timestamp: gammal }, forsok: 0 }])
      );
    }, KO);

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.waitForTimeout(600);

    expect(mottagna).toHaveLength(0);
    expect(await page.evaluate((n) => localStorage.getItem(n), KO)).toBe(null);
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

    const koFore = await page.evaluate(() => window.fbq.queue.map((a) => Array.from(a).join(':')));
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
    await page
      .locator('#cookie-settings')
      .getByRole('button', { name: 'Endast nödvändiga' })
      .click();

    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('_fbp');
    expect(cookies).not.toContain('_fbc');
  });
});

test.describe('Design fran databasen (C1 steg 1)', () => {
  const NYCKEL = 'pk_test_00000000000000000000000000000000';
  // Tydliga varden som inte kan forvaxlas med bannerns standardfarger.
  const BEIGE = 'rgb(245, 240, 230)';

  /** Ger sajten en site key och later API:t svara med en design. */
  async function medDesign(page, design, { fordrojning = 0, hangDig = false } = {}) {
    await page.addInitScript((k) => {
      window.SEOS_SITE_KEY = k;
    }, NYCKEL);

    await page.route('**/config/**', async (route) => {
      // En route som aldrig fullfoljs: harmar ett API som tagit emot fragan
      // men aldrig svarar. Det ar det enda som provar tidsgransen pa riktigt.
      if (hangDig) return new Promise(() => {});
      if (fordrojning) await new Promise((r) => setTimeout(r, fordrojning));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ design }),
      });
    });
  }

  const cssVariabel = (page, namn) =>
    page.evaluate(
      (n) =>
        getComputedStyle(document.getElementById('cookie-sectionId')).getPropertyValue(n).trim(),
      namn
    );

  const bannerBakgrund = (page) =>
    page.evaluate(() => getComputedStyle(window.skugga().querySelector('.cookie')).backgroundColor);

  test('kundens farger hamtas fran API:t och slar igenom pa bannern', async ({ page }) => {
    await medSkugga(page);
    await medDesign(page, { 'bg-main': '#f5f0e6', 'radius-md': '14px' });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    // Inte bara att variabeln ar satt - att den faktiskt anvands. En variabel
    // ingen regel laser ar en variabel som inte gor nagot.
    expect(await bannerBakgrund(page)).toBe(BEIGE);
    expect(await cssVariabel(page, '--radius-md')).toBe('14px');
  });

  test('bannern visas inte forran designen kommit - ingen omritning infor ogonen', async ({
    page,
  }) => {
    // Karnan i hela steg 1. Renderade bannern direkt och malades om nar
    // svaret kom skulle brevenshus banner ga fran mork till beige infor
    // besokarens ogon. En cookiebanner som blinkar om ser trasig ut.
    await medSkugga(page);
    await medDesign(page, { 'bg-main': '#f5f0e6' }, { fordrojning: 400 });

    await page.goto(SIDA.utanPixel);

    // Medan configen ar pa vag: vardelementet finns, men bannern visas inte.
    await expect(page.locator('#cookie-sectionId')).toBeAttached();
    await expect(page.locator('#cookie-banner')).toBeHidden();

    // Nar den kommit: synlig, och redan i ratt farg fran forsta bildrutan.
    await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 3000 });
    expect(await bannerBakgrund(page)).toBe(BEIGE);
  });

  test('bannern visas anda nar configen inte gar att hamta', async ({ page }) => {
    // En banner som uteblir for att fargerna inte gick att hamta vore ett
    // mycket varre fel an en banner i standardfarger.
    const synligaFel = [];
    page.on('pageerror', (e) => synligaFel.push(e.message));

    await medSkugga(page);
    await page.addInitScript((k) => {
      window.SEOS_SITE_KEY = k;
    }, NYCKEL);
    await page.route('**/config/**', (route) => route.abort('failed'));

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 3000 });
    expect(await bannerBakgrund(page)).not.toBe(BEIGE);
    expect(synligaFel).toEqual([]);
  });

  test('tidsgransen haller nar API:t tar emot men aldrig svarar', async ({ page }) => {
    // Utan AbortController hade bannern hangt sig har - och en osynlig banner
    // ar samma sak som ingen banner alls.
    await medSkugga(page);
    await medDesign(page, {}, { hangDig: true });

    const start = Date.now();
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 5000 });
    expect(Date.now() - start).toBeLessThan(4000);
  });

  test('geometri gar INTE att satta per sajt', async ({ page }) => {
    // Designmodellen, lastfast: bannern ska kannas som samma komponent pa
    // alla sajter. Ser storleken fel ut ska BASVARDET rattas - annars nar
    // framtida basandringar aldrig fram dit vardet ar overstyrt.
    await medSkugga(page);
    await medDesign(page, {
      'banner-width': '1400px',
      'body-text-size': '40px',
      'space-md': '99px',
      'bg-main': '#f5f0e6',
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    // Fargen slapptes igenom, geometrin inte. Att bada provas i samma svar
    // ar poangen: det visar att filtret valjer, inte att allt foll bort.
    expect(await bannerBakgrund(page)).toBe(BEIGE);
    const bredd = await page.evaluate(
      () => window.skugga().querySelector('.cookie').getBoundingClientRect().width
    );
    expect(bredd).toBeLessThan(1000);
  });

  test('varden som skulle hamta nagot utifran slapps inte igenom', async ({ page }) => {
    // CSS-varden tolkas aldrig som kod, men ett url() far webblasaren att
    // hamta fran en adress vi inte valt - en tankbar vag att spara besokare.
    const utanforstaende = [];
    page.on('request', (r) => {
      if (r.url().includes('elak.example')) utanforstaende.push(r.url());
    });

    await medSkugga(page);
    await medDesign(page, {
      'bg-main': 'url(https://elak.example/spar.png)',
      'scroll-gradient': 'url("https://elak.example/2.png")',
      'radius-md': '9px',
    });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    expect(utanforstaende).toEqual([]);
    expect(await cssVariabel(page, '--bg-main')).not.toContain('elak.example');
    // Det ofarliga vardet i samma svar slapptes igenom.
    expect(await cssVariabel(page, '--radius-md')).toBe('9px');
  });

  test('utan site key hamtas ingen config alls', async ({ page }) => {
    // Sajter som annu inte fatt sin nyckel ska bete sig precis som forut.
    const anrop = [];
    page.on('request', (r) => {
      if (r.url().includes('/config/')) anrop.push(r.url());
    });

    await medSkugga(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(anrop).toEqual([]);
  });
  test('ingen config hamtas for den som redan samtyckt', async ({ page }) => {
    // De allra flesta sidvisningar kommer fran nagon som redan svarat. For dem
    // visas bannern aldrig, sa designen behovs inte - och /config ar den enda
    // trafik som sker per SIDVISNING i stallet for per besokare. Varje anrop
    // som nar databasen haller dessutom Neon vaken i minst fem minuter.
    const anrop = [];
    page.on('request', (r) => {
      if (r.url().includes('/config/')) anrop.push(r.url());
    });

    await medSkugga(page);
    await medDesign(page, { 'bg-main': '#f5f0e6' });

    // Forsta besoket: bannern visas, designen hamtas.
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await knapp.acceptera(page).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
    expect(anrop.length).toBe(1);

    // Andra sidvisningen: samtycke finns, bannern doljs - noll nya anrop.
    anrop.length = 0;
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeHidden();
    await page.waitForTimeout(500);
    expect(anrop).toEqual([]);

    // Men oppnar besokaren installningarna behovs designen - da hamtas den.
    await page.evaluate(() => window.openSettings());
    await expect(page.locator('#cookie-settings')).toBeVisible();
    expect(anrop.length).toBe(1);
    expect(await bannerBakgrund(page)).toBe(BEIGE);
  });
  test('farsklaget gar forbi cachen, vanligt lage gor det inte', async ({ page }) => {
    // Configen cachas en timme, vilket ar ratt for besokare men fel for den
    // som sitter och justerar farger. ?seos_farsk=1 far just den
    // sidladdningen att hamta direkt ur databasen.
    const adresser = [];
    page.on('request', (r) => {
      if (r.url().includes('/config/')) adresser.push(r.url());
    });

    await medSkugga(page);
    await medDesign(page, { 'bg-main': '#f5f0e6' });

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    expect(adresser[0]).not.toContain('farsk=');

    adresser.length = 0;
    await page.goto(SIDA.utanPixel + '?seos_farsk=1');
    await expect(page.locator('#cookie-banner')).toBeVisible();
    // Tidsstampeln gor adressen unik sa CDN:et inte kan svara ur cachen.
    expect(adresser[0]).toContain('farsk=');
    expect(await bannerBakgrund(page)).toBe(BEIGE);
  });
});

test.describe('Kategorier fran databasen (C1 steg 2)', () => {
  const NYCKEL = 'pk_test_00000000000000000000000000000000';

  /** Later API:t svara med en uppsattning kategorier. */
  async function medKategorier(page, categories, { utanFalt = false } = {}) {
    await page.addInitScript((k) => {
      window.SEOS_SITE_KEY = k;
    }, NYCKEL);

    await page.route('**/config/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(utanFalt ? { design: {} } : { design: {}, categories }),
      })
    );
  }

  const kort = (page) => page.locator('#settings-container .cookie-category-card');

  const oppnaInstallningar = async (page) => {
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-customize').click();
    await expect(page.locator('#cookie-settings')).toBeVisible();
  };

  /** Fangar det som skickas till bevisloggen. */
  async function fangaConsent(page) {
    const skickat = [];
    await page.route('**/consent', (route) => {
      skickat.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });
    return skickat;
  }

  test('databasen bestammer vilka kort som visas', async ({ page }) => {
    await medSkugga(page);
    await medKategorier(page, [
      { key: 'necessary', is_required: true },
      { key: 'analytics', is_required: false },
      { key: 'marketing', is_required: false },
    ]);

    await oppnaInstallningar(page);

    await expect(kort(page)).toHaveCount(3);
    await expect(page.locator('#analytics-toggle')).toBeVisible();
    await expect(page.locator('#marketing-toggle')).toBeVisible();
    // Den bortvalda kategorin finns inte alls - inte dold, inte tom.
    await expect(page.locator('#functional-toggle')).toHaveCount(0);
  });

  test('kategorierna ritas i bannerns ordning, inte API:ts', async ({ page }) => {
    await medSkugga(page);
    // API:t svarar i omvand ordning. Bannern har sin egen.
    await medKategorier(page, [
      { key: 'marketing', is_required: false },
      { key: 'functional', is_required: false },
      { key: 'analytics', is_required: false },
      { key: 'necessary', is_required: true },
    ]);

    await oppnaInstallningar(page);

    const ordning = await page.evaluate(() =>
      [...window.skugga().querySelectorAll('#settings-container .cookie-category-card h5')].map(
        (h) => h.id
      )
    );
    expect(ordning).toEqual([
      'etikett-necessary',
      'etikett-analytics',
      'etikett-functional',
      'etikett-marketing',
    ]);
  });

  test('saknas faltet helt ritas bannerns fyra', async ({ page }) => {
    // Sa beter sig ett API som annu inte skickar kategorier. Det ar det som
    // gor att bannern kan rullas ut fore API:t utan att nagot andras.
    await medSkugga(page);
    await medKategorier(page, null, { utanFalt: true });

    await oppnaInstallningar(page);
    await expect(kort(page)).toHaveCount(4);
  });

  test('tom lista ritar bannerns fyra - aldrig noll val', async ({ page }) => {
    await medSkugga(page);
    await medKategorier(page, []);

    await oppnaInstallningar(page);
    await expect(kort(page)).toHaveCount(4);
  });

  test('gar configen inte att hamta ritas bannerns fyra', async ({ page }) => {
    await medSkugga(page);
    await page.addInitScript((k) => {
      window.SEOS_SITE_KEY = k;
    }, NYCKEL);
    await page.route('**/config/**', (route) => route.abort('failed'));

    await oppnaInstallningar(page);
    await expect(kort(page)).toHaveCount(4);
  });

  test('en okand kategori ritas inte - bannern har ingen text for den', async ({ page }) => {
    await medSkugga(page);
    await medKategorier(page, [
      { key: 'necessary', is_required: true },
      { key: 'analytics', is_required: false },
      { key: 'sociala-medier', is_required: false },
    ]);

    await oppnaInstallningar(page);
    await expect(kort(page)).toHaveCount(2);
    await expect(page.locator('#sociala-medier-toggle')).toHaveCount(0);
  });

  test('nodvandiga gar inte att stanga av, aven om databasen pastar det', async ({ page }) => {
    await medSkugga(page);
    await medKategorier(page, [
      { key: 'necessary', is_required: false },
      { key: 'analytics', is_required: false },
    ]);

    await oppnaInstallningar(page);

    // Kortet ska fortfarande vara last: inget id, inget vaxlingsattribut.
    await expect(page.locator('#necessary-toggle')).toHaveCount(0);
    const forstaKort = kort(page).first();
    await expect(forstaKort.locator('.badge')).toBeVisible();
    await expect(forstaKort.locator('button')).toBeDisabled();
  });

  test('en dold kategori skickas som false vid acceptera alla', async ({ page }) => {
    // Bevisloggen far aldrig pasta att besokaren samtyckt till nagot hen
    // aldrig blev tillfragad om.
    await medSkugga(page);
    await medKategorier(page, [
      { key: 'necessary', is_required: true },
      { key: 'analytics', is_required: false },
    ]);
    const skickat = await fangaConsent(page);

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-save').click();
    await page.waitForFunction(() => document.cookie.includes('consent_status'));

    expect(skickat).toHaveLength(1);
    expect(skickat[0].status).toBe('all');
    expect(skickat[0].necessary).toBe(true);
    expect(skickat[0].analytics).toBe(true);
    // Visades aldrig - alltsa inget samtycke.
    expect(skickat[0].functional).toBe(false);
    expect(skickat[0].marketing).toBe(false);
  });

  test('en dold kategori skickas som false nar installningar sparas', async ({ page }) => {
    await medSkugga(page);
    await medKategorier(page, [
      { key: 'necessary', is_required: true },
      { key: 'marketing', is_required: false },
    ]);
    const skickat = await fangaConsent(page);

    await oppnaInstallningar(page);
    await page.locator('#marketing-toggle').click();
    await page.locator('#cookie-settings .btn-save').click();
    await page.waitForFunction(() => document.cookie.includes('consent_status'));

    expect(skickat).toHaveLength(1);
    expect(skickat[0].status).toBe('custom');
    expect(skickat[0].marketing).toBe(true);
    expect(skickat[0].analytics).toBe(false);
    expect(skickat[0].functional).toBe(false);
  });

  test('payloadens form ar oforandrad - fyra fasta falt', async ({ page }) => {
    // Formen far inte andras: validatorn, consent.ts och bevisloggens struktur
    // hanger pa den. Bara vardena foljer vad som visades.
    await medSkugga(page);
    await medKategorier(page, [{ key: 'necessary', is_required: true }]);
    const skickat = await fangaConsent(page);

    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .btn-save').click();
    await page.waitForFunction(() => document.cookie.includes('consent_status'));

    for (const falt of ['necessary', 'analytics', 'marketing', 'functional']) {
      expect(typeof skickat[0][falt]).toBe('boolean');
    }
  });
});

test.describe('Rullning i policyrutan', () => {
  /**
   * Harmar ett bibliotek for mjuk rullning (Lenis, Locomotive, GSAP
   * ScrollSmoother): en global lyssnare som tar hjulhandelsen och rullar
   * sidan sjalv. Precis det som gor policyn olasbar pa www.brevenshus.se.
   */
  async function medMjukRullning(page) {
    await page.addInitScript(() => {
      window.__kapade = 0;
      window.addEventListener(
        'wheel',
        (e) => {
          window.__kapade++;
          e.preventDefault();
        },
        { passive: false }
      );
    });
  }

  async function oppnaPolicy(page) {
    await page.route('**/policy/latest*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '1.0.3',
          content:
            '<div>' +
            '<h3>Avsnitt</h3><p>' +
            'Lang text. '.repeat(60) +
            '</p>'.repeat(1) +
            ('<h3>Mer</h3><p>' + 'Lang text. '.repeat(60) + '</p>').repeat(8) +
            '</div>',
        }),
      })
    );
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();
    await page.locator('#cookie-banner .policy-link').click();
    await expect(page.locator('#cookie-policy')).toBeVisible();
    await page.waitForFunction(() => {
      const s = window.skugga();
      const c = s.getElementById('policy-content-area');
      return c && c.textContent.length > 400;
    });
    await page.waitForTimeout(300);
  }

  const rullning = (page) =>
    page.evaluate(() =>
      Math.round(window.skugga().getElementById('policy-content-area').parentElement.scrollTop)
    );

  const rullaMed = async (page, delta) => {
    const box = await page.locator('#cookie-policy').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(300);
  };

  test('policyn gaar att rulla aven med ett mjukrullningsbibliotek pa sidan', async ({ page }) => {
    // Skarpt fel pa brevenshus 2026-08-21: Lenis kapade hjulet och cirka 60 %
    // av policytexten gick inte att na. Sist av allt star policyversionen.
    await medSkugga(page);
    await medMjukRullning(page);
    await oppnaPolicy(page);

    expect(await rullning(page)).toBe(0);
    await rullaMed(page, 400);
    expect(await rullning(page)).toBeGreaterThan(10);
  });

  test('sidan bakom rullar fortfarande nar policyn ar slut', async ({ page }) => {
    // Skyddet mot att fixen blir for girig. Utan villkoret "kan rutan rulla
    // vidare?" hade muspekaren over bannern last sidan - och ett test som
    // bara kontrollerar att policyn rullar hade inte upptackt det.
    await medSkugga(page);
    await medMjukRullning(page);
    await oppnaPolicy(page);

    // Rulla policyn hela vagen ner.
    await page.evaluate(() => {
      const b = window.skugga().getElementById('policy-content-area').parentElement;
      b.scrollTop = b.scrollHeight;
    });
    await page.waitForTimeout(200);

    const fore = await page.evaluate(() => window.__kapade);
    await rullaMed(page, 400);
    const efter = await page.evaluate(() => window.__kapade);

    // Handelsen slapptes igenom till sidan, alltsa nadde den den globala
    // lyssnaren. Hade vi behallit den hade raknaren statt stilla.
    expect(efter).toBeGreaterThan(fore);
  });

  test('hjulet over bannern i viloläge rullar sidan, inte bannern', async ({ page }) => {
    // Sjalva bannern ar inte rullbar. Da ska ingenting fangas alls.
    await medSkugga(page);
    await medMjukRullning(page);
    await page.goto(SIDA.utanPixel);
    await expect(page.locator('#cookie-banner')).toBeVisible();

    const fore = await page.evaluate(() => window.__kapade);
    const box = await page.locator('#cookie-banner').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.__kapade)).toBeGreaterThan(fore);
  });

  test('rullningsstapeln syns och foljer sajtens fargskala', async ({ page }) => {
    // Stapeln var tidigare dold med flit. Det sag renare ut men tog bort den
    // enda markeringen for att det finns mer att lasa - och i policyrutan
    // finns ingen annan, eftersom toningen bara hor till installningsrutan.
    await medSkugga(page);
    await oppnaPolicy(page);

    const stil = await page.evaluate(() => {
      const b = window.skugga().getElementById('policy-content-area').parentElement;
      const s = getComputedStyle(b);
      return { bredd: s.scrollbarWidth, farg: s.scrollbarColor };
    });
    expect(stil.bredd).not.toBe('none');
    expect(stil.farg).not.toBe('auto');
  });
});
