import path from 'node:path';

export const FIXED_TIME = new Date('2026-11-02T12:00:00Z');
const REFERENCE_URL = 'file://' + path.resolve('reference/heliosphere-vortex.original.html');

/** Same pseudo-random sequence on every run, so generated stars and textures match. */
const seedRandom = () => {
  let s = 12345;
  Math.random = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export function appUrl(hash = '') {
  return (process.env.TARGET === 'reference' ? REFERENCE_URL : '/') + hash;
}

/** Opens the app and collects uncaught errors. */
export async function openApp(page, { hash = '', seen = false, prefs } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(seedRandom);
  await page.addInitScript(([s, p]) => {
    try {
      if (s) localStorage.setItem('hv-seen', '1');
      if (p !== null) localStorage.setItem('hv-prefs', p);
    } catch { /* storage may be blocked */ }
  }, [seen, prefs ?? null]);
  await page.goto(appUrl(hash));
  await page.locator('#go-explore').waitFor({ state: 'visible', timeout: 60_000 });
  return errors;
}

export async function explore(page) {
  await page.locator('#go-explore').click({ timeout: 60_000 });
  await page.locator('#splash.gone').waitFor({ state: 'attached' });
}
