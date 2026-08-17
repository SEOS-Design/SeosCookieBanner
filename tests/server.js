// Minimal statisk server for testerna. Serverar repots rot sa att testsidorna
// i tests/fixtures/ kan lasa bannern fran /src/js/script.js - alltsa den lokala
// koden, inte den som ligger uppe pa CDN:et.
//
// Medvetet utan beroenden: den enda uppgiften ar att skicka fem filer.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 4173;

const TYPER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

http
  .createServer((req, res) => {
    const relativ = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const fil = path.join(ROT, relativ);

    // Hindra att nagon tar sig ut ur repot med ../
    if (!fil.startsWith(ROT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    fs.readFile(fil, (err, data) => {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPER[path.extname(fil)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Testserver pa http://127.0.0.1:${PORT}`);
  });
