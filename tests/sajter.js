// Sajterna som overvakas. Lagg till en rad nar en ny kund far bannern.
//
// `skript` ar den adress sajten FORVANTAS ladda. Star fel adress dar upptacks
// det - t.ex. om nagon rakar byta tillbaka till den gamla filen, eller om en
// ny sajt kopplas in med en gammal scripttagg som nagon kopierat.

module.exports = [
  {
    namn: 'seosdesign',
    url: 'https://www.seosdesign.se/',
    skript: '/v1/banner.js',
    // Texten pa acceptera-knappen. Bevisar att ratt sprak laddats, inte bara
    // att nagon knapp finns.
    accepteraText: 'Acceptera alla',
  },
  {
    namn: 'brevenshus',
    url: 'https://www.brevenshus.se/',
    skript: '/v1/banner.js',
    accepteraText: 'Acceptera alla',
  },
  {
    namn: 'tillvaxtstod',
    url: 'https://www.tillvaxtstod.se/',
    // Kor fortfarande den gamla filen. Byts till /v1/banner.js i samma veva
    // som Meta-deployen - da ska den har raden andras.
    skript: '/js/script.js',
    accepteraText: 'Acceptera alla',
  },
];
