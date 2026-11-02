import { test, expect } from '@playwright/test';
import { openApp, explore } from './helpers.js';

test('welcome screen offers explore and tour', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator('#splash-title')).toContainText('A radio message to Voyager 1');
  await expect(page.locator('#hero-time')).toContainText('seconds');
  await expect(page.locator('#hero-milestone')).toContainText('18 November 2026');
  await expect(page.locator('#go-tour')).toBeVisible();
  expect(errors).toEqual([]);
});

test('every scale opens from the level buttons', async ({ page }) => {
  const errors = await openApp(page);
  await explore(page);
  for (const level of ['mw', 'lg', 'lu', 'solar']) {
    await page.locator(`#levels [data-level=${level}]`).click();
    await expect(page.locator(`#levels [data-level=${level}]`)).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.waitForTimeout(1500);
  }
  expect(errors).toEqual([]);
});

for (const [hash, level] of [
  ['#milky-way', 'mw'],
  ['#local-group', 'lg'],
  ['#local-universe', 'lu'],
  ['#solar-system', 'solar']
]) {
  test(`shared link ${hash} opens ${level}`, async ({ page }) => {
    const errors = await openApp(page, { hash });
    await explore(page);
    await expect(page.locator(`#levels [data-level=${level}]`)).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
  for (let i = 0; i < (await tabs.count()); i++) {
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

test('#voyager opens on Voyager 1', async ({ page }) => {
  const errors = await openApp(page, { hash: '#voyager' });
  await explore(page);
  await expect(page.locator('#in-name')).toHaveText('Voyager 1');
  expect(errors).toEqual([]);
});

test('Follow Voyager 1 plays the short film and returns to the app', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = await openApp(page);
  await page.locator('#go-voyager').click({ timeout: 60_000 });
  await expect(page.locator('#cine')).toBeVisible();
  await expect(page.locator('#l3-t')).toContainText('Voyager 1', { timeout: 30_000 });
  await expect(page.locator('#cine')).toBeHidden({ timeout: 180_000 });
  await expect(page.locator('#in-name')).toHaveText('Voyager 1');
  expect(errors).toEqual([]);
});

test('corrupt saved preferences do not stop the app', async ({ page }) => {
  const errors = await openApp(page, { prefs: '{not json' });
  await explore(page);
  await expect(page.locator('#d-date')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('without WebGL the visitor gets a clear message', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto(process.env.TARGET === 'reference' ? 'about:blank' : '/');
  await expect(page.locator('#splash-err')).toContainText('WebGL');
  await expect(page.locator('#splash-err')).toBeVisible();
});

test('the app starts when every image fails to load', async ({ page }) => {
  await page.route(/\/tex\//, r => r.abort());
  const errors = await openApp(page);
  await explore(page);
  await expect(page.locator('#in-name, #d-date').first()).toBeAttached();
  expect(errors).toEqual([]);
});

for (const [width, height] of [
  [800, 600],
  [844, 390],
  [390, 844]
]) {
  test(`time controls stay on screen at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openApp(page);
    await explore(page);
    await page.keyboard.press('9');
    await expect(page.locator('#in-name')).toHaveText('Voyager 1');
    const box = await page.locator('#tl').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(height);
  });
}
