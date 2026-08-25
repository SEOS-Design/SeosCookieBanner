// KALLKOD. Den har filen laddas aldrig direkt av en webblasare - den byggs till
// src/v1/banner.js av build.js. Darfor ligger den utanfor src/, som Vercel
// publicerar rakt av.
//
// Stilmallen och DOMPurify bakas in i den byggda filen i stallet for att hamtas
// som separata anrop vid korning. DOMPurify tas in fardigminifierad: den byggda
// filen committas och ska ga att granska i en diff, och da ska bibliotekets
// ~29 kB ligga pa en rad i stallet for att dranka var egen kod.
//
// Stilmallen ligger i banner-src/ av samma skal som den har filen: den gamla
// bannern hamtar src/css/style.css som <link>, och tillvaxtstod.se gor det
// fortfarande. Shadow DOM kraver :host dar den gamla kraver :root - samma fil
// kan inte vara bada. Den frusna kopian i src/css/ ror vi inte forran alla
// sajter bytt scripttagg.
import DOMPurify from 'dompurify/dist/purify.min.js';
import bannerCss from './style.css';

// Hela bannern korrs i en egen funktion (IIFE) sa att inga variabler hamnar i
// sidans globala scope. Utan detta kraschar HELA skriptet med SyntaxError om
// kundens sajt rakar deklarera samma namn - t.ex. 'const t' - eftersom
// top-level const/let delar scope mellan alla skript pa sidan.
// Nagra funktioner ligger pa window som publikt API for kundsajter.
(function () {
  const PRODUCTION_API_URL = 'https://seos-cookie-banner-api.vercel.app';

  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const API_BASE_URL = isLocalhost ? 'http://127.0.0.1:3000' : PRODUCTION_API_URL;

  let client_consent_id_cache = null;

  // Samtyckescookien satts pa full livslangd direkt sedan C4. Tidigare sattes
  // den pa en timme och uppgraderades till 30 dagar forst nar API:t bekraftat -
  // men det innebar att bannern kom tillbaka och fragade om samma sak sa fort
  // skrivningen missades. Nu tar retry-kon hand om beviset i stallet.
  const LONG_LIVED_COOKIE_DAYS = 30;

  const BANNER_ID = 'cookie-banner';
  const SETTINGS_ID = 'cookie-settings';
  const POLICY_ID = 'cookie-policy';

  // Vardelementets id. Behalls fran tiden fore Shadow DOM med flit: kunder har
  // designblock som satter CSS-variabler pa just det har id:t, och variabler arvs
  // in genom skuggan. Byter vi namn slutar deras formgivning fungera.
  const HOST_ID = 'cookie-sectionId';

  // Bannerns skuggrot. All bannerns HTML och CSS ligger harinne, avskarmad fran
  // kundens sida: deras CSS nar inte in, var nar inte ut.
  let shadow = null;

  // Alla uppslag av bannerns egna element gar mot skuggan, aldrig mot document.
  // Element pa kundens sida (t.ex. #open-cookie-settings) slas fortfarande upp
  // med document - de ligger utanfor skuggan.
  function el(id) {
    return shadow ? shadow.getElementById(id) : null;
  }

  // Sätt till true för utförlig konsolloggning vid felsökning. Tyst i produktion.
  const DEBUG = false;
  function log(...args) {
    if (DEBUG) console.log(...args);
  }

  //========================================================================
  // TRANSLATIONS
  //========================================================================

  const translations = {
    en: {
      bannerTitle: 'We value your privacy',
      bannerBody:
        'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      policyLink: 'Read our Cookie policy',
      customize: 'Customize',
      necessaryOnly: 'Necessary only',
      acceptAll: 'Accept all',
      settingsTitle: 'Cookie Settings',
      settingsBody: 'Manage your preferences below. Strictly necessary cookies are always active.',
      necessaryLabel: 'Strictly Necessary',
      requiredBadge: 'REQUIRED',
      necessaryDesc: 'Essential for the website to function properly.',
      analyticsLabel: 'Analytics and Performance',
      analyticsDesc: 'Helps us understand how the website is used.',
      functionalLabel: 'Functional',
      functionalDesc: 'Remembers your personal preferences.',
      marketingLabel: 'Marketing',
      marketingDesc: 'Used to deliver relevant ads and track visitors.',
      returnBtn: 'Return',
      savePreferences: 'Save preferences',
      policyTitle: 'Cookie Policy',
      policyLoading: 'Loading cookie policy...',
      policyErrorTitle: 'Could not load policy.',
      policyErrorBody: 'Could not find an active policy for this domain.',
      policyNetworkTitle: 'Network Error',
      policyNetworkBody: 'Could not connect to the server to fetch policy.',
      close: 'Close',
    },
    sv: {
      bannerTitle: 'Vi värnar om din integritet',
      bannerBody:
        'Vi använder cookies för att förbättra din upplevelse, visa anpassat innehåll och analysera vår trafik. Genom att klicka på "Acceptera alla" godkänner du vår användning av cookies.',
      policyLink: 'Läs vår cookiepolicy',
      customize: 'Anpassa',
      necessaryOnly: 'Endast nödvändiga',
      acceptAll: 'Acceptera alla',
      settingsTitle: 'Cookieinställningar',
      settingsBody: 'Hantera dina inställningar nedan. Strikt nödvändiga cookies är alltid aktiva.',
      necessaryLabel: 'Strikt nödvändiga',
      requiredBadge: 'KRÄVS',
      necessaryDesc: 'Nödvändiga för att webbplatsen ska fungera korrekt.',
      analyticsLabel: 'Analys och prestanda',
      analyticsDesc: 'Hjälper oss förstå hur webbplatsen används.',
      functionalLabel: 'Funktionella',
      functionalDesc: 'Kommer ihåg dina personliga inställningar.',
      marketingLabel: 'Marknadsföring',
      marketingDesc: 'Används för att visa relevanta annonser och spåra besökare.',
      returnBtn: 'Tillbaka',
      savePreferences: 'Spara inställningar',
      policyTitle: 'Cookiepolicy',
      policyLoading: 'Hämtar cookiepolicy...',
      policyErrorTitle: 'Kunde inte ladda policyn.',
      policyErrorBody: 'Hittade ingen aktiv policy för den här domänen.',
      policyNetworkTitle: 'Nätverksfel',
      policyNetworkBody: 'Kunde inte ansluta till servern för att hämta policyn.',
      close: 'Stäng',
    },
  };

  // Site key identifierar sajten hos API:t. Lases fran scripttaggens
  // data-site-key, eller window.SEOS_SITE_KEY. Saknas den faller API:t
  // tillbaka pa domannamnet (overgangslosning).
  const selfScript =
    document.currentScript || document.querySelector('script[src*="seos-cookie-banner"]');
  const SITE_KEY =
    (selfScript && selfScript.dataset && selfScript.dataset.siteKey) ||
    window.SEOS_SITE_KEY ||
    null;

  //========================================================================
  // DESIGN FRAN DATABASEN (C1 steg 1)
  //========================================================================
  //
  // Sajtens farger, typsnitt och radier hamtas fran API:t i stallet for att
  // lasas ur ett designblock i kundens <head>. En omdesign blir da ett
  // databasvarde: ingen kod, ingen deploy, ingen atkomst till kundens sajt.
  //
  // TVA SAKER SOM GOR DET OFARLIGT:
  //
  // 1. Vardena skrivs med style.setProperty(), alltsa in i CSS-motorn som
  //    VARDEN. De tolkas aldrig som HTML eller JavaScript. Det ar skalet till
  //    att det har steget saknar den XSS-yta som texter fran databasen har.
  // 2. Bannern applicerar bara variabler den kanner igen. Listan nedan ar
  //    medvetet en KOPIA av den i API:ts routes/config.ts. Driver de isar
  //    galler snittet - en variabel slutar fungera, i stallet for att en
  //    okand variabel borjar galla. Fel at ratt hall.
  //
  // GEOMETRI SAKNAS MED FLIT. Bredd, textstorlekar, mellanrum och radhojder
  // ska vara lika pa alla sajter - bannern ska kannas som samma komponent
  // overallt men bara kundens uttryck. Ser storleken fel ut ska basvardet i
  // style.css rattas, sa att andringen nar alla sajter.
  const DESIGNVARIABLER = new Set([
    'bg-main',
    'bg-muted',
    'text-main',
    'text-muted',
    'accent-color',
    'accent-hover',
    'bg-dark-btn',
    'border-color',
    'btn-border',
    'logo-color',
    'bg-logo-wrapper',
    'bg-customize-btn',
    'toggle-switch-bg',
    'toggle-circle',
    'btn-accent-text',
    'btn-hover-filter',
    'btn-secondary-hover-bg',
    'btn-secondary-hover-filter',
    'fokus-ring',
    'scrollbar-thumb',
  'policy-link-color',
    'badge-text-color',
    'scroll-gradient',
    'main-font',
    'header-font',
    'radius-sm',
    'radius-md',
    'radius-lg',
  ]);

  // url() stangs ute aven har: ett CSS-varde som hamtar nagot fran en adress
  // vi inte valt vore en vag att spara besokare. API:t filtrerar redan, men en
  // banner som litar blint pa ett svar ar en banner som bryts den dagen svaret
  // inte kommer fran oss.
  const FARLIGT_VARDE = /url\(|expression\(|javascript:|@import|[<>{}\\;]/i;

  // Hur lange bannern vantar pa designen innan den visar sig anda. Vid trafik
  // ligger svaret pa CDN:et och kommer pa nagra tiotals millisekunder; grensen
  // slar bara till vid kall cache eller stromavbrott i andra anden.
  const DESIGN_TIDSGRANS_MS = 800;

  let hamtadDesign = null;

  /** Skriver de hamtade vardena som CSS-variabler pa vardelementet. */
  function tillampaDesign() {
    if (!hamtadDesign) return;
    const host = document.getElementById(HOST_ID);
    if (!host) return;

    for (const nyckel in hamtadDesign) {
      host.style.setProperty('--' + nyckel, hamtadDesign[nyckel]);
    }
  }

  /**
   * FARSKLAGE - for den som designar, inte for besokare.
   *
   * Configen cachas en timme pa CDN:et. Det ar ratt for besokare men fel for
   * den som sitter och justerar farger: en andring skulle synas forst nasta
   * timme. Lagg till ?seos_farsk=1 i adressen (eller satt window.SEOS_FARSK)
   * sa gar just den sidladdningen forbi cachen och hamtar direkt ur databasen.
   *
   * Kostar ingenting i drift: bara den som sjalv ber om det gar forbi cachen,
   * och det ar en manniska at gangen. Ger heller ingen ny angreppsyta -
   * policy-endpointen ar redan ocachad och traffar databasen pa samma satt.
   */
  function farsklage() {
    try {
      if (window.SEOS_FARSK) return true;
      return new URLSearchParams(window.location.search).has('seos_farsk');
    } catch (e) {
      return false;
    }
  }

  async function hamtaDesign() {
    // Utan site key finns inget att sla upp. Bannern kor sina standardvarden.
    if (!SITE_KEY) return {};

    const styrning = new AbortController();
    const klocka = setTimeout(() => styrning.abort(), DESIGN_TIDSGRANS_MS);

    try {
      // Tidsstampeln gor adressen unik, sa CDN:et inte kan svara ur cachen.
      // API:t ser samma parameter och hoppar over sin egen minnescache.
      const adress =
        `${API_BASE_URL}/config/${encodeURIComponent(SITE_KEY)}` +
        (farsklage() ? `?farsk=${Date.now()}` : '');

      const svar = await fetch(adress, { signal: styrning.signal });
      if (!svar.ok) return {};

      const data = await svar.json();
      const design = data && data.design;
      if (!design || typeof design !== 'object') return {};

      const rensad = {};
      for (const nyckel in design) {
        const varde = design[nyckel];
        if (!DESIGNVARIABLER.has(nyckel)) continue;
        if (typeof varde !== 'string' || !varde || varde.length > 200) continue;
        if (FARLIGT_VARDE.test(varde)) continue;
        rensad[nyckel] = varde;
      }
      return rensad;
    } catch (fel) {
      // Avbrott, natverksfel eller trasigt svar: bannern ska visa sig anda.
      // En banner som uteblir for att designen inte gick att hamta vore ett
      // mycket varre fel an en banner i fel farger.
      log('[Design] Kunde inte hamta config:', fel && fel.message);
      return {};
    } finally {
      clearTimeout(klocka);
    }
  }

  let designLoftet = null;

  /** Hamtar designen hogst en gang, oavsett hur manga som fragar. */
  function sakerstallDesign() {
    if (!designLoftet) {
      designLoftet = hamtaDesign().then((design) => {
        hamtadDesign = design;
        tillampaDesign();
        return design;
      });
    }
    return designLoftet;
  }

  // HAMTAS BARA NAR DEN BEHOVS.
  //
  // Har besokaren redan samtyckt visas bannern aldrig - den doljs direkt i
  // initieringen. Att da hamta farger vore ett anrop per sidvisning for ett
  // element ingen ser, och de sidvisningarna ar de allra flesta.
  //
  // Det spelar roll bortom snalhet: /config ar den enda trafik som sker per
  // SIDVISNING i stallet for per besokare, och varje anrop som nar fram till
  // databasen haller Neon vaken i minst fem minuter. Se kommentaren om
  // CU-timmar i API:ts routes/config.ts.
  //
  // Behovs designen anda senare - nagon oppnar installningarna - hamtas den da.
  //
  // Startas HAR och inte i initializeBanner(): da loper hamtningen parallellt
  // med att sidan bygger klart och med de 50 ms som initieringen anda vantar.
  // Svaret ar darfor oftast framme innan bannern ska visas.
  if (!getCookie('consent_status')) sakerstallDesign();

  // Meta-pixel: sätt data-meta-pixel-id på scripttaggen sa laddar bannern
  // pixeln FORST vid samtycke till marknadsforing. Ingen pixelkod ska ligga
  // i sajtens HTML - da kontaktas Facebook redan vid sidladdning.
  const META_PIXEL_ID =
    (selfScript && selfScript.dataset && selfScript.dataset.metaPixelId) ||
    window.SEOS_META_PIXEL_ID ||
    null;
  let metaPixelLoaded = false;

  // Språk: sätt window.SEOS_COOKIE_LANG = 'sv' på sajten för att styra ENBART bannern.
  // Utan override används sidans <html lang>, annars engelska.
  const pageLang = (window.SEOS_COOKIE_LANG || document.documentElement.lang || '')
    .split('-')[0]
    .toLowerCase();
  const t = translations[pageLang] || translations['en'];

  //========================================================================
  // HTML INJECTION for easy plug in
  //========================================================================

  // Kategorikorten. Reglaget ar en RIKTIG <button role="switch"> och inte en
  // <div> - annars gar det varken att na med tangentbord eller att lasa upp med
  // skarmlasare, och da kan besokaren inte gora ett specifikt val per kategori.
  // Kortet i sin helhet ar fortfarande klickbart: klicket bubblar upp fran
  // knappen till kortets data-handling, sa bada vagarna ger exakt ett omslag.
  function kategoriKort() {
    const kategorier = [
      {
        id: 'necessary',
        etikett: `${t.necessaryLabel} <span class="badge">${t.requiredBadge}</span>`,
        text: t.necessaryDesc,
        last: true,
      },
      {
        id: 'performance',
        reglage: 'performance-toggle',
        etikett: t.analyticsLabel,
        text: t.analyticsDesc,
      },
      {
        id: 'functional',
        reglage: 'functional-toggle',
        etikett: t.functionalLabel,
        text: t.functionalDesc,
      },
      {
        id: 'marketing',
        reglage: 'marketing-toggle',
        etikett: t.marketingLabel,
        text: t.marketingDesc,
      },
    ];

    return kategorier
      .map((k) => {
        const kortAttribut = k.last ? '' : ` data-handling="vaxla" data-reglage="${k.reglage}"`;
        const knappAttribut = k.last
          ? 'class="toggle-switch always-active" aria-checked="true" disabled'
          : `class="toggle-switch" id="${k.reglage}" aria-checked="false"`;

        return `
          <div class="cookie-category-card"${kortAttribut}>
            <div class="category-text-wrapper">
              <h5 id="etikett-${k.id}">${k.etikett}</h5>
              <p id="text-${k.id}">${k.text}</p>
            </div>
            <button type="button" role="switch" ${knappAttribut}
              aria-labelledby="etikett-${k.id}" aria-describedby="text-${k.id}">
              <span class="toggle-slider"></span>
            </button>
          </div>`;
      })
      .join('');
  }

  function injectBannerHTML() {
    if (document.getElementById(HOST_ID)) return;

    const cookieIconSVG = `
      <svg class="cookie-icon-svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10C18.0222 10 16.0888 10.5865 14.4443 11.6853C12.7998 12.7841 11.5181 14.3459 10.7612
  16.1732C10.0043 18.0004 9.8063 20.0111 10.1922 21.9509C10.578 23.8907 11.5304 25.6725 12.9289 27.0711C14.3275 28.4696
  16.1093 29.422 18.0491 29.8079C19.9889 30.1937 21.9996 29.9957 23.8268 29.2388C25.6541 28.4819 27.2159 27.2002 28.3147
   25.5557C29.4135 23.9112 30 21.9778 30 20C29.305 20.214 28.5648 20.2345 27.8591 20.0593C27.1533 19.8841 26.5087
  19.5198 25.9945 19.0056C25.4803 18.4913 25.116 17.8467 24.9407 17.1409C24.7655 16.4352 24.786 15.695 25 15C24.305
  15.214 23.5648 15.2345 22.8591 15.0593C22.1533 14.8841 21.5087 14.5198 20.9945 14.0056C20.4803 13.4913 20.116 12.8467
  19.9407 12.1409C19.7655 11.4352 19.786 10.695 20 10Z" />
        <path d="M16.5 16.5V16.51" /><path d="M24 23.5V23.51" /><path d="M20 20V20.01" /><path d="M19 25V25.01" /><path
  d="M15 22V22.01" />
      </svg>`;

    // Inga inline-onclick langre. Knapparna markeras med data-handling och kopplas
    // med addEventListener nedan. Battre for tillganglighet (C8), och en
    // forutsattning for att kunna sluta lagga funktioner pa window.
    const bannerHTML = `
  <section class="cookie-section" lang="${pageLang || 'en'}">

    <div class="cookie" id="${BANNER_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="rubrik-banner">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="rubrik-banner">${t.bannerTitle}</h2>
      </div>
      <div class="cookie-content">
        <div class="cookie-body">
          <p>${t.bannerBody}
          <a class="policy-link" href="#" data-handling="visaPolicy"> ${t.policyLink}</a></p>
        </div>
      </div>
      <div class="cookie-buttons">
        <button class="btn-customize" data-handling="oppnaInstallningar">${t.customize}
          <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round"
  stroke-linejoin="round">
            <path d="M9.33334 11.3333H3.33334" /><path d="M12.6667 4.66666H6.66666" />
            <path d="M11.3333 13.3333C12.4379 13.3333 13.3333 12.4379 13.3333 11.3333C13.3333 10.2288 12.4379 9.33334
  11.3333 9.33334C10.2288 9.33334 9.33334 10.2288 9.33334 11.3333C9.33334 12.4379 10.2288 13.3333 11.3333 13.3333Z" />
            <path d="M4.66666 6.66666C5.77123 6.66666 6.66666 5.77123 6.66666 4.66666C6.66666 3.56209 5.77123 2.66666
  4.66666 2.66666C3.56209 2.66666 2.66666 3.56209 2.66666 4.66666C2.66666 5.77123 3.56209 6.66666 4.66666 6.66666Z" />
          </svg>
        </button>
        <div class="main-actions">
          <button class="btn-reject" data-handling="endastNodvandiga">${t.necessaryOnly}</button>
          <button class="btn-save" data-handling="acceptaAlla">${t.acceptAll}</button>
        </div>
      </div>
    </div>

    <div class="cookie" id="${SETTINGS_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="rubrik-installningar">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="rubrik-installningar">${t.settingsTitle}</h2>
      </div>
      <div class="cookie-content" id="scroll-area">
        <div class="cookie-body">
          <p>${t.settingsBody}</p>
        </div>
        <div id="settings-container" class="cookie-settings-container">
          ${kategoriKort()}
        </div>
      </div>
      <div class="scroll-shadow" id="bottom-shadow"></div>
      <div class="cookie-buttons">
        <button class="btn-back" data-handling="tillbaka">${t.returnBtn}</button>
        <div class="main-actions">
          <button class="btn-reject" data-handling="endastNodvandiga">${t.necessaryOnly}</button>
          <button class="btn-save" data-handling="sparaInstallningar">${t.savePreferences}</button>
        </div>
      </div>
    </div>

    <div class="cookie" id="${POLICY_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="policy-version-title">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="policy-version-title">${t.policyTitle}</h2>
      </div>
      <div class="cookie-content">
        <div id="policy-content-area"><p>${t.policyLoading}</p></div>
      </div>
      <div class="cookie-buttons">
        <div class="main-actions">
          <button class="btn-save" data-handling="stangPolicy">${t.close}</button>
        </div>
      </div>
    </div>

  </section>`;

    // Vardelementet ligger kvar i kundens sida - det ar dar deras CSS-variabler
    // satts. Allt innehall hamnar innanfor skuggan.
    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);

    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.id = 'seos-cookie-css';
    style.textContent = bannerCss;
    shadow.appendChild(style);

    // Ett template i stallet for shadow.innerHTML: annars skrivs stilmallen over.
    const mall = document.createElement('template');
    mall.innerHTML = bannerHTML;
    shadow.appendChild(mall.content);

    kopplaHandelser();
    kopplaTangentbord();
    kopplaRullning();
  }

  // En enda lyssnare pa skuggroten i stallet for atta inline-onclick. Klick
  // bubblar upp hit, och data-handling avgor vad som ska kora.
  function kopplaHandelser() {
    const handlingar = {
      visaPolicy: showPolicy,
      oppnaInstallningar: openSettings,
      endastNodvandiga: acceptEssential,
      acceptaAlla: acceptAll,
      sparaInstallningar: saveSettings,
      tillbaka: backToBanner,
      stangPolicy: closePolicy,
      vaxla: (element) => toggleCookie(el(element.dataset.reglage)),
    };

    shadow.addEventListener('click', (handelse) => {
      const traff = handelse.target.closest('[data-handling]');
      if (!traff) return;
      const kor = handlingar[traff.dataset.handling];
      if (!kor) return;
      handelse.preventDefault();
      kor(traff);
    });
  }

  //========================================================================
  // COOKIE HELPERS
  //========================================================================

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    console.warn('[Crypto] randomUUID saknas, använder fallback-metod');
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';

    if (
      !isSecure &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.hostname !== 'localhost'
    ) {
      console.warn('[Security] Insecure cookie - deploy with HTTPS!');
    }
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  }

  function getCookie(name) {
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find((c) => c.startsWith(name + '='));
    if (!cookie) return null;
    const raw = cookie.slice(name.length + 1);
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  }

  function getOrCreateClientId() {
    if (client_consent_id_cache) {
      log('cache exists with: ', client_consent_id_cache);
      return client_consent_id_cache;
    }

    let clientId = getCookie('client_consent_id');
    log('Client ID: ', clientId);
    if (!clientId) {
      log('Generating new guid');
      clientId = generateUUID();
      setCookie('client_consent_id', clientId, 365);
      log('Setting cookie: ', clientId);
    }

    client_consent_id_cache = clientId;
    return clientId;
  }

  //========================================================================
  // BANNER VISIBILITY CONTROL
  //========================================================================

  // Fokushantering.
  //
  // Utan detta hander ingenting for den som navigerar med tangentbord nar en ruta
  // oppnas: fokus star kvar dar det stod, och rutan ar i praktiken osynlig. Vid
  // stangning ska fokus tillbaka dit det kom ifran, annars kastas anvandaren ut
  // till sidans borjan.
  //
  // Rutorna ar INTE modala - sidan bakom gar fortfarande att anvanda. Darfor
  // fangas fokus inte in, och aria-modal satts inte. En cookiebanner som lasar
  // hela sidan ar dessutom tveksam ur samtyckessynpunkt.
  let fokusFore = null;

  function flyttaFokusTill(ruta) {
    if (!ruta) return;
    // Fokus gar till RUTAN, inte till forsta knappen. Da laser skarmlasaren upp
    // rubriken (via aria-labelledby) i stallet for att kasta in anvandaren mitt i
    // en knapprad. Rutorna har darfor tabindex="-1".
    //
    // Forsta forsoket tog forsta <button> - men det ar den inaktiverade
    // nodvandig-knappen, och inaktiverade element kan inte ta emot fokus. Fokus
    // hamnade darfor ingenstans alls.
    ruta.focus();
  }

  function kommIhagFokus() {
    const aktiv = shadow && shadow.activeElement ? shadow.activeElement : document.activeElement;
    if (aktiv) fokusFore = aktiv;
  }

  function aterstallFokus() {
    if (fokusFore && typeof fokusFore.focus === 'function') fokusFore.focus();
    fokusFore = null;
  }

  // Escape stanger den oppna rutan. Forvantat beteende for allt som ser ut som
  // en dialog, och WCAG 2.1.2: man ska alltid kunna ta sig ut med tangentbordet.
  //========================================================================
  // RULLNING INUTI BANNERN
  //========================================================================
  //
  // Bannern maste fungera pa vilken kundsajt som helst - aven pa sajter med
  // ett bibliotek for MJUK RULLNING (Lenis, Locomotive, GSAP ScrollSmoother).
  // De lyssnar pa hjulhandelser globalt och rullar sidan sjalva i stallet for
  // att lata webblasaren gora det.
  //
  // ⚠️ SKARPT FEL, uppmatt pa www.brevenshus.se 2026-08-21: policyrutan gick
  // INTE att rulla med mus. Cirka 60 procent av texten var oatkomlig, och
  // sist av allt star vilken policyversion besokaren fick se. Ett samtycke
  // ska vara informerat - texten maste ga att lasa i sin helhet fore valet.
  //
  // Orsaken ar Shadow DOM: for en lyssnare utanfor skuggan pekar
  // event.target pa VARDELEMENTET, inte pa rutan inuti. Biblioteket kan
  // darfor inte veta att det finns nagot rullbart darinne, tar handelsen och
  // gor ingenting med den.
  //
  // Losningen ar avsiktligt kirurgisk: vi behaller handelsen BARA nar den
  // inre rutan faktiskt kan rulla vidare at det hallet. Kan den inte det -
  // rutan ar slut, eller det finns inget rullbart alls - slapps handelsen
  // igenom och sidan bakom rullar som vanligt.
  //
  // Utan det villkoret hade rullningen kants klibbig: muspekaren over
  // bannern hade last sidan. Ett eget test skyddar just det, eftersom ett
  // test som bara kontrollerar att policyn rullar inte hade upptackt det.
  //
  // Losningen ar oberoende av vilket bibliotek kunden anvander - vi ror
  // aldrig deras kod, bara var egen handelse.
  function rullbarRuta(handelse) {
    const vag = typeof handelse.composedPath === 'function' ? handelse.composedPath() : [];
    for (const nod of vag) {
      // Stanna vid skuggans kant: utanfor den ar det kundens sida.
      if (nod === shadow || nod === shadow.host) break;
      if (!nod || nod.nodeType !== 1) continue;
      const stil = window.getComputedStyle(nod);
      const rullbar = stil.overflowY === 'auto' || stil.overflowY === 'scroll';
      if (rullbar && nod.scrollHeight > nod.clientHeight + 1) return nod;
    }
    return null;
  }

  function kopplaRullning() {
    if (!shadow) return;
    shadow.addEventListener(
      'wheel',
      (handelse) => {
        const ruta = rullbarRuta(handelse);
        if (!ruta) return;

        const nedat = handelse.deltaY > 0;
        const kanRullaVidare = nedat
          ? ruta.scrollTop < ruta.scrollHeight - ruta.clientHeight - 1
          : ruta.scrollTop > 0;

        // Behall handelsen bara nar rutan har nagonstans att ta vagen.
        if (kanRullaVidare) handelse.stopPropagation();
      },
      true
    );
  }

  function kopplaTangentbord() {
    shadow.addEventListener('keydown', (handelse) => {
      if (handelse.key !== 'Escape') return;
      const installningar = el(SETTINGS_ID);
      const policy = el(POLICY_ID);
      if (policy && policy.style.display !== 'none') {
        handelse.preventDefault();
        closePolicy();
      } else if (installningar && installningar.style.display !== 'none') {
        handelse.preventDefault();
        backToBanner();
      }
    });
  }

  function hideAllBanners() {
    el(BANNER_ID).style.display = 'none';
    el(SETTINGS_ID).style.display = 'none';
    el(POLICY_ID).style.display = 'none';
  }

  function showCookieBanner() {
    hideAllBanners();
    el(BANNER_ID).style.display = 'flex';
  }

  function showSettingsModal() {
    kommIhagFokus();
    hideAllBanners();
    const ruta = el(SETTINGS_ID);
    ruta.style.display = 'flex';
    flyttaFokusTill(ruta);
  }

  function showPolicyModal() {
    kommIhagFokus();
    hideAllBanners();
    const ruta = el(POLICY_ID);
    ruta.style.display = 'flex';
    flyttaFokusTill(ruta);
  }

  //========================================================================
  // CONSENT PAYLOAD BUILDERS
  //========================================================================

  function acceptAllConsent() {
    const clientId = getOrCreateClientId();

    return {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      client_id: clientId,
      site_key: SITE_KEY,
      domain: window.location.hostname,
      status: 'all',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }

  function acceptEssentialConsent() {
    const clientId = getOrCreateClientId();

    return {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      client_id: clientId,
      site_key: SITE_KEY,
      domain: window.location.hostname,
      status: 'necessary_only',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }

  //========================================================================
  // BACKEND COMMUNICATION
  //========================================================================

  // RETRY-KO (C4).
  //
  // Ar API:t nere nar nagon klickar galler valet anda - taggarna staller om och
  // besokaren far det hen bad om. Men BEVISET gick tidigare forlorat, och det ar
  // hela tjanstens karnlofte. Cookien sattes dessutom pa en timme, sa bannern kom
  // tillbaka och fragade om samma sak.
  //
  // Nu: cookien satts pa full livslangd direkt, och misslyckade anrop laggs i en
  // ko som toms vid nasta sidladdning.
  //
  // Beviset forblir sant aven nar det kommer fram sent: samtyckets tidsstampel
  // ligger i det som skickas, sa ett koat samtycke loggas med tidpunkten da
  // besokaren faktiskt klickade - inte nar det rakade na fram.
  const KO_NYCKEL = 'seos_consent_ko';
  const KO_MAX_POSTER = 10;
  const KO_MAX_ALDER_DAGAR = 30;
  const KO_MAX_FORSOK = 5;

  function lasKo() {
    try {
      const rad = window.localStorage.getItem(KO_NYCKEL);
      const ko = rad ? JSON.parse(rad) : [];
      return Array.isArray(ko) ? ko : [];
    } catch (e) {
      // localStorage kan vara avstangt eller fullt. Da far kon inte finnas -
      // men samtycket ska anda ga igenom.
      return [];
    }
  }

  function skrivKo(ko) {
    try {
      if (ko.length) window.localStorage.setItem(KO_NYCKEL, JSON.stringify(ko));
      else window.localStorage.removeItem(KO_NYCKEL);
    } catch (e) {
      /* tyst: en ko som inte kan sparas ar battre an ett kraschat samtycke */
    }
  }

  /** Returnerar 'ok' | 'avvisad' (meningslost att forsoka igen) | 'fel'. */
  async function postaConsent(payload) {
    try {
      const svar = await fetch(`${API_BASE_URL}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (svar.ok) {
        log('[Backend] Consent recorded successfully');
        return 'ok';
      }

      // 4xx betyder att API:t forstod oss och sa nej - fel site key, fel origin,
      // ogiltig payload. Att skicka om det tusen ganger ger samma svar. Slang.
      if (svar.status >= 400 && svar.status < 500) {
        const detaljer = await svar.json().catch(() => ({}));
        console.error('[Backend] Consent avvisad, status:', svar.status, detaljer);
        return 'avvisad';
      }

      console.error('[Backend] Consent POST failed, status:', svar.status);
      return 'fel';
    } catch (error) {
      console.error('[Backend] Network error - could not reach server:', error);
      return 'fel';
    }
  }

  function koaConsent(payload) {
    const ko = lasKo();
    ko.push({ payload, forsok: 0 });
    // Behall de senaste. En besokare som surfar offline lange ska inte kunna
    // fylla sitt eget lagringsutrymme.
    skrivKo(ko.slice(-KO_MAX_POSTER));
    log('[Ko] Samtycke koat, poster i ko:', Math.min(ko.length, KO_MAX_POSTER));
  }

  // Toms vid varje sidladdning. Kors efter att bannern ritats sa den aldrig
  // fordrojer det besokaren ser.
  async function tomKo() {
    const ko = lasKo();
    if (!ko.length) return;

    const kvar = [];
    for (const post of ko) {
      // Ett samtycke aldre an cookiens livslangd ar inte langre aktuellt -
      // besokaren har for lange sedan fatt fragan igen.
      const alder = Date.now() - new Date(post.payload.timestamp).getTime();
      if (!(alder < KO_MAX_ALDER_DAGAR * 86400000)) continue;

      const resultat = await postaConsent(post.payload);
      if (resultat === 'ok' || resultat === 'avvisad') continue;

      post.forsok += 1;
      if (post.forsok < KO_MAX_FORSOK) kvar.push(post);
    }

    skrivKo(kvar);
    if (ko.length !== kvar.length) log('[Ko] Skickade', ko.length - kvar.length, 'koade samtycken');
  }

  async function saveConsentAndSend(payload) {
    const resultat = await postaConsent(payload);
    if (resultat === 'fel') koaConsent(payload);
  }

  //========================================================================
  // Google consent mode
  //========================================================================

  function applyGoogleConsentFromPayload(payload) {
    if (typeof gtag !== 'function') {
      console.warn('gtag is not defined, cannot apply consent');
      return;
    }
    gtag('consent', 'update', {
      analytics_storage: payload.analytics ? 'granted' : 'denied',
      ad_storage: payload.marketing ? 'granted' : 'denied',
      ad_user_data: payload.marketing ? 'granted' : 'denied',
      ad_personalization: payload.marketing ? 'granted' : 'denied',
      functionality_storage: payload.functional ? 'granted' : 'denied',
      personalization_storage: payload.functional ? 'granted' : 'denied',
      security_storage: 'granted',
    });
    log('[Google] Consent mode updated:', {
      analytics: payload.analytics ? 'granted' : 'denied',
      marketing: payload.marketing ? 'granted' : 'denied',
      functional: payload.functional ? 'granted' : 'denied',
    });
  }

  // Skapar Metas ko-funktion UTAN att ladda nagot fran Facebook. Gor att sajtens
  // egen kod kan anropa fbq('track', ...) utan att krascha, aven innan samtycke.
  // Inget natverksanrop sker har.
  function ensureFbqStub() {
    if (window.fbq) return;
    const n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
  }

  // Forst HAR kontaktas Facebook - bara efter samtycke till marknadsforing.
  function loadMetaPixel() {
    if (!META_PIXEL_ID || metaPixelLoaded) return;
    metaPixelLoaded = true;

    // Sajtens egen kod kan ha hunnit anropa fbq('track', ...) innan samtycket gavs
    // - de anropen ligger da och vantar i stubbens ko. Metas skript spelar upp kon
    // i tur och ordning och SLANGER allt som ligger fore 'init', eftersom ingen
    // pixel finns registrerad an. Darfor plockas kon ut har, init laggs forst, och
    // de vantande anropen laggs tillbaka efterat.
    //
    // Utan det har tappas t.ex. en Lead som fyras vid sidladdning: React hinner
    // montera fore bannerskriptet, sa anropet ar nastan alltid forst i kon.
    const pending = window.fbq && window.fbq.queue ? window.fbq.queue.splice(0) : [];

    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');

    pending.forEach((call) => window.fbq.queue.push(call));
    if (pending.length) log('[Meta] Koade anrop slappta efter init:', pending.length);

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);

    log('[Meta] Pixel laddad efter samtycke:', META_PIXEL_ID);
  }

  // Vid aterkallat samtycke racker det inte att sluta spara - redan satta
  // cookies ska bort. Testas pa bade exakt hostname och toppdoman.
  function deleteMetaCookies() {
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = ['', `; domain=${host}`, `; domain=.${host}`];
    if (parts.length > 2) domains.push(`; domain=.${parts.slice(-2).join('.')}`);

    ['_fbp', '_fbc'].forEach((name) => {
      domains.forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
      });
    });
    log('[Meta] Cookies rensade');
  }

  function applyMetaConsentFromPayload(payload) {
    // Sajt utan konfigurerad pixel: respektera anda en pixel som sajten lagt in sjalv.
    if (!META_PIXEL_ID) {
      if (typeof fbq === 'function') {
        fbq('consent', payload.marketing ? 'grant' : 'revoke');
      }
      return;
    }

    ensureFbqStub();

    if (payload.marketing) {
      fbq('consent', 'grant');
      loadMetaPixel();
    } else {
      fbq('consent', 'revoke');
      deleteMetaCookies();
    }

    log('[Meta] Consent:', payload.marketing ? 'grant' : 'revoke');
  }

  function triggerGTMConsentEvent() {
    if (typeof gtag === 'function') {
      gtag('event', 'consent_granted_full');
      log('[GTM] Firing custom event: consent_granted_full');
    }
  }

  function injectScriptsByConsent(payload) {}

  //========================================================================
  // USER ACTION HANDLERS
  //========================================================================

  function acceptAll() {
    const payload = acceptAllConsent();
    setCookie('consent_status', payload.status, LONG_LIVED_COOKIE_DAYS);
    hideAllBanners();
    applyGoogleConsentFromPayload(payload);
    applyMetaConsentFromPayload(payload);
    triggerGTMConsentEvent();
    injectScriptsByConsent(payload);
    saveConsentAndSend(payload);
  }

  function acceptEssential() {
    const payload = acceptEssentialConsent();
    setCookie('consent_status', payload.status, LONG_LIVED_COOKIE_DAYS);
    hideAllBanners();
    applyGoogleConsentFromPayload(payload);
    applyMetaConsentFromPayload(payload);
    saveConsentAndSend(payload);
  }

  //========================================================================
  // CUSTOM SETTINGS HANDLER
  //========================================================================

  async function openSettings() {
    // Den som redan samtyckt har aldrig behovt designen - bannern visades inte.
    // Nu ska en ruta oppnas, sa den behovs. Vantan har egen tidsgrans och
    // svaret ligger nastan alltid pa CDN:et; uteblir det oppnas rutan med
    // standardvardena i stallet for att inte oppnas alls.
    await sakerstallDesign();
    tillampaDesign();

    let choices = { analytics: false, marketing: false, functional: false };

    const status = getCookie('consent_status');
    const choicesJson = getCookie('consent_choices');

    if (status === 'all') {
      choices = { analytics: true, marketing: true, functional: true };
    } else if (status === 'necessary_only') {
      choices = { analytics: false, marketing: false, functional: false };
    } else if (choicesJson) {
      try {
        choices = JSON.parse(choicesJson);
      } catch (e) {
        console.error('Error parsing consent_choices cookie:', e);
      }
    }

    const applyToggleState = (id, isActive) => {
      const element = el(id);
      if (element) {
        element.classList.toggle('active', isActive);
        element.setAttribute('aria-checked', isActive ? 'true' : 'false');
      }
    };

    applyToggleState('performance-toggle', choices.analytics);
    applyToggleState('marketing-toggle', choices.marketing);
    applyToggleState('functional-toggle', choices.functional);

    showSettingsModal();

    setTimeout(() => {
      checkScrollStatus();
    }, 10);
  }

  function checkScrollStatus() {
    const scrollArea = el('scroll-area');
    const bottomShadow = el('bottom-shadow');

    if (scrollArea && bottomShadow) {
      const hasScroll = scrollArea.scrollHeight > scrollArea.clientHeight;

      bottomShadow.style.opacity = hasScroll ? '1' : '0';

      scrollArea.onscroll = () => {
        const scrollBottom =
          scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;

        if (scrollBottom < 15) {
          bottomShadow.style.opacity = '0';
        } else {
          bottomShadow.style.opacity = '1';
        }
      };
    }
  }

  function saveSettings() {
    const clientId = getOrCreateClientId();

    const analytics = el('performance-toggle')?.classList.contains('active') || false;
    const marketing = el('marketing-toggle')?.classList.contains('active') || false;
    const functional = el('functional-toggle')?.classList.contains('active') || false;

    const payload = {
      necessary: true,
      analytics: analytics,
      marketing: marketing,
      functional: functional,
      client_id: clientId,
      site_key: SITE_KEY,
      domain: window.location.hostname,
      status: 'custom',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const choices = { analytics, marketing, functional };
    setCookie('consent_choices', JSON.stringify(choices), LONG_LIVED_COOKIE_DAYS);

    setCookie('consent_status', 'custom', LONG_LIVED_COOKIE_DAYS);

    applyGoogleConsentFromPayload(payload);
    applyMetaConsentFromPayload(payload);

    if (analytics) {
      triggerGTMConsentEvent();
    }

    saveConsentAndSend(payload);

    hideAllBanners();
    log('[Settings] Custom choices saved:', choices);
  }

  function backToBanner() {
    showCookieBanner();
    aterstallFokus();
  }

  function closePolicy() {
    if (getCookie('consent_status')) {
      hideAllBanners();
    } else {
      showCookieBanner();
    }
    aterstallFokus();
  }

  function toggleCookie(element) {
    if (!element) return;
    const pa = element.classList.toggle('active');
    // aria-checked ar det ENDA en skarmlasare ser. Halls den inte i takt med
    // klassen laser den upp fel svar - tyst, och varre an inget svar alls.
    element.setAttribute('aria-checked', pa ? 'true' : 'false');
  }

  //========================================================================
  // POLICY FETCHING
  //========================================================================

  async function showPolicy() {
    // Som i openSettings: nas via window.showPolicy() aven av den som redan
    // samtyckt, och da har designen aldrig hamtats.
    await sakerstallDesign();
    tillampaDesign();

    const domain = window.location.hostname;
    const policyUrl = `${API_BASE_URL}/consent/policy/latest?domain=${domain}`;

    showPolicyModal();

    const contentArea = el('policy-content-area');
    const titleArea = el('policy-version-title');

    contentArea.innerHTML = `<p>${t.policyLoading}</p>`;

    try {
      const response = await fetch(policyUrl);

      if (response.ok) {
        const data = await response.json();

        contentArea.innerHTML = DOMPurify.sanitize(data.content, {
          ADD_ATTR: ['target', 'rel'],
        });
      } else {
        titleArea.innerText = t.policyErrorTitle;
        contentArea.innerHTML = `<p>${t.policyErrorBody}</p>`;
      }
    } catch (error) {
      console.error('[Policy] Failed to fetch:', error);
      titleArea.innerText = t.policyNetworkTitle;
      contentArea.innerHTML = `<p>${t.policyNetworkBody}</p>`;
    }
  }

  //========================================================================
  // INITIALIZATION
  //========================================================================

  function loadAndApplySavedConsent() {
    const consentStatus = getCookie('consent_status');

    if (!consentStatus) {
      log('[Init] No saved consent');
      return;
    }

    log('[Init] Found saved consent:', consentStatus);

    let payload;

    if (consentStatus === 'all') {
      payload = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        status: 'all',
      };
    } else if (consentStatus === 'necessary_only') {
      payload = {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        status: 'necessary_only',
      };
    } else if (consentStatus === 'custom') {
      const choicesJson = getCookie('consent_choices');
      if (choicesJson) {
        const choices = JSON.parse(choicesJson);
        payload = {
          necessary: true,
          analytics: choices.analytics || false,
          marketing: choices.marketing || false,
          functional: choices.functional || false,
          status: 'custom',
        };
      }
    }

    if (payload) {
      applyGoogleConsentFromPayload(payload);
      applyMetaConsentFromPayload(payload);
      if (payload.analytics === true) {
        triggerGTMConsentEvent();
        injectScriptsByConsent(payload);
      }
    }
  }

  function initializeBanner() {
    injectBannerHTML();

    // Designen kan ha hunnit fram innan vardelementet fanns. Applicera nu.
    tillampaDesign();

    // Ligger pa KUNDENS sida, utanfor skuggan - darfor document och inte el().
    const webflowLink = document.getElementById('open-cookie-settings');
    if (webflowLink) {
      webflowLink.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
      });
    }

    setTimeout(async () => {
      getOrCreateClientId();

      loadAndApplySavedConsent();

      // Skickar samtycken som inte kom fram tidigare. Ligger sist och utan await:
      // besokaren ska aldrig vanta pa var bevislogg.
      tomKo();

      // De tre raderna ovan ligger FORE vantan pa designen med flit. De ror
      // samtycket - Googles signaler och var bevislogg - och far aldrig
      // fordrojas av nagot sa oviktigt som farger.

      const consentStatus = getCookie('consent_status');
      if (consentStatus) {
        hideAllBanners();
        log('[Init] Consent found - banner hidden');
        return;
      }

      // Vanta in designen innan bannern visas. Utan detta skulle den ritas i
      // standardfargerna och sedan byta utseende infor besokarens ogon - pa
      // brevenshus fran mork till beige. En cookiebanner som blinkar om ser
      // trasig ut, och fortroende ar hela poangen med den har produkten.
      //
      // Vantan har redan en tidsgrans inbyggd (se hamtaDesign) och kan darfor
      // inte hanga: uteblir svaret visas bannern med sina standardvarden.
      await sakerstallDesign();
      tillampaDesign();

      showCookieBanner();
      log('[Init] No consent - showing banner');
    }, 50);
  }

  // Bannern behover inte langre dessa for sin egen skull - klicken kopplas med
  // addEventListener sedan Shadow DOM infordes. De ligger kvar som publikt API:
  // en kundsajt kan ha en egen knapp som anropar window.openSettings(), och att
  // ta bort dem skulle brytas tyst hos nagon vi inte vet om.
  window.acceptAll = acceptAll;
  window.acceptEssential = acceptEssential;
  window.openSettings = openSettings;
  window.saveSettings = saveSettings;
  window.backToBanner = backToBanner;
  window.toggleCookie = toggleCookie;
  window.showPolicy = showPolicy;
  window.closePolicy = closePolicy;

  // Stubben skapas direkt nar skriptet korrs - INTE i initializeBanner, som
  // vantar pa DOMContentLoaded. Ju tidigare den finns, desto mindre fonster dar
  // sajtens egen kod kan traffa ett odefinierat fbq. Inget natverksanrop sker har.
  if (META_PIXEL_ID) ensureFbqStub();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBanner);
  } else {
    initializeBanner();
  }
})();
