import { test, expect } from '@playwright/test';
import { openApp, explore, FIXED_TIME } from './helpers.js';

const scenes = [
  ['solar', ''],
  ['milky-way', '#milky-way'],
  ['local-universe', '#local-universe']
];

for (const [name, hash] of scenes) {
  test(`visual: ${name}`, async ({ page }) => {
    await page.clock.setFixedTime(FIXED_TIME);
    await openApp(page, { hash });
    await explore(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(9000);
    await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      maxDiffPixelRatio: 0.03,
      threshold: 0.3,
      timeout: 20_000
    });
  });
}
