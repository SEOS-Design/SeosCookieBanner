// Sajterna som overvakas. Lagg till en rad nar en ny kund far bannern.
//
// Listan anvands av bada de schemalagda kontrollerna: den syntetiska
// overvakningen (`npm run overvaka`) och cookie-skannern (`npm run skanna`).
//
// `skript` ar den adress sajten FORVANTAS ladda. Star fel adress dar upptacks
// det - t.ex. om nagon rakar byta tillbaka till den gamla filen, eller om en
// ny sajt kopplas in med en gammal scripttagg som nagon kopierat.
//
// `tillatnaCookies` ar sajtens EGNA undantag i cookie-skannern - cookies som
// satts fore samtycke och som vi granskat och bedomt nodvandiga. Listan ska
// vara kort och varje rad ska ha ett skal i en kommentar. Ar den lang har
// nagon tystat ett larm i stallet for att losa det.
//
// `tillatnaSparare` ar sajtens hallning i pingfragan. En sparare som star har
// far kontaktas fore samtycke utan att skannern larmar - men den syns anda i
// rapporten, sa den blir aldrig osynlig.
//
// ⚠️ SKILLNADEN MELLAN DE TVA FALTEN AR VIKTIG:
//   tillatnaCookies  tummar pa ett LAGKRAV. LEK forbjuder icke-nodvandig
//                    lagring pa enheten fore samtycke. Varje rad har maste
//                    kunna forsvaras som nodvandig - annars ar den ett brott
//   tillatnaSparare  tummar pa ett EGET VAL. En cookieloos ping lagrar
//                    ingenting pa enheten, sa LEK:s cookieregel traffar den
//                    inte. Kvar ar en GDPR-grazon som Google och de flesta
//                    samtyckeslosningar accepterar
//
// Tom `tillatnaSparare` = sajten kor det strangare laget: ingenting alls till
// Google fore samtycke. Ta bort en rad har for att skarpa en sajt igen.

module.exports = [
  {
    namn: 'seosdesign',
    url: 'https://www.seosdesign.se/',
    skript: '/v1/banner.js',
    // Texten pa acceptera-knappen. Bevisar att ratt sprak laddats, inte bara
    // att nagon knapp finns.
    accepteraText: 'Acceptera alla',
    tillatnaCookies: [],
    // Beslut 2026-08-21: cookielosa pingar tillats igen. GA4 visade annars
    // bara de som samtyckt, och det ar GA som faktiskt anvands som
    // statistikkalla - en siffra i databasen som ingen tittar pa ar ingen
    // siffra. Se COOKIEBANNER-DOKUMENTATION.md 1.7.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'brevenshus',
    url: 'https://www.brevenshus.se/',
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    tillatnaCookies: [],
    // Samma beslut som ovan. Har var pingarna dessutom aldrig avstangda -
    // sparren satt i GTM-utlosaren och brevenshus har ingen GTM.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'leadingcar',
    url: 'https://www.leadingcar.se/',
    skript: '/v1/banner.js',
    // ENGELSK sajt (<html lang="en">), sa bannern ritar sina engelska texter.
    // Star det "Acceptera alla" har larmar overvakningen vid varje korning.
    accepteraText: 'Accept all',
    // Sajtens egen valutavaljare. Satts fore samtycke men bar bara vilken
    // valuta priserna visas i - LEK:s undantag for det besokaren efterfragat.
    // Samma bedomning som NEXT_LOCALE nedan.
    tillatnaCookies: ['currency'],
    // Next.js + Sanity, gtag direkt. Consent Mode default denied ligger inline
    // i deras layout.tsx, sa GA skriver inga cookies fore samtycke - uppmatt
    // 2026-09-02.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'tillvaxtstod',
    url: 'https://www.tillvaxtstod.se/',
    // Bytte till /v1/banner.js med Meta-deployen 2026-09-16. Designen kommer
    // fran design/tillvaxtstod.css, som aterskapar det utseende kundens egen
    // CSS gav den gamla filen.
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Next.js sprakval. Lagras fore samtycke men bar bara vilket sprak sidan
    // ska visas pa - LEK:s undantag for det besokaren efterfragat.
    tillatnaCookies: ['NEXT_LOCALE'],
    // Kor vag A (gtag direkt) och har aldrig omfattats av det strangare laget.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'tillvaxthuset',
    url: 'https://www.tillvaxthuset.se/',
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Cloudflare Turnstile, botskyddet i kontaktformularet. Sessionscookie som
    // bara skiljer manniskor fran robotar - nodvandig for att formularet ska
    // fungera. Uppmatt 2026-09-17 och beskriven i sajtens cookiepolicy 1.1.0.
    tillatnaCookies: ['_cfuvid'],
    // GA infort 2026-09-21. Forst via Webflows egen Google-integration, som
    // satte _ga i 400 dagar fore samtycke - skannern larmade 13:01. Flyttat
    // samma dag till anpassad huvudkod efter consent default, och darefter
    // uppmatt: inga cookies fore samtycke, bara Consent Modes cookielosa
    // anrop. Samma hallning som de andra GA-sajterna.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'skapafaktura',
    url: 'https://www.skapafaktura.nu/',
    // SEOS egen sajt (Next.js, repot Hejsangithub/skapafaktura-nu). Live med
    // bannern 2026-09-21. Fore dess satte GA _ga i 400 dagar utan samtycke.
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Inga egna cookies fore samtycke. Fakturautkastet ligger i localStorage,
    // som skannern inte laser - det redovisas som nodvandigt i cookiepolicyn.
    tillatnaCookies: [],
    // gtag direkt med Consent Mode, som tillvaxtstod.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
  {
    namn: 'allamallar',
    url: 'https://www.allamallar.se/',
    // SEOS egen sajt (Next.js, repot Hejsangithub/allamallar). Live med
    // bannern 2026-09-21.
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Wizardens svar ligger i sessionStorage, inga egna cookies.
    tillatnaCookies: [],
    // STRANGASTE LAGET, med flit: sajtens egen grind (components/Analytics.tsx)
    // hamtar inte ens gtag.js fore samtycke, sa inga cookielosa pingar heller.
    // Uppmatt 2026-09-21: noll anrop till Google fore svar. Borjar det komma
    // pingar har grinden gatt sonder - da ska det larma.
    tillatnaSparare: [],
  },
  {
    namn: 'teorimotorn',
    url: 'https://www.teorimotorn.se/',
    // Astro-sajt (repot Hejsangithub/teorimotorn). Live med bannern 2026-09-22.
    // Ersatte en egenbyggd ruta som bara sparade "ja"/"nej" i localStorage.
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Inga egna cookies. Traningsdatan ligger i localStorage, som skannern
    // inte laser - den redovisas som nodvandig i cookiepolicy 1.1.0.
    tillatnaCookies: [],
    // STRANGASTE LAGET, som allamallar: grinden i src/components/Samtycke.astro
    // hamtar gtag.js forst nar bannern skickar analytics_storage 'granted'.
    // Kommer det pingar till Google fore svar har grinden gatt sonder.
    tillatnaSparare: [],
  },
  {
    namn: 'hpmotorn',
    url: 'https://www.hpmotorn.se/',
    // Astro-sajt (repot Hejsangithub/hpmotorn), samma motor som teorimotorn.
    // Live med bannern 2026-09-22.
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
    // Inga egna cookies. Traningsdatan ligger i localStorage - se policy 1.1.0.
    tillatnaCookies: [],
    // STRANGASTE LAGET, samma grind som teorimotorn.
    tillatnaSparare: [],
  },
];
