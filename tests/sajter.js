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
    namn: 'tillvaxtstod',
    url: 'https://www.tillvaxtstod.se/',
    // Kor fortfarande den gamla filen. Byts till /v1/banner.js i samma veva
    // som Meta-deployen - da ska den har raden andras.
    skript: '/js/script.js',
    accepteraText: 'Acceptera alla',
    // Next.js sprakval. Lagras fore samtycke men bar bara vilket sprak sidan
    // ska visas pa - LEK:s undantag for det besokaren efterfragat.
    tillatnaCookies: ['NEXT_LOCALE'],
    // Kor vag A (gtag direkt) och har aldrig omfattats av det strangare laget.
    tillatnaSparare: ['google-analytics.com', 'analytics.google.com'],
  },
];
