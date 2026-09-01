// DENYLISTAN — den gemensamma listan över tredjeparter som hålls tillbaka
// tills besökaren sagt ja (C5 punkt 5).
//
// EN FIL, EN RAD PER TJÄNST, OCH VARJE RAD BÄR SITT SKÄL.
//
//
// ⛔ SPÄRREN GÄLLER FÖRE ALLT ANNAT HÄR
//
// Björns regel 2026-09-01: blockering ska vara logisk, aldrig aggressiv. En
// besökare som inte kan boka ett möte eller se en video är ett sämre utfall än
// en cookie vi kunde ha stoppat. Fyra frågor innan en rad läggs till, hela
// resonemanget i COOKIEBANNER-DOKUMENTATION.md avsnitt C5:
//
//   1. Spårar den?                     Nej -> lägg inte till (cal.com)
//   2. Bad besökaren om den?           Ja  -> ladda vid klicket i stället
//   3. Går sidan att använda utan den? Nej -> mänskligt beslut, aldrig automatik
//   4. Syns det, och ett klick vidare? Nej -> gör det inte
//
//
// ⚠️ DENYLIST, ALDRIG ALLOWLIST
//
// Känner vi inte igen adressen rör vi den inte. En sajt med tio tjänster där
// tre står här — de sju andra beter sig exakt som utan bannern. Det gör att
// "vi stoppade något vi inte skulle" kräver en felaktig rad hos oss, som kan
// rättas centralt.
//
//
// TVÅ LAGER, OCH VARFÖR
//
//   early: true    ligger ÄVEN i snutten som klistras in i kundens <head>
//   early: false   ligger bara här, i bannern
//
// Snutten måste bestämma sig i samma ögonblick som ett skript skapas — den kan
// inte fråga någon annan och samtidigt hinna först. Därför bär den en liten,
// stabil lista som klistras in en gång.
//
// Den här listan är den fullständiga. Den når alla sajter vid nästa
// sidladdning efter vår push, eftersom CDN-filen har max-age=0.
//
// ⚠️ Sätt early: true bara på tjänster som typiskt laddas TIDIGT i <head>.
// Det är det enda snutten tillför utöver bannern, och varje rad där är en rad
// som bara uppdateras genom att klistra in på nytt hos varje kund.
//
// YouTube står med flit INTE här: en inbäddning är en <iframe> i sidans kropp,
// inte ett skript i huvudet. Den hanteras av märkningen (C5 punkt 4).

export const TRACKERS = [
  {
    match: 'connect.facebook.net',
    category: 'marketing',
    early: true,
    // Meta Pixel. Laddas som snutt i <head> och sätter _fbp direkt.
    //
    // ⚠️ Bannern laddar SJÄLV den här adressen efter samtycke (loadMetaPixel).
    // Det skriptet bär data-seos-own och släpps alltid igenom — utan det hade
    // listan blockerat vår egen pixelladdning.
  },
  {
    match: 'analytics.tiktok.com',
    category: 'marketing',
    early: true,
    // TikTok Pixel. Samma form som Meta: snutt i huvudet.
  },
  {
    match: 'static.hotjar.com',
    category: 'analytics',
    early: true,
    // Hotjar. Sessionsinspelning och värmekartor, laddas i huvudet.
  },
  {
    match: 'snap.licdn.com',
    category: 'marketing',
    early: true,
    // LinkedIn Insight Tag.
  },
];

/** Bara det som ska med i snutten som klistras in hos kunden. */
export const EARLY_TRACKERS = TRACKERS.filter((t) => t.early).map((t) => ({
  match: t.match,
  category: t.category,
}));
