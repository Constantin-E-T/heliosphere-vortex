// Renders public/share-card.png from the running app. Start `npm run preview` first.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://localhost:4173/');
await page.locator('#go-explore:enabled').waitFor({ timeout: 60_000 });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  document.querySelector('.load').remove();
  document.querySelector('.cta-row').remove();
  document.querySelector('#hero-milestone').remove();
  document.querySelector('#splash-title').textContent = 'Where Voyager 1 is right now';
  document.querySelector('.splash-sub').textContent =
    'Real positions from NASA and JPL data, free in your browser.';
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'public/share-card.png' });
await browser.close();
