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
      // Beskedslaget: visas i stallet for ett reglage nar sajten inte
      // anvander kategorin. En utsaga, inte en fraga.
      analyticsNone: 'This website does not use any analytics cookies.',
      functionalNone: 'This website does not use any functional cookies.',
      marketingNone: 'This website does not use any marketing cookies.',
      returnBtn: 'Return',
      savePreferences: 'Save preferences',
      policyTitle: 'Cookie Policy',
      policyLoading: 'Loading cookie policy...',
      policyErrorTitle: 'Could not load policy.',
      policyErrorBody: 'Could not find an active policy for this domain.',
      policyNetworkTitle: 'Network Error',
      policyNetworkBody: 'Could not connect to the server to fetch policy.',
      close: 'Close',
      // Platshallaren for en inbaddning som hallits tillbaka (C5).
      blockedBody: 'This content appears once you accept {kategori}.',
      blockedButton: 'Change settings',
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
      analyticsNone: 'Den här webbplatsen använder inga analyscookies.',
      functionalNone: 'Den här webbplatsen använder inga funktionella cookies.',
      marketingNone: 'Den här webbplatsen använder inga marknadsföringscookies.',
      returnBtn: 'Tillbaka',
      savePreferences: 'Spara inställningar',
      policyTitle: 'Cookiepolicy',
      policyLoading: 'Hämtar cookiepolicy...',
      policyErrorTitle: 'Kunde inte ladda policyn.',
      policyErrorBody: 'Hittade ingen aktiv policy för den här domänen.',
      policyNetworkTitle: 'Nätverksfel',
      policyNetworkBody: 'Kunde inte ansluta till servern för att hämta policyn.',
      close: 'Stäng',
      blockedBody: 'Innehållet visas när du godkänt {kategori}.',
      blockedButton: 'Ändra inställningar',
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
  const DESIGN_VARIABLES = new Set([
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
  const UNSAFE_VALUE = /url\(|expression\(|javascript:|@import|[<>{}\\;]/i;

  //========================================================================
  // KATEGORIER FRAN DATABASEN (C1 steg 2)
  //========================================================================
  //
  // Vilka kategorikort som visas i installningsrutan kommer fran databasen.
  //
  // TVA LAGEN PER KATEGORI, och kortet ritas i BADA:
  //
  //   toggle   sajten anvander kategorin  -> kort med reglage
  //   notice   sajten anvander den inte   -> kort med besked:
  //            "Den har webbplatsen anvander inga marknadsforingscookies"
  //
  // Kategorinamnet forsvinner alltsa aldrig. Beslutet (Bjorn, 2026-08-31) ar
  // att en avstangd knapp som inte styr nagot gor rutan mindre trovardig,
  // medan ett besked ar en UTSAGA i stallet for en fraga - det bygger
  // fortroende i stallet for att bara ta bort brus.
  //
  // ETIKETTERNA ligger kvar har, i bannerns egen sprakabell - databasen
  // skickar bara nycklar. Det ar med flit: text fran en databas som skrivs ut
  // pa kundsajter ar precis den konstruktion som ger XSS-hal, och den ytan
  // hor till steg 3.
  //
  // Foljden ar vard att saga rakt ut: STEG 2 KAN TA BORT KATEGORIER, INTE
  // LAGGA TILL NYA. En femte kategori kraver texter fran databasen.
  //
  // Listan ar en KOPIA av API:ts CATEGORY_ORDER, precis som med
  // designvariablerna. Driver de isar galler snittet: en kategori slutar
  // visas, i stallet for att en okand kategori borjar ritas. Fel at ratt hall.
  const CATEGORY_KEYS = ['necessary', 'analytics', 'functional', 'marketing'];

  // Vad bannern ritar nar configen inte gav nagra kategorier: natverksfel,
  // saknad site key, eller ett API som annu inte skickar faltet.
  //
  // FYRA KORT, precis som fore steg 2. En banner med for manga val ar ett
  // skonhetsfel. En banner med for fa - eller inga - ar val besokaren aldrig
  // fick gora, och det ar hela tjansten som gar sonder.
  const DEFAULT_CATEGORIES = CATEGORY_KEYS.map((key) => ({
    key,
    is_required: key === 'necessary',
    visibility: 'toggle',
  }));

  /** Slapper bara igenom kanda kategorier, i bannerns egen ordning. */
  function sanitizeCategories(list) {
    if (!Array.isArray(list)) return [];

    const found = new Map();
    for (const row of list) {
      if (!row || typeof row !== 'object') continue;
      if (typeof row.key !== 'string') continue;
      if (CATEGORY_KEYS.indexOf(row.key) === -1) continue;
      found.set(row.key, {
        is_required: row.is_required === true,
        // Bara ett uttryckligt 'notice' ger besked. Allt annat - okant varde,
        // saknat falt, ett API som annu inte skickar det - blir reglage.
        // Det sakra fallet ar att FRAGA, inte att pasta nagot om sajten.
        visibility: row.visibility === 'notice' ? 'notice' : 'toggle',
      });
    }

    if (!found.size) return [];

    // NODVANDIGA AR ALLTID MED, ALLTID OBLIGATORISKA OCH ALLTID ETT REGLAGE.
    // Samma invariant som i API:t, och av samma skal: payloaden skickar alltid
    // necessary: true, sa bade ett avstangbart reglage och ett besked om
    // motsatsen hade ljugit for besokaren.
    found.set('necessary', { is_required: true, visibility: 'toggle' });

    return CATEGORY_KEYS.filter((key) => found.has(key)).map((key) => ({
      key,
      is_required: found.get(key).is_required,
      visibility: found.get(key).visibility,
    }));
  }

  // Hur lange bannern vantar pa designen innan den visar sig anda. Vid trafik
  // ligger svaret pa CDN:et och kommer pa nagra tiotals millisekunder; grensen
  // slar bara till vid kall cache eller stromavbrott i andra anden.
  const CONFIG_TIMEOUT_MS = 800;

  let loadedDesign = null;
  let loadedCategories = null;
  let loadedTexts = null;

  /** Alla kort som ska ritas - bade reglage och besked. */
  function activeCategories() {
    return loadedCategories && loadedCategories.length ? loadedCategories : DEFAULT_CATEGORIES;
  }

  /**
   * Bara kategorierna sajten FAKTISKT ANVANDER, alltsa de med reglage.
   *
   * ⚠️ SKILJ DEN HAR FRAN activeCategories(). Fore beskedslaget rackte det att
   * en kategori fanns i listan for att den skulle rakna som anvand - en dold
   * kategori var helt enkelt borta. Nu ligger aven beskeden i listan, sa den
   * genvagen ger fel svar: bevisloggen skulle pasta att besokaren samtyckt
   * till en kategori som bara stod som en upplysning.
   *
   * Allt som ror SAMTYCKE ska ga via den har. Allt som ror RITNING via den
   * andra.
   */
  function toggleCategories() {
    return activeCategories().filter((category) => category.visibility !== 'notice');
  }

  //========================================================================
  // TEXTER FRÅN DATABASEN (C1 steg 3)
  //========================================================================
  //
  // Sajten kan skriva över bannerns egna texter, nyckel för nyckel. Den
  // ERSÄTTER dem inte: ett fält som saknas, ett språk som inte är ifyllt eller
  // ett uteblivet svar betyder att bannerns egen text används.
  //
  // Felriktningen är hela poängen. Går configen inte fram ritas ändå en
  // komplett ruta. Med databasen som enda källa hade ett nätverksfel gett en
  // banner utan ord — värre än den banner med för många val som redan är
  // genomtänkt för kategorierna.
  //
  // ⚠️ DET HÄR ÄR STEGET SOM BÄR XSS-RISKEN, OCH SÅ HÄR ÄR DEN BORTA:
  // korten byggs med createElement och textContent, aldrig som en HTML-sträng.
  // Ett värde som innehåller <img onerror=...> blir därför synliga bokstäver,
  // inte kod. Hålet finns inte — det är inte skyddat mot.
  //
  // ⚠️ SKRIV ALDRIG OM renderCategoryCards() TILL innerHTML. Hela beslutet
  // vilar på den raden. Ett enda undantag återinför ytan.
  //
  // Kontrollerna nedan är djupförsvar ovanpå det, och en KOPIA av API:ts —
  // precis som med designvariablerna och kategorierna. Driver de isär gäller
  // snittet: en text slutar gälla, i stället för att en okänd text börjar
  // ritas. Fel åt rätt håll.

  const TEXT_LANGUAGES = new Set(['sv', 'en']);
  const TEXT_FIELDS = new Set(['label', 'description', 'notice']);
  const MAX_TEXT_LENGTH = 300;
  const UNSAFE_TEXT = /[<>]/;

  function isValidText(value) {
    return (
      typeof value === 'string' &&
      value.trim().length > 0 &&
      value.length <= MAX_TEXT_LENGTH &&
      !UNSAFE_TEXT.test(value)
    );
  }

  /** Släpper bara igenom kända språk, kända kategorier och kända fält. */
  function sanitizeTexts(texts) {
    if (!texts || typeof texts !== 'object' || Array.isArray(texts)) return {};

    const cleaned = {};

    for (const lang in texts) {
      if (!TEXT_LANGUAGES.has(lang)) continue;
      const categories = texts[lang];
      if (!categories || typeof categories !== 'object' || Array.isArray(categories)) continue;

      const perCategory = {};

      for (const category in categories) {
        if (CATEGORY_KEYS.indexOf(category) === -1) continue;
        const field = categories[category];
        if (!field || typeof field !== 'object' || Array.isArray(field)) continue;

        const perField = {};

        for (const name in field) {
          if (!TEXT_FIELDS.has(name)) continue;
          // NÖDVÄNDIGA KAN ALDRIG BLI ETT BESKED. Samma invariant som i
          // sanitizeCategories, och av samma skäl: bannern sätter sin egen
          // samtyckescookie, så det finns inget läge där beskedet vore sant.
          if (category === 'necessary' && name === 'notice') continue;
          if (!isValidText(field[name])) continue;
          perField[name] = field[name];
        }

        if (Object.keys(perField).length > 0) perCategory[category] = perField;
      }

      if (Object.keys(perCategory).length > 0) cleaned[lang] = perCategory;
    }

    return cleaned;
  }

  /** Skriver de hamtade vardena som CSS-variabler pa vardelementet. */
  function applyDesign() {
    if (!loadedDesign) return;
    const host = document.getElementById(HOST_ID);
    if (!host) return;

    for (const key in loadedDesign) {
      host.style.setProperty('--' + key, loadedDesign[key]);
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
  function isFreshMode() {
    try {
      if (window.SEOS_FARSK) return true;
      return new URLSearchParams(window.location.search).has('seos_farsk');
    } catch (e) {
      return false;
    }
  }

  // Tomt svar. Bannern kor sina standardvarden och sina fyra kategorier.
  const EMPTY_CONFIG = { design: {}, categories: [], texts: {} };

  async function fetchConfig() {
    // Utan site key finns inget att sla upp.
    if (!SITE_KEY) return EMPTY_CONFIG;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);

    try {
      // Tidsstampeln gor adressen unik, sa CDN:et inte kan svara ur cachen.
      // API:t ser samma parameter och hoppar over sin egen minnescache.
      const url =
        `${API_BASE_URL}/config/${encodeURIComponent(SITE_KEY)}` +
        (isFreshMode() ? `?farsk=${Date.now()}` : '');

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) return EMPTY_CONFIG;

      const data = await response.json();
      if (!data || typeof data !== 'object') return EMPTY_CONFIG;

      const design = data.design;
      const cleaned = {};
      if (design && typeof design === 'object') {
        for (const key in design) {
          const value = design[key];
          if (!DESIGN_VARIABLES.has(key)) continue;
          if (typeof value !== 'string' || !value || value.length > 200) continue;
          if (UNSAFE_VALUE.test(value)) continue;
          cleaned[key] = value;
        }
      }

      // Saknas faltet helt - ett API som annu inte skickar det - blir listan
      // tom, och bannern faller tillbaka pa sina fyra. Det ar det som gor att
      // bannern kan rullas ut fore API:t utan att nagot andras.
      return {
        design: cleaned,
        categories: sanitizeCategories(data.categories),
        texts: sanitizeTexts(data.texts),
      };
    } catch (error) {
      // Avbrott, natverksfel eller trasigt svar: bannern ska visa sig anda.
      // En banner som uteblir for att configen inte gick att hamta vore ett
      // mycket varre fel an en banner i fel farger.
      log('[Config] Kunde inte hamta config:', error && error.message);
      return EMPTY_CONFIG;
    } finally {
      clearTimeout(timer);
    }
  }

  let configPromise = null;

  /** Hamtar configen hogst en gang, oavsett hur manga som fragar. */
  function ensureConfig() {
    if (!configPromise) {
      configPromise = fetchConfig().then((config) => {
        loadedDesign = config.design;
        loadedCategories = config.categories;
        loadedTexts = config.texts;
        applyDesign();
        applyCategories();
        return config;
      });
    }
    return configPromise;
  }

  /**
   * Ritar om kategorikorten nar configen kommit.
   *
   * KORTEN BEHOVER INTE FINNAS NAR BANNERN RITAS, till skillnad fran
   * designen. Installningsrutan ar aldrig det forsta besokaren ser - bannern
   * visas forst, och den vantar redan in configen innan den visar sig. Och
   * openSettings() vantar ocksa. Det finns alltsa inget lage dar nagon hinner
   * se fel uppsattning kort och sedan se dem bytas.
   *
   * Darfor racker det att skriva om behallaren i efterhand, i stallet for att
   * fordroja injiceringen av bannerns HTML.
   */
  function applyCategories() {
    const container = el('settings-container');
    if (!container) return;
    // textContent = '' tar bort barnen utan att nagon HTML tolkas.
    container.textContent = '';
    renderCategoryCards(container);
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
  if (!getCookie('consent_status')) ensureConfig();

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
  // Vilket språk som faktiskt ritas. Databastexterna slås upp på samma nyckel,
  // annars hade en sajt med <html lang="de"> fått engelska etiketter men
  // svenska databastexter — halva rutan på fel språk.
  const textLang = translations[pageLang] ? pageLang : 'en';

  //========================================================================
  // HTML INJECTION for easy plug in
  //========================================================================

  // Kategorikorten. Reglaget ar en RIKTIG <button role="switch"> och inte en
  // <div> - annars gar det varken att na med tangentbord eller att lasa upp med
  // skarmlasare, och da kan besokaren inte gora ett specifikt val per kategori.
  // Kortet i sin helhet ar fortfarande klickbart: klicket bubblar upp fran
  // knappen till kortets data-handling, sa bada vagarna ger exakt ett omslag.
  // Texterna slas upp pa nyckel. En nyckel som saknas har gar inte att rita,
  // och ritas darfor inte.
  // `text` visas nar kategorin ANVANDS, `saknas` nar den inte gor det.
  //
  // Databasen far skriva över varje enskild rad, men bara skriva över: saknas
  // värdet används språktabellens. Det är därför en sajt kan byta ordalydelse
  // på en enda rubrik utan att behöva fylla i allt annat.
  function categoryTexts() {
    const own = (loadedTexts && loadedTexts[textLang]) || {};

    // field ar databasens namn (label/description/notice), fallback ar
    // spraktabellens varde. Falten heter numera likadant i bada andar, sa det
    // finns inget oversattningssteg dar ett fel kan smyga sig in.
    const pick = (key, field, fallback) => {
      const row = own[key];
      return row && typeof row[field] === 'string' ? row[field] : fallback;
    };

    return {
      necessary: {
        label: pick('necessary', 'label', t.necessaryLabel),
        description: pick('necessary', 'description', t.necessaryDesc),
      },
      analytics: {
        label: pick('analytics', 'label', t.analyticsLabel),
        description: pick('analytics', 'description', t.analyticsDesc),
        notice: pick('analytics', 'notice', t.analyticsNone),
      },
      functional: {
        label: pick('functional', 'label', t.functionalLabel),
        description: pick('functional', 'description', t.functionalDesc),
        notice: pick('functional', 'notice', t.functionalNone),
      },
      marketing: {
        label: pick('marketing', 'label', t.marketingLabel),
        description: pick('marketing', 'description', t.marketingDesc),
        notice: pick('marketing', 'notice', t.marketingNone),
      },
    };
  }

  /**
   * Ritar korten som RIKTIGA ELEMENT i behallaren.
   *
   * ⚠️ INGEN HTML-STRANG, och det ar med flit. Fore C1 steg 3 byggdes korten
   * genom att klistra ihop en strang som sattes med innerHTML. Det gick bra sa
   * lange alla texter kom fran bannerns egen sprakabell — men texterna kommer
   * numera fran databasen, och da hade en text med <img onerror=...> blivit
   * kod i stallet for bokstaver.
   *
   * Med textContent finns det halet inte. Det ar inte skyddat mot, det finns
   * inte. SKRIV DARFOR ALDRIG OM DEN HAR FUNKTIONEN TILL innerHTML.
   */
  function renderCategoryCards(container) {
    const texts = categoryTexts();

    for (const category of activeCategories()) {
      const copy = texts[category.key];
      if (!copy) continue;
      if (category.visibility === 'notice' && !copy.notice) continue;

      const isNotice = category.visibility === 'notice';

      const card = document.createElement('div');
      card.className = isNotice ? 'cookie-category-card category-notice' : 'cookie-category-card';

      const wrapper = document.createElement('div');
      wrapper.className = 'category-text-wrapper';

      const heading = document.createElement('h5');
      heading.id = `etikett-${category.key}`;
      heading.textContent = copy.label;

      const bodyText = document.createElement('p');
      bodyText.id = `text-${category.key}`;
      bodyText.textContent = isNotice ? copy.notice : copy.description;

      wrapper.append(heading, bodyText);
      card.appendChild(wrapper);

      // BESKED: kort utan reglage. Ingen data-handling, sa klick pa kortet
      // gor ingenting - det finns inget att vaxla. Ingen knapp betyder ocksa
      // att tangentbordsnavigeringen hoppar over det, vilket ar ratt: det ar
      // information, inte ett val.
      if (isNotice) {
        container.appendChild(card);
        continue;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-labelledby', heading.id);
      button.setAttribute('aria-describedby', bodyText.id);

      if (category.is_required) {
        // Markets text kommer alltid fran spraktabellen, aldrig fran
        // databasen: "KRAVS" ar ett pastaende om hur bannern fungerar, inte
        // om sajten.
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = t.requiredBadge;
        heading.append(' ', badge);

        button.className = 'toggle-switch always-active';
        button.setAttribute('aria-checked', 'true');
        button.disabled = true;
      } else {
        const toggleId = `${category.key}-toggle`;
        card.dataset.handling = 'vaxla';
        // ⚠️ dataset.reglage ger attributet data-reglage. Attributnamnen byts
        // i commit 3, inte har - variabeln heter toggleId, attributet inte.
        card.dataset.reglage = toggleId;

        button.className = 'toggle-switch';
        button.id = toggleId;
        button.setAttribute('aria-checked', 'false');
      }

      const slider = document.createElement('span');
      slider.className = 'toggle-slider';
      button.appendChild(slider);

      card.appendChild(button);
      container.appendChild(card);
    }
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
        <div id="settings-container" class="cookie-settings-container"></div>
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
    const template = document.createElement('template');
    template.innerHTML = bannerHTML;
    shadow.appendChild(template.content);

    // Korten ritas har i stallet for i mallen: de byggs som element, inte som
    // en strang, sa de gar inte att interpolera in. Configen har oftast redan
    // kommit — har den inte det ritas bannerns standardkategorier, och
    // applyCategories() ritar om sa fort svaret ar framme.
    applyCategories();

    bindEvents();
    bindKeyboard();
    bindScroll();
  }

  // En enda lyssnare pa skuggroten i stallet for atta inline-onclick. Klick
  // bubblar upp hit, och data-handling avgor vad som ska kora.
  function bindEvents() {
    const actions = {
      visaPolicy: showPolicy,
      oppnaInstallningar: openSettings,
      endastNodvandiga: acceptEssential,
      acceptaAlla: acceptAll,
      sparaInstallningar: saveSettings,
      tillbaka: backToBanner,
      stangPolicy: closePolicy,
      vaxla: (element) => toggleCookie(el(element.dataset.reglage)),
    };

    shadow.addEventListener('click', (event) => {
      const match = event.target.closest('[data-handling]');
      if (!match) return;
      const run = actions[match.dataset.handling];
      if (!run) return;
      event.preventDefault();
      run(match);
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
  let focusBefore = null;

  function moveFocusTo(box) {
    if (!box) return;
    // Fokus gar till RUTAN, inte till forsta knappen. Da laser skarmlasaren upp
    // rubriken (via aria-labelledby) i stallet for att kasta in anvandaren mitt i
    // en knapprad. Rutorna har darfor tabindex="-1".
    //
    // Forsta forsoket tog forsta <button> - men det ar den inaktiverade
    // nodvandig-knappen, och inaktiverade element kan inte ta emot fokus. Fokus
    // hamnade darfor ingenstans alls.
    box.focus();
  }

  function rememberFocus() {
    const active = shadow && shadow.activeElement ? shadow.activeElement : document.activeElement;
    if (active) focusBefore = active;
  }

  function restoreFocus() {
    if (focusBefore && typeof focusBefore.focus === 'function') focusBefore.focus();
    focusBefore = null;
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
  function scrollableBox(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    for (const node of path) {
      // Stanna vid skuggans kant: utanfor den ar det kundens sida.
      if (node === shadow || node === shadow.host) break;
      if (!node || node.nodeType !== 1) continue;
      const styleEl = window.getComputedStyle(node);
      const scrollable = styleEl.overflowY === 'auto' || styleEl.overflowY === 'scroll';
      if (scrollable && node.scrollHeight > node.clientHeight + 1) return node;
    }
    return null;
  }

  function bindScroll() {
    if (!shadow) return;
    shadow.addEventListener(
      'wheel',
      (event) => {
        const box = scrollableBox(event);
        if (!box) return;

        const nedat = event.deltaY > 0;
        const canScrollFurther = nedat
          ? box.scrollTop < box.scrollHeight - box.clientHeight - 1
          : box.scrollTop > 0;

        // Behall handelsen bara nar rutan har nagonstans att ta vagen.
        if (canScrollFurther) event.stopPropagation();
      },
      true
    );
  }

  function bindKeyboard() {
    shadow.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const settings = el(SETTINGS_ID);
      const policy = el(POLICY_ID);
      if (policy && policy.style.display !== 'none') {
        event.preventDefault();
        closePolicy();
      } else if (settings && settings.style.display !== 'none') {
        event.preventDefault();
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
    rememberFocus();
    hideAllBanners();
    const box = el(SETTINGS_ID);
    box.style.display = 'flex';
    moveFocusTo(box);
  }

  function showPolicyModal() {
    rememberFocus();
    hideAllBanners();
    const box = el(POLICY_ID);
    box.style.display = 'flex';
    moveFocusTo(box);
  }

  //========================================================================
  // CONSENT PAYLOAD BUILDERS
  //========================================================================

  function acceptAllConsent() {
    const clientId = getOrCreateClientId();

    // BARA KATEGORIER SOM FAKTISKT VISADES FAR ETT JA.
    //
    // Doljer en sajt t.ex. functional skickas den som false, aven vid
    // "Acceptera alla". Annars hade bevisloggen pastatt att besokaren samtyckt
    // till nagot hen aldrig blev tillfragad om - och beviset ar hela tjansten.
    //
    // Payloadens FORM andras inte: fyra fasta falt, precis som forut. Bara
    // vardena foljer vad som visades. Darfor rors varken validatorn,
    // consent.ts eller bevisloggens struktur.
    const seen = {};
    for (const category of toggleCategories()) seen[category.key] = true;

    return {
      necessary: true,
      analytics: seen.analytics === true,
      marketing: seen.marketing === true,
      functional: seen.functional === true,
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
  const QUEUE_KEY = 'seos_consent_ko';
  const QUEUE_MAX_ITEMS = 10;
  const QUEUE_MAX_AGE_DAYS = 30;
  const QUEUE_MAX_ATTEMPTS = 5;

  function readQueue() {
    try {
      const row = window.localStorage.getItem(QUEUE_KEY);
      const queue = row ? JSON.parse(row) : [];
      return Array.isArray(queue) ? queue : [];
    } catch (e) {
      // localStorage kan vara avstangt eller fullt. Da far kon inte finnas -
      // men samtycket ska anda ga igenom.
      return [];
    }
  }

  function writeQueue(queue) {
    try {
      if (queue.length) window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      else window.localStorage.removeItem(QUEUE_KEY);
    } catch (e) {
      /* tyst: en ko som inte kan sparas ar battre an ett kraschat samtycke */
    }
  }

  /** Returnerar 'ok' | 'avvisad' (meningslost att forsoka igen) | 'fel'. */
  async function postConsent(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        log('[Backend] Consent recorded successfully');
        return 'ok';
      }

      // 4xx betyder att API:t forstod oss och sa nej - fel site key, fel origin,
      // ogiltig payload. Att skicka om det tusen ganger ger samma svar. Slang.
      if (response.status >= 400 && response.status < 500) {
        const details = await response.json().catch(() => ({}));
        console.error('[Backend] Consent avvisad, status:', response.status, details);
        return 'avvisad';
      }

      console.error('[Backend] Consent POST failed, status:', response.status);
      return 'fel';
    } catch (error) {
      console.error('[Backend] Network error - could not reach server:', error);
      return 'fel';
    }
  }

  function queueConsent(payload) {
    const queue = readQueue();
    queue.push({ payload, attempts: 0 });
    // Behall de senaste. En besokare som surfar offline lange ska inte kunna
    // fylla sitt eget lagringsutrymme.
    writeQueue(queue.slice(-QUEUE_MAX_ITEMS));
    log('[Ko] Samtycke koat, poster i ko:', Math.min(queue.length, QUEUE_MAX_ITEMS));
  }

  // Toms vid varje sidladdning. Kors efter att bannern ritats sa den aldrig
  // fordrojer det besokaren ser.
  async function flushQueue() {
    const queue = readQueue();
    if (!queue.length) return;

    const remaining = [];
    for (const entry of queue) {
      // Ett samtycke aldre an cookiens livslangd ar inte langre aktuellt -
      // besokaren har for lange sedan fatt fragan igen.
      const age = Date.now() - new Date(entry.payload.timestamp).getTime();
      if (!(age < QUEUE_MAX_AGE_DAYS * 86400000)) continue;

      const result = await postConsent(entry.payload);
      if (result === 'ok' || result === 'avvisad') continue;

      entry.attempts += 1;
      if (entry.attempts < QUEUE_MAX_ATTEMPTS) remaining.push(entry);
    }

    writeQueue(remaining);
    if (queue.length !== remaining.length) log('[Ko] Skickade', queue.length - remaining.length, 'koade samtycken');
  }

  async function saveConsentAndSend(payload) {
    const result = await postConsent(payload);
    if (result === 'fel') queueConsent(payload);
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

  //========================================================================
  // C5 STEG 1-3: SLAPPA FRAM, PLATSHALLAREN, OCH LATA SAJTEN FRAGA
  //========================================================================
  //
  // ⛔ SPARREN GALLER FORE ALLT ANNAT HAR. Fyra fragor innan nagot hålls
  // tillbaka, nedskrivna i dokumentationen avsnitt C5:
  //
  //   1. Sparar den?                  Nej -> hall aldrig tillbaka (cal.com)
  //   2. Bad besokaren om den?        Ja  -> ladda vid klicket i stallet
  //   3. Gar sidan att anvanda utan?  Nej -> manskligt beslut, aldrig automatik
  //   4. Syns det, och ett klick vidare? Nej -> gor det inte
  //
  // Björns regel 2026-09-01: BLOCKERING SKA VARA LOGISK, ALDRIG AGGRESSIV. En
  // besokare som inte kan boka ett mote eller se en video ar ett samre utfall
  // an en cookie vi kunde ha stoppat.
  //
  // ⚠️ "Hallen tillbaka" betyder ETT KLICK EXTRA, inte otillganglig. Det ar
  // hela skalet till att platshallaren inte ar valfri.
  //
  // DEN HAR KODEN HALLER INTE TILLBAKA NAGOT SJALV. Den slapper fram det som
  // sajtens egen markering redan hallit tillbaka:
  //
  //   <script type="text/plain" data-seos-consent="marketing" src="...">
  //   <iframe data-seos-consent="marketing" data-seos-src="https://...">
  //
  // Bada ar overta av webblasaren: ett skript med fel type korrs aldrig, och
  // en iframe utan src hamtar ingenting. Bannern behover alltsa inte hinna
  // fore, och kan ligga kvar som async. Att fanga skript som INTE ar markta
  // ar steg 5 (modell B-lite) och finns inte har.

  // Vad besokaren har sagt ja till, just nu. null = inget svar an.
  //
  // Fanns inte fore C5: samtycket lastes ur kakan pa varje stalle som behovde
  // det. Med en enda kalla kan bade inbaddningarna och sajtens egen kod fraga
  // samma sak och alltid fa samma svar.
  let currentConsent = null;

  const consentListeners = new Set();

  /**
   * Enda vagen in for ett samtycke. Alla vagar - acceptera alla, endast
   * nodvandiga, spara installningar, och sparat samtycke vid sidladdning -
   * gar genom den har.
   *
   * ⚠️ Lagg aldrig till en femte vag som inte gor det. Da skulle sajtens egen
   * kod och inbaddningarna kunna ha olika bild av samma samtycke.
   */
  function setConsent(payload) {
    currentConsent = {
      necessary: true,
      analytics: payload.analytics === true,
      functional: payload.functional === true,
      marketing: payload.marketing === true,
    };

    applyConsentToEmbeds();
    notifyConsentChange();
  }

  function notifyConsentChange() {
    const detail = { ...currentConsent };

    for (const listener of consentListeners) {
      // En trasig lyssnare hos kunden far inte stoppa de ovriga, och inte
      // heller resten av samtyckesvagen.
      try {
        listener(detail);
      } catch (error) {
        log('[C5] Lyssnare kastade:', error && error.message);
      }
    }

    try {
      document.dispatchEvent(new CustomEvent('seos:consent', { detail: detail }));
    } catch (error) {
      log('[C5] Kunde inte skicka seos:consent:', error && error.message);
    }
  }

  /**
   * PUBLIKT API for sajtens egen kod.
   *
   * Behovs for det som varken ar ett <script> eller en <iframe> i HTML:en.
   * Upptacktes genom seosdesigns kontaktwidget: den skapar cal.com-skriptet i
   * JavaScript vid klick, sa det finns ingen rad att marka - sajtens kod maste
   * kunna fraga sjalv.
   *
   *   if (window.SEOS.hasConsent('marketing')) laddaKartan();
   *
   *   window.SEOS.onConsentChange((samtycke) => {
   *     if (samtycke.marketing) laddaKartan();
   *   });
   *
   * ⚠️ hasConsent() ger FALSE innan besokaren svarat. Det ar det sakra svaret:
   * ingenting ska laddas pa ett samtycke som inte finns. Vill man reagera nar
   * svaret kommer ar det onConsentChange() som galler.
   */
  const seosApi = {
    hasConsent(category) {
      if (category === 'necessary') return true;
      if (!currentConsent) return false;
      return currentConsent[category] === true;
    },

    /** Returnerar en funktion som kopplar bort lyssnaren igen. */
    onConsentChange(listener) {
      if (typeof listener !== 'function') return () => {};
      consentListeners.add(listener);
      // Har svaret redan kommit far lyssnaren det direkt. Utan det hade en
      // sajt som kopplar sig sent aldrig fatt veta nagot.
      if (currentConsent) {
        try {
          listener({ ...currentConsent });
        } catch (error) {
          log('[C5] Lyssnare kastade:', error && error.message);
        }
      }
      return () => consentListeners.delete(listener);
    },

    openSettings: () => openSettings(),
    showPolicy: () => showPolicy(),
  };

  //------------------------------------------------------------------------
  // PLATSHALLAREN
  //------------------------------------------------------------------------
  //
  // Ligger pa KUNDENS sida, utanfor bannerns skugga, sa bannerns stilmall nar
  // den inte. Den bar darfor sin egen.
  //
  // FARG OCH TYPSNITT LOSER SIG SJALVT: inherit och currentColor gor att rutan
  // arver sajtens typsnitt och textfarg, och ramen far samma farg som texten.
  // Da fungerar den mot bade mork och ljus bakgrund utan konfiguration. Samma
  // princip som gjorde att bannern smalter in efter C3.
  //
  // STORLEK OCH FORM GOR DET INTE. Se sizePlaceholder() nedan.

  const PLACEHOLDER_CLASS = 'seos-blockerad';
  const PLACEHOLDER_STYLE_ID = 'seos-blockerad-css';

  const placeholderCss = `
.${PLACEHOLDER_CLASS} {
  container-type: inline-size;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  width: 100%;
  padding: 1.25em;
  text-align: center;
  font-family: inherit;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 4px;
}
.${PLACEHOLDER_CLASS} p {
  margin: 0;
  max-width: 40ch;
  font-size: 0.9em;
  line-height: 1.4;
}
.${PLACEHOLDER_CLASS} button {
  font: inherit;
  font-size: 0.9em;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0.5em 1em;
  cursor: pointer;
}
/* Regel 2: innehallet maste tala att krympa. En liten karta i en sidokolumn
   ska inte bli en textvagg - da stannar bara knappen kvar. */
@container (max-width: 260px) {
  .${PLACEHOLDER_CLASS} p { display: none; }
  .${PLACEHOLDER_CLASS} { padding: 0.75em; }
}`;

  function ensurePlaceholderCss() {
    if (document.getElementById(PLACEHOLDER_STYLE_ID)) return;
    const styleEl = document.createElement('style');
    styleEl.id = PLACEHOLDER_STYLE_ID;
    styleEl.textContent = placeholderCss;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  /**
   * REGEL 1: rutan tar den plats elementet redan hade.
   *
   * ⚠️ LAYOUTEN FAR INTE HOPPA. For en SEO-byra ar det inte en detalj utan
   * Core Web Vitals - samma skal som fick modell B att falla.
   *
   * Tva vagar, i tur och ordning:
   *   1. Har elementet width- och height-attribut anvands deras FORHALLANDE,
   *      inte deras pixlar. Da ar rutan lika hog som videon skulle blivit,
   *      oavsett hur bred behallaren ar.
   *   2. Annars mats elementets hojd som den faktiskt ar pa sidan.
   *
   * Uppmatt 2026-08-31 mot skarpa /kontakt: en behallare med min-height 700px
   * gav ett stort tomrum. Sadant gar inte att rakna fram - det ar darfor en
   * titt med forhandsgranska hor till uppsattningen av varje sajt som faktiskt
   * har en hallen inbaddning.
   */
  function sizePlaceholder(box, element) {
    const b = parseFloat(element.getAttribute('width'));
    const h = parseFloat(element.getAttribute('height'));
    if (b > 0 && h > 0) {
      box.style.aspectRatio = `${b} / ${h}`;
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.height > 0) box.style.minHeight = `${Math.round(rect.height)}px`;
  }

  /** Kategorins namn pa besokarens sprak, till texten i rutan. */
  function categoryLabel(key) {
    const texts = categoryTexts();
    return (texts[key] && texts[key].label) || key;
  }

  function buildPlaceholder(element, category) {
    ensurePlaceholderCss();

    const box = document.createElement('div');
    box.className = PLACEHOLDER_CLASS;
    box.setAttribute('role', 'group');

    const text = document.createElement('p');
    // textContent, aldrig innerHTML - samma regel som kategorikorten.
    text.textContent = t.blockedBody.replace('{kategori}', categoryLabel(category));

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = t.blockedButton;
    button.addEventListener('click', () => openSettings());

    box.append(text, button);
    sizePlaceholder(box, element);
    return box;
  }

  //------------------------------------------------------------------------
  // MARKERINGEN SOM RUTIN (C5 punkt 4)
  //------------------------------------------------------------------------
  //
  // Tre satt att marka fel sa att det SER UT att fungera. Alla tre var tysta
  // innan den har kontrollen fanns, och alla tre ger samma intryck: "jag har
  // blockerat den dar spararen." Utan varning upptacks det aldrig.
  //
  //   1. <script data-seos-consent="x"> UTAN type="text/plain"
  //      Vanligaste och varsta felet. Webblasaren kor skriptet direkt, precis
  //      som om markeringen inte fanns. Bannern kan inte gora nagot at det -
  //      nar den laser sidan har skriptet redan korrts.
  //
  //   2. <iframe data-seos-consent="x"> UTAN data-seos-src
  //      Antingen har adressen lamnats kvar i src (och laddas direkt), eller
  //      sa saknas den helt (och rutan blir tom for alltid).
  //
  //   3. En kategori bannern inte kanner igen. Elementet slapps aldrig fram,
  //      oavsett vad besokaren svarar.
  //
  // ⚠️ console.warn, inte log(). log() ar avstangd i drift (DEBUG = false), och
  // en varning som ingen ser ar samma sak som ingen varning. Samma linje som
  // publish-design, dar geometri avvisas med en forklaring i stallet for att
  // tyst falla bort.
  //
  // Tyst pa en sajt UTAN markering: kontrollen letar bara efter element som
  // redan bar data-seos-consent, sa den kan inte skalla pa en kund som inte
  // anvander funktionen.

  function warnAboutMarkup() {
    for (const element of document.querySelectorAll('script[data-seos-consent]')) {
      const type = (element.getAttribute('type') || '').toLowerCase();
      if (type !== 'text/plain') {
        console.warn(
          '[SEOS] This script has data-seos-consent but type="' +
            (element.getAttribute('type') || '') +
            '". It ran immediately and was NOT held back. Add type="text/plain".',
          element,
        );
      }
    }

    for (const element of document.querySelectorAll('iframe[data-seos-consent]')) {
      if (element.hasAttribute('data-seos-src')) continue;
      if (element.hasAttribute('src')) {
        console.warn(
          '[SEOS] This iframe has data-seos-consent but its address is still in src, ' +
            'so it loaded immediately. Move the address to data-seos-src.',
          element,
        );
      } else {
        console.warn(
          '[SEOS] This iframe has data-seos-consent but no data-seos-src, ' +
            'so there is nothing to load when consent is given.',
          element,
        );
      }
    }

    for (const element of document.querySelectorAll('[data-seos-consent]')) {
      const key = element.getAttribute('data-seos-consent');
      if (CATEGORY_KEYS.indexOf(key) === -1) {
        console.warn(
          '[SEOS] Unknown consent category "' +
            key +
            '". Known categories: ' +
            CATEGORY_KEYS.join(', ') +
            '. This element will never be released.',
          element,
        );
      }
    }
  }

  //------------------------------------------------------------------------
  // AKTIVERINGEN
  //------------------------------------------------------------------------

  /** Vad elementet vantar pa. Okand kategori -> stannar tillbakahallet. */
  function embedCategory(element) {
    const key = element.getAttribute('data-seos-consent');
    // Varningen ligger i warnAboutMarkup(), som kors EN gang och syns i
    // konsolen. Har vore den tyst (log ar av i drift) och skulle dessutom
    // upprepas vid varje samtyckesandring.
    if (CATEGORY_KEYS.indexOf(key) === -1) return null;
    return key;
  }

  function isGranted(category) {
    return category !== null && seosApi.hasConsent(category);
  }

  /**
   * Slapper fram ett markt skript.
   *
   * Ett <script type="text/plain"> har aldrig korrts, och att bara byta type
   * pa det befintliga elementet gor ingenting - webblasaren kor bara skript
   * som satts in i dokumentet. Darfor byggs ett nytt.
   */
  function releaseScript(oldScript) {
    const newScript = document.createElement('script');

    for (const attr of oldScript.attributes) {
      if (attr.name === 'type') continue;
      if (attr.name.indexOf('data-seos-') === 0) continue;
      newScript.setAttribute(attr.name, attr.value);
    }
    if (oldScript.textContent) newScript.textContent = oldScript.textContent;

    // Pa samma plats i dokumentet, sa ordningen mellan flera skript halls.
    oldScript.parentNode.insertBefore(newScript, oldScript);
    oldScript.remove();
  }

  function releaseIframe(element) {
    const url = element.getAttribute('data-seos-src');
    if (!url) return;

    element.setAttribute('src', url);
    element.removeAttribute('data-seos-src');
    element.style.removeProperty('display');

    const box = element.previousElementSibling;
    if (box && box.classList.contains(PLACEHOLDER_CLASS)) box.remove();
  }

  function holdIframe(element) {
    // Redan tillbakahallen: rutan star kvar och behover inte ritas om.
    if (
      element.previousElementSibling &&
      element.previousElementSibling.classList.contains(PLACEHOLDER_CLASS)
    ) {
      return;
    }

    const category = element.getAttribute('data-seos-consent');
    const box = buildPlaceholder(element, category);

    // Rutan mats mot elementet INNAN det doljs - en dold iframe har ingen
    // storlek att lasa av.
    element.parentNode.insertBefore(box, element);
    element.style.display = 'none';
  }

  /**
   * Gar igenom sidan och slapper fram det som fatt sitt samtycke, ritar
   * platshallare for resten.
   *
   * Korrs vid varje samtyckesandring OCH vid sidladdning, sa att en besokare
   * som redan sagt ja aldrig moter en platshallare i onodan.
   *
   * ⚠️ ETT SKRIPT SOM REDAN KORRTS GAR INTE ATT AVBRYTA. Aterkallat samtycke
   * kraver omladdning. Sa fungerar alla samtyckesverktyg - det star i
   * dokumentationen och ska sagas rakt ut, inte doljas. En IFRAME kan daremot
   * tas tillbaka, och det gor den har.
   */
  function applyConsentToEmbeds() {
    // Skripten i dokumentordning, sa att ett skript som beror pa ett annat
    // fortfarande kommer efter det.
    for (const element of document.querySelectorAll(
      'script[type="text/plain"][data-seos-consent]',
    )) {
      if (isGranted(embedCategory(element))) releaseScript(element);
    }

    for (const element of document.querySelectorAll('iframe[data-seos-consent]')) {
      if (isGranted(embedCategory(element))) {
        releaseIframe(element);
      } else if (element.hasAttribute('data-seos-src')) {
        holdIframe(element);
      }
    }
  }

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
    setConsent(payload);
    saveConsentAndSend(payload);
  }

  function acceptEssential() {
    const payload = acceptEssentialConsent();
    setCookie('consent_status', payload.status, LONG_LIVED_COOKIE_DAYS);
    hideAllBanners();
    applyGoogleConsentFromPayload(payload);
    applyMetaConsentFromPayload(payload);
    // Anropas AVEN har, trots att ingenting slapps fram: platshallarna ska
    // ritas, och sajtens egna lyssnare ska fa sitt nej.
    setConsent(payload);
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
    await ensureConfig();
    applyDesign();

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

    // Bara de reglage som faktiskt ritats. En dold kategori har inget element,
    // och applyToggleState hittar da ingenting att satta.
    for (const category of toggleCategories()) {
      if (category.is_required) continue;
      applyToggleState(`${category.key}-toggle`, choices[category.key] === true);
    }

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

    // Lases fran de reglage som ritats. En dold kategori har inget element och
    // stannar pa false - samma regel som i acceptAllConsent: bevisloggen far
    // aldrig pasta att besokaren tog stallning till nagot hen inte fick se.
    const choice = { analytics: false, marketing: false, functional: false };
    for (const category of toggleCategories()) {
      if (category.is_required) continue;
      choice[category.key] = el(`${category.key}-toggle`)?.classList.contains('active') || false;
    }

    const analytics = choice.analytics;
    const marketing = choice.marketing;
    const functional = choice.functional;

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

    setConsent(payload);
    saveConsentAndSend(payload);

    hideAllBanners();
    log('[Settings] Custom choices saved:', choices);
  }

  function backToBanner() {
    showCookieBanner();
    restoreFocus();
  }

  function closePolicy() {
    if (getCookie('consent_status')) {
      hideAllBanners();
    } else {
      showCookieBanner();
    }
    restoreFocus();
  }

  function toggleCookie(element) {
    if (!element) return;
    const isOn = element.classList.toggle('active');
    // aria-checked ar det ENDA en skarmlasare ser. Halls den inte i takt med
    // klassen laser den upp fel svar - tyst, och varre an inget svar alls.
    element.setAttribute('aria-checked', isOn ? 'true' : 'false');
  }

  //========================================================================
  // POLICY FETCHING
  //========================================================================

  async function showPolicy() {
    // Som i openSettings: nas via window.showPolicy() aven av den som redan
    // samtyckt, och da har designen aldrig hamtats.
    await ensureConfig();
    applyDesign();

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
      }
      // ⚠️ LAG TIDIGARE INNANFOR analytics-villkoret ovan. Med en tom stubbe
      // spelade det ingen roll, men fran och med C5 hade en atervandande
      // besokare som bara godkant MARKNADSFORING aldrig fatt sina
      // inbaddningar framslappta - de hade motts av en platshallare for ett
      // samtycke de redan gett.
      setConsent(payload);
    }
  }

  function initializeBanner() {
    injectBannerHTML();

    // Sager ifran om en markering ser ratt ut men inte fungerar. Tyst pa en
    // sajt utan markering.
    warnAboutMarkup();

    // Ritar platshallarna for den som annu inte svarat. Utan det hade en
    // tillbakahallen inbaddning varit ett tomt halrum tills besokaren klickat,
    // och det ar precis det spärrens fraga 4 forbjuder.
    //
    // Ligger fore loadAndApplySavedConsent(): har besokaren redan sagt ja
    // slapps allt fram i samma andetag, och rutan hinner aldrig synas.
    if (!currentConsent) applyConsentToEmbeds();

    // Designen kan ha hunnit fram innan vardelementet fanns. Applicera nu.
    applyDesign();

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
      flushQueue();

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
      // Vantan har redan en tidsgrans inbyggd (se fetchConfig) och kan darfor
      // inte hanga: uteblir svaret visas bannern med sina standardvarden.
      await ensureConfig();
      applyDesign();

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

  // window.SEOS skapas direkt nar skriptet korrs, INTE i initializeBanner.
  // Samma skal som fbq-stubben nedan: ju tidigare den finns, desto mindre
  // fonster dar sajtens egen kod kan traffa ett odefinierat window.SEOS.
  //
  // hasConsent() svarar false tills samtycket ar last, vilket ar det sakra
  // svaret. Sajten som vill reagera nar svaret kommer anvander
  // onConsentChange(), som ocksa fyrar direkt om svaret redan finns.
  window.SEOS = seosApi;

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
