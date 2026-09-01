// Byter identifierarnamn utan att röra kommentarer eller strängar.
//
//   node tests/rename-identifiers.js <fil> <karta.json>          torrkörning
//   node tests/rename-identifiers.js <fil> <karta.json> --run    skarpt
//
// Kartan är JSON: { "gammaltNamn": "newName", ... }
//
// Fungerar på både .js och .ts, och kan köras mot API-repots filer också —
// den tar en sökväg, inte ett repo.
//
//
// VARFÖR DEN FINNS
//
// Namnbytesplanen (NAMNBYTEN-ATT-GORA.md) säger att bytena måste göras rad för
// rad, inte mekaniskt. Skälet: hälften av namnen är samma ord som står i de
// svenska kommentarerna. En sök-och-ersätt skrev 2026-08-28 om GEOMETRI till
// GEOMETRY mitt i en svensk mening, och INGET TEST FÅNGAR DET — kommentarer
// påverkar inte körningen.
//
// Den här går igenom filen tecken för tecken och vet när den är i kod, i en
// kommentar, i en sträng eller i en regex. Bara kod ändras.
//
//
// ⚠️ TRE KONTROLLER SOM VÄGRAR, I STÄLLET FÖR ATT VARNA
//
// Reglerna ligger i kommandot och inte i den här kommentaren, av samma skäl
// som geometri avvisas i publish-design: seed.ts skrev ut en inaktuell
// instruktion i månader utan att någon märkte det. Instruktioner i kod ruttnar.
// En kontroll som vägrar gör det inte.
//
//   1. Ändrad kommentar  -> skriver inte
//   2. Ändrad sträng     -> skriver inte
//   3. dataset.<namn>    -> skriver inte
//
// Den tredje kommer från en riktig regression 2026-09-01. Verktyget bytte
// `card.dataset.reglage` till `dataset.toggleId`, alltså HTML-attributet
// data-reglage till data-toggle-id, i tre kunders DOM. Båda sidor byttes
// konsekvent så klickandet fungerade, och ALLA 95 TESTER VAR GRÖNA. Det var en
// renderingsjämförelse mot produktion som fångade det.
//
// `dataset.X` ser ut som kod, för det ÄR kod. Att det definierar ett
// HTML-attribut går inte att se — därför frågar verktyget i stället för att
// gissa. Attributnamn byts i commit 3, medvetet och för sig.
//
//
// ⚠️ VAD DEN INTE KAN SE: SCOPE
//
// Krockar ett nytt namn med ett som redan finns i samma funktion märker den
// ingenting. `mapp` -> `dir` krockade med ett befintligt `dir` 2026-09-01.
//
//   Kör alltid `npx tsc --noEmit` efter ett byte i API-repot.
//   Kör alltid hela Playwright-sviten efter ett byte i bannern.
//   Och jämför renderingen mot produktion — testerna räcker inte.

const fs = require('fs');

/**
 * Delar upp källkoden i bitar som är kod respektive inte.
 * Kod inuti ${...} i en mallsträng räknas som kod, vilket är rätt.
 */
function splitCode(src) {
  const parts = [];
  let i = 0;
  let start = 0;
  let mode = 'code';
  const templateDepth = [];

  const push = (until, isCode) => {
    if (until > start) parts.push({ isCode, text: src.slice(start, until) });
    start = until;
  };

  // Skiljer regex från division genom att titta bakåt på första icke-blanka
  // tecknet. Inte perfekt, men fel åt rätt håll: gissar den regex lämnas
  // innehållet orört.
  const couldBeRegex = (pos) => {
    for (let j = pos - 1; j >= 0; j--) {
      const c = src[j];
      if (/\s/.test(c)) continue;
      return !/[a-zA-Z0-9_$)\]]/.test(c);
    }
    return true;
  };

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];

    if (mode === 'code') {
      if (c === '/' && n === '/') {
        push(i, true);
        mode = 'lineComment';
        i += 2;
      } else if (c === '/' && n === '*') {
        push(i, true);
        mode = 'blockComment';
        i += 2;
      } else if (c === "'" || c === '"') {
        push(i, true);
        mode = c === "'" ? 'single' : 'double';
        i++;
      } else if (c === '`') {
        push(i, true);
        mode = 'template';
        i++;
      } else if (c === '/' && couldBeRegex(i)) {
        push(i, true);
        mode = 'regex';
        i++;
      } else if (c === '}' && templateDepth.length > 0) {
        push(i, true);
        templateDepth.pop();
        mode = 'template';
        i++;
      } else i++;
    } else if (mode === 'lineComment') {
      if (c === '\n') {
        push(i, false);
        mode = 'code';
      }
      i++;
    } else if (mode === 'blockComment') {
      if (c === '*' && n === '/') {
        i += 2;
        push(i, false);
        mode = 'code';
      } else i++;
    } else if (mode === 'single' || mode === 'double') {
      const end = mode === 'single' ? "'" : '"';
      if (c === '\\') i += 2;
      else if (c === end) {
        i++;
        push(i, false);
        mode = 'code';
      } else i++;
    } else if (mode === 'template') {
      if (c === '\\') i += 2;
      else if (c === '$' && n === '{') {
        push(i, false);
        templateDepth.push(1);
        mode = 'code';
        i += 2;
      } else if (c === '`') {
        i++;
        push(i, false);
        mode = 'code';
      } else i++;
    } else if (mode === 'regex') {
      if (c === '\\') i += 2;
      else if (c === '[') {
        while (i < src.length && src[i] !== ']') {
          if (src[i] === '\\') i++;
          i++;
        }
        i++;
      } else if (c === '/') {
        i++;
        push(i, false);
        mode = 'code';
      } else i++;
    }
  }
  push(src.length, mode === 'code');
  return parts;
}

/** Alla kommentar- och strängbitar, för jämförelse före och efter. */
function nonCode(src) {
  return splitCode(src)
    .filter((p) => !p.isCode)
    .map((p) => p.text);
}

function main() {
  const [, , file, mapFile, flag] = process.argv;
  if (!file || !mapFile) {
    console.error('Anvandning: node tests/rename-identifiers.js <fil> <karta.json> [--run]');
    process.exit(2);
  }

  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  const src = fs.readFileSync(file, 'utf8');

  // KONTROLL 3, före allt annat: definierar något av namnen ett HTML-attribut?
  const asDataset = Object.keys(map).filter((k) =>
    new RegExp('dataset\\.' + k + '\\b').test(src),
  );
  if (asDataset.length > 0) {
    console.error(`\n  ${file}`);
    console.error('  VAGRAR: dessa namn anvands som dataset.<namn> och definierar darmed');
    console.error('  HTML-attribut (data-<namn>) i besokarens DOM:\n');
    for (const k of asDataset) console.error(`    dataset.${k}   ->   data-${k}`);
    console.error('\n  Attributnamn byts i commit 3, medvetet och for sig. Ta bort namnen ur');
    console.error('  kartan, eller byt variabeln for hand och lat dataset-raden sta kvar.\n');
    process.exit(1);
  }

  const counts = {};
  const out = splitCode(src)
    .map((p) => {
      if (!p.isCode) return p.text;
      let t = p.text;
      for (const [from, to] of Object.entries(map)) {
        t = t.replace(new RegExp('\\b' + from + '\\b', 'g'), () => {
          counts[from] = (counts[from] || 0) + 1;
          return to;
        });
      }
      return t;
    })
    .join('');

  // KONTROLL 1 och 2: ingenting utanfor koden far ha andrats.
  const before = nonCode(src);
  const after = nonCode(out);
  if (before.length !== after.length || before.some((v, i) => v !== after[i])) {
    console.error(`\n  ${file}`);
    console.error('  VAGRAR: en kommentar eller strang har andrats. Det ar precis det');
    console.error('  verktyget finns for att forhindra. Ingenting skrevs.\n');
    for (let i = 0; i < Math.max(before.length, after.length); i++) {
      if (before[i] !== after[i]) {
        console.error(`    FORE:  ${JSON.stringify((before[i] || '').slice(0, 90))}`);
        console.error(`    EFTER: ${JSON.stringify((after[i] || '').slice(0, 90))}\n`);
        break;
      }
    }
    process.exit(1);
  }

  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, r) => s + r[1], 0);
  console.log(`\n  ${file}`);
  for (const [from, count] of rows) {
    console.log(`    ${from.padEnd(20)} -> ${map[from].padEnd(20)} ${count}`);
  }
  const unused = Object.keys(map).filter((k) => !counts[k]);
  if (unused.length) console.log(`    (ingen traff: ${unused.join(', ')})`);
  console.log(`    ${total} traffar i kod, 0 i kommentarer och strangar`);

  if (flag === '--run') {
    fs.writeFileSync(file, out);
    console.log('    SKRIVEN');
    console.log('\n  Kvar att gora sjalv: tsc --noEmit (API:t), hela Playwright-sviten,');
    console.log('  och en renderingsjamforelse mot produktion. Verktyget ser inte scope,');
    console.log('  och testerna ser inte allt.');
  } else {
    console.log('    (torrkorning - lagg till --run)');
  }
}

main();
