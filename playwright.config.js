// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Testsidorna laddar den BYGGDA filen (src/v1/banner.js), inte kallkoden -
  // det ar den filen kunderna far. Bygget ligger darfor i serverstarten och
  // inte i ett npm-skript: annars kor 'npx playwright test' mot en gammal
  // bundle och ett trasigt bygge kan passera som gront.
  //
  // reuseExistingServer ar avstangt av samma skal. En redan igang server hade
  // hoppat over bygget.
  webServer: {
    command: 'node build.js && node tests/server.js',
    url: `http://127.0.0.1:${PORT}/tests/fixtures/banner.html`,
    reuseExistingServer: false,
  },
});
