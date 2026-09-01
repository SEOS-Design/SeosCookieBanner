// VAKTEN — snutten som klistras in i kundens <head> (C5 punkt 5).
//
// ⚠️ DEN HÄR FILEN BLIR INLINE HOS KUNDEN. Den byggs, minifieras och skrivs
// till guard-snippet.html, som klistras in som första sak i kundens huvud.
// Att uppdatera den betyder att klistra in på nytt hos VARJE kund — därför
// ska den innehålla mekanismen och en liten, stabil lista, aldrig något som
// ändras ofta. Det som ändras ofta ligger i bannern.
//
//
// VARFÖR DEN BEHÖVS
//
// Bannern laddas async och hinner alltså inte alltid före ett tredjepartsskript.
// Vakten är liten nog att ligga inline — ingen nätverkshämtning, inget som
// fördröjer sidan — och hinner därför alltid först.
//
// Att göra hela bannern renderingsblockerande avvisades av Björn 2026-08-31:
// för en SEO-byrå är Core Web Vitals på varje kunds varje sidladdning en för
// hög kostnad.
//
//
// VAD DEN FÅNGAR OCH INTE
//
// Fångar: skript som SKAPAS AV JAVASCRIPT. Det är så nästan alla
// tredjepartstjänster laddas — en liten loader som drar in resten.
//
// Fångar INTE: ett skript som står direkt i HTML:en. Webbläsaren kör det
// medan den läser sidan, och ingen kod kan komma emellan på ett tillförlitligt
// sätt. Det gäller alla samtyckesverktyg. Där är märkningen säkrast, och det
// är precis vad C5 punkt 4 finns för.
//
//
// ⚠️ VAKTEN SLÄPPER ALDRIG FRAM NÅGOT SJÄLV
//
// Den håller tillbaka och lägger undan. Det är bannern som släpper fram, när
// besökaren sagt ja. Uteblir bannern helt förblir de tillbakahållna skripten
// tillbakahållna — vilket är det säkra felet.

// Listan bakas in AV BYGGET, redan filtrerad och nedkortad till par:
//
//   [["connect.facebook.net", "marketing"], ...]
//
// Par och inte objekt, och inbakad och inte filtrerad i webblasaren. Bada ar
// samma sak: varje tecken har ligger inline i varje kunds huvud, pa varje
// sidladdning. Objektnycklarna upprepade fyra ganger och ett filter-anrop som
// gor samma sak vid varje besok kostade 167 tecken utan att gora nagon nytta.
//
// __SEOS_EARLY__ ersatts av build.js. Filen gar darfor inte att kora som den ar.
const EARLY_TRACKERS = __SEOS_EARLY__;

(function () {
  // Redan igång: klistrar någon in snutten två gånger ska den inte lägga sig
  // i document.createElement en gång till.
  if (window.SEOS_GUARD) return;

  var guard = {
    // Bannern FYLLER PÅ den här listan med den fullständiga när den laddat.
    // Det är hela tvålagerslösningen: snutten bär de stabila namnen, bannern
    // bär den aktuella listan och når alla sajter vid nästa sidladdning.
    list: EARLY_TRACKERS.slice(),
    held: [],
  };

  /** Vilken kategori adressen kräver, eller null om vi inte känner igen den. */
  guard.categoryFor = function (url) {
    for (var i = 0; i < guard.list.length; i++) {
      if (url.indexOf(guard.list[i][0]) !== -1) return guard.list[i][1];
    }
    return null;
  };

  window.SEOS_GUARD = guard;

  var create = document.createElement;

  document.createElement = function (name) {
    var el = create.apply(document, arguments);
    if (String(name).toLowerCase() !== 'script') return el;

    // Fångar adressen i det ögonblick den sätts, innan skriptet hinner köra.
    // setAttribute går förbi den här — det är med flit, och det är så bannern
    // släpper fram ett skript senare.
    Object.defineProperty(el, 'src', {
      configurable: true,
      get: function () {
        return el.getAttribute('src') || '';
      },
      set: function (url) {
        var text = String(url);

        // Bannerns egna skript går alltid igenom. Utan det här hade listan
        // blockerat vår EGEN Meta-pixelladdning efter samtycke.
        if (el.getAttribute('data-seos-own')) {
          el.setAttribute('src', text);
          return;
        }

        var category = guard.categoryFor(text);
        if (category === null) {
          el.setAttribute('src', text);
          return;
        }

        // Har besokaren REDAN sagt ja slapps det igenom direkt. Utan det har
        // hade vakten fortsatt halla tillbaka varje nytt skript efter
        // samtycket - en widget som laddas vid klick hade aldrig kommit fram.
        if (window.SEOS && window.SEOS.hasConsent(category)) {
          el.setAttribute('src', text);
          return;
        }

        // Adressen sätts aldrig. Skriptet laddas inte, och elementet kan
        // sättas in i sidan utan att något händer.
        guard.held.push({ el: el, url: text, category: category });
      },
    });

    return el;
  };
})();
