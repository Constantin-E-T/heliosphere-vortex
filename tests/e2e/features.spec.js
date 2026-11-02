import { test, expect } from '@playwright/test';
import { openApp, explore } from './helpers.js';

test('welcome screen offers explore and tour', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator('#splash-title')).toContainText('Heliosphere');
  await expect(page.locator('#go-tour')).toBeVisible();
  expect(errors).toEqual([]);
});

test('every scale opens from the level buttons', async ({ page }) => {
  const errors = await openApp(page);
  await explore(page);
  for (const level of ['mw', 'lg', 'lu', 'solar']) {
    await page.locator(`#levels [data-level=${level}]`).click();
    await expect(page.locator(`#levels [data-level=${level}]`)).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(1500);
  }
  expect(errors).toEqual([]);
});

for (const [hash, level] of [['#milky-way', 'mw'], ['#local-group', 'lg'], ['#local-universe', 'lu'], ['#solar-system', 'solar']]) {
  test(`shared link ${hash} opens ${level}`, async ({ page }) => {
    const errors = await openApp(page, { hash });
    await explore(page);
    await expect(page.locator(`#levels [data-level=${level}]`)).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
}

test('keyboard selects Voyager and the jump menu reaches the flyby', async ({ page }) => {
  const errors = await openApp(page);
  await explore(page);
  await page.keyboard.press('9');
  await expect(page.locator('#in-name')).toHaveText('Voyager 1');
  await page.locator('#b-jump').click();
  await page.locator('#evs').getByText('Voyager 1 at Jupiter').click();
  await expect(page.locator('#d-date')).toHaveText('5 Mar 1979', { timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('time controls pause, change rate and return to now', async ({ page }) => {
  const errors = await openApp(page);
  await explore(page);
  const before = await page.locator('#o-rate').textContent();
  await page.locator('#b-faster').click();
  await expect(page.locator('#o-rate')).not.toHaveText(before);
  await page.locator('#b-play').click();
  await page.locator('#b-now').click();
  await expect(page.locator('#d-date')).toContainText(String(new Date().getUTCFullYear()));
  expect(errors).toEqual([]);
});

test('controls panel, help tabs and clean view work', async ({ page }) => {
  const errors = await openApp(page);
  await explore(page);
  await page.locator('#b-panel').click();
  await expect(page.locator('#panel')).toBeVisible();
  await page.locator('#p-close').click();
  await page.locator('#b-help').click();
  await expect(page.locator('#help')).toBeVisible();
  const tabs = page.locator('#help [role=tab]');
  for (let i = 0; i < await tabs.count(); i++) {
    await tabs.nth(i).click();
    await expect(page.locator('#help .tabpanel:not([hidden])')).toHaveCount(1);
  }
  await page.locator('#help-close').click();
  await page.keyboard.press('h');
  await expect(page.locator('#hud')).toHaveClass(/clean/);
  await page.keyboard.press('h');
  expect(errors).toEqual([]);
});

test('cinematic starts and exits', async ({ page }) => {
  const errors = await openApp(page);
  await page.locator('#go-tour').click({ timeout: 60_000 });
  await expect(page.locator('#cine')).toBeVisible();
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await expect(page.locator('#cine')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the app starts when every image fails to load', async ({ page }) => {
  await page.route(/\/tex\//, r => r.abort());
  const errors = await openApp(page);
  await explore(page);
  await expect(page.locator('#in-name, #d-date').first()).toBeAttached();
  expect(errors).toEqual([]);
});
