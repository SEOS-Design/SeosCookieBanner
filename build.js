// Bygger bannern till EN fil.
//
// banner-src/script.js + banner-src/style.css + DOMPurify  ->  src/v1/banner.js
//
// Kundens scripttagg blir darmed en enda rad, och det externa beroendet till
// unpkg.com forsvinner helt.
//
// VARFOR KALLKODEN LIGGER I banner-src/ OCH INTE I src/:
// Vercel publicerar src/ rakt av (Root Directory = src). Filen src/js/script.js
// AR alltsa https://seos-cookie-banner.vercel.app/js/script.js - adressen alla
// tre skarpa sajter laddar idag. Lag kallkoden kvar dar skulle en import-rad
// hogst upp i filen slacka bannern pa samtliga sajter i samma sekund som vi
// pushar. Kallkoden ligger darfor utanfor det publicerade tradet, och
// src/js/script.js + src/css/style.css lamnas ororda tills alla sajter bytt
// scripttagg. De ar rollback-vagen: en rad tillbaka i kundens HTML.
//
// VARFOR DEN BYGGDA FILEN COMMITTAS I REPOT:
// Vercel serverar bannerprojektets src/ statiskt, utan byggsteg (Root Directory
// = src). En committad artefakt ligger darfor pa CDN:et direkt vid push, utan
// att projektets instalningar behover roras - och en felaktig instalning hade
// slackt bannern pa alla kundsajter samtidigt. Priset ar att artefakten kan
// drifta fran kallkoden. Det priset betalas av kontrollen i CI, som bygger om
// och jamfor: driftar filen felar bygget.
//
// Darfor far ingenting harifran vara icke-deterministiskt - ingen tidsstampel
// i huvudet, ingen slumpad hash. Samma kalla ska alltid ge exakt samma fil.

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROT = __dirname;
const ENTRY = path.join(ROT, 'banner-src', 'script.js');
const UTFIL = path.join(ROT, 'src', 'v1', 'banner.js');

// VAKTEN (C5 punkt 5). Byggs till en fardig <script>-snutt som klistras in i
// kundens <head>. Ligger i repotets rot och INTE i src/, eftersom den aldrig
// ska hamtas over natet - hela poangen ar att den ar inline och hinner fore.
const GUARD_ENTRY = path.join(ROT, 'banner-src', 'guard.js');
const GUARD_UTFIL = path.join(ROT, 'guard-snippet.html');

// Lases direkt fran filen: paketets "exports" slapper inte igenom
// require('dompurify/package.json').
const dompurifyVersion = JSON.parse(
  fs.readFileSync(path.join(ROT, 'node_modules', 'dompurify', 'package.json'), 'utf8')
).version;

const huvud = `/*!
 * SEOS Cookiebanner - BYGGD FIL. Redigera inte har, andringar skrivs over.
 *
 * Kalla:  banner-src/script.js + banner-src/style.css
 * Bygg:   npm run build
 * Ingar:  DOMPurify ${dompurifyVersion} (https://github.com/cure53/DOMPurify)
 */`;

// Radslut normaliseras till LF innan nagot bakas in.
//
// Pa Windows checkas kallfilerna ut med CRLF, i CI med LF. De tecknen foljer
// med rakt in i den byggda filen - inuti CSS-strangen och inuti bannerns
// HTML-mallar - och da blir filen olika pa olika maskiner. Driftkontrollen kan
// aldrig ga jamnt ut, och "deterministiskt bygge" betyder ingenting.
//
// Detta ar avsiktligt lost HAR och inte bara i .gitattributes: bygget ska ge
// samma fil oavsett hur den som kor det har stallt in sin git.
//
// Upptackt 2026-08-19 nar exakt det hande - CI felade pa forsta pushen.
const normaliseraRadslut = {
  name: 'normalisera-radslut',
  setup(bygge) {
    bygge.onLoad({ filter: /\.(js|css)$/ }, (arg) => {
      // Beroenden levereras med LF ur paketet och rors inte.
      if (arg.path.includes('node_modules')) return;
      return {
        // \r\n? och inte bara \r\n: taler aven ensamma CR.
        contents: fs.readFileSync(arg.path, 'utf8').replace(/\r\n?/g, '\n'),
        loader: arg.path.endsWith('.css') ? 'text' : 'js',
      };
    });
  },
};

fs.mkdirSync(path.dirname(UTFIL), { recursive: true });

// Asynkront API: esbuild tillater inte plugins i det synkrona.
esbuild
  .build({
    plugins: [normaliseraRadslut],
    entryPoints: [ENTRY],
    outfile: UTFIL,
    bundle: true,
    format: 'iife',

    // es2020 halller optional chaining (?.) kvar som den ar. Samma syntax skickas
    // redan idag till kundernas besokare utan problem, och en nedtranspilering
    // hade bara gjort den granskningsbara filen svarare att lasa.
    target: 'es2020',

    // Utan detta skrivs a, a och o som \u-sekvenser i hela bannertexten.
    charset: 'utf8',

    // INTE minifierad, med flit: filen committas och ska ga att granska i en diff.
    // DOMPurify tas in fardigminifierad (se importen i script.js), sa det som
    // annars hade dominerat storleken ligger pa en rad och var kod forblir lasbar.
    minify: false,

    // Stilmallen bakas in som en strang och skrivs ut i ett <style>-element.
    loader: { '.css': 'text' },

    legalComments: 'inline',
    banner: { js: huvud },
  })
  // Listan lases ut ur trackers.js redan har, sa att snutten far den FARDIG.
  // Att baka in hela listan och filtrera den i webblasaren kostade 167 tecken
  // inline i varje kunds huvud, pa varje sidladdning, for noll nytta.
  .then(() =>
    esbuild.build({
      entryPoints: [path.join(ROT, 'banner-src', 'trackers.js')],
      outfile: GUARD_UTFIL + '.trackers.cjs',
      bundle: true,
      format: 'cjs',
      platform: 'node',
    }),
  )
  .then(() => {
    const listfil = GUARD_UTFIL + '.trackers.cjs';
    const { EARLY_TRACKERS } = require(listfil);
    fs.unlinkSync(listfil);

    // Par och inte objekt: nycklarna match/category upprepade en gang per rad
    // ar ren vikt i kundens huvud.
    const par = EARLY_TRACKERS.map((t) => [t.match, t.category]);

    // Vakten minifieras, till skillnad fran bannern: den ligger inline i
    // kundens huvud dar varje byte kostar, och den granskas i sin KALLA
    // (banner-src/guard.js), inte i den genererade snutten.
    return esbuild.build({
      plugins: [normaliseraRadslut],
      entryPoints: [GUARD_ENTRY],
      outfile: GUARD_UTFIL + '.tmp.js',
      bundle: true,
      format: 'iife',
      target: 'es2020',
      charset: 'utf8',
      minify: true,
      legalComments: 'none',
      define: { __SEOS_EARLY__: JSON.stringify(par) },
    });
  })
  .then(() => {
    const kod = fs.readFileSync(GUARD_UTFIL + '.tmp.js', 'utf8').trim();
    fs.unlinkSync(GUARD_UTFIL + '.tmp.js');

    const snutt = [
      '<!-- SEOS-vakten. Måste ligga först i <head>, före allt annat.',
      '     Genererad av npm run build från banner-src/guard.js — redigera inte här.',
      '     Klistras in en gång per sajt. Se driftmanualen avsnitt 16. -->',
      '<script>' + kod + '</script>',
      '',
    ].join(String.fromCharCode(10));

    fs.writeFileSync(GUARD_UTFIL, snutt);

    // Samma kod, som fristaende fil, at testsidan. Genereras HAR i stallet for
    // att kopieras for hand - annars kan testet gronska mot en gammal vakt
    // medan kunderna far en ny.
    fs.writeFileSync(path.join(ROT, 'tests', 'fixtures', 'vakt.js'), kod);

    const bytes = fs.statSync(UTFIL).size;
    const gzip = zlib.gzipSync(fs.readFileSync(UTFIL)).length;
    const kb = (n) => (n / 1024).toFixed(1) + ' kB';

    const guardBytes = fs.statSync(GUARD_UTFIL).size;

    console.log(`Byggd: src/v1/banner.js  ${kb(bytes)}  (${kb(gzip)} gzippad)`);
    console.log(`Byggd: guard-snippet.html  ${kb(guardBytes)}  (inline hos kunden)`);
  })
  .catch(() => process.exit(1));
