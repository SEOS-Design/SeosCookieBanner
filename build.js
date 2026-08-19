// Bygger bannern till EN fil.
//
// banner-src/script.js + src/css/style.css + DOMPurify  ->  src/v1/banner.js
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

// Lases direkt fran filen: paketets "exports" slapper inte igenom
// require('dompurify/package.json').
const dompurifyVersion = JSON.parse(
  fs.readFileSync(path.join(ROT, 'node_modules', 'dompurify', 'package.json'), 'utf8'),
).version;

const huvud = `/*!
 * SEOS Cookiebanner - BYGGD FIL. Redigera inte har, andringar skrivs over.
 *
 * Kalla:  banner-src/script.js + src/css/style.css
 * Bygg:   npm run build
 * Ingar:  DOMPurify ${dompurifyVersion} (https://github.com/cure53/DOMPurify)
 */`;

fs.mkdirSync(path.dirname(UTFIL), { recursive: true });

esbuild.buildSync({
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
});

const bytes = fs.statSync(UTFIL).size;
const gzip = zlib.gzipSync(fs.readFileSync(UTFIL)).length;
const kb = (n) => (n / 1024).toFixed(1) + ' kB';

console.log(`Byggd: src/v1/banner.js  ${kb(bytes)}  (${kb(gzip)} gzippad)`);
