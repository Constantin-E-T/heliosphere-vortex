// Turns the originals in assets-src/tex into WebP files in public/tex, in desktop and phone sizes.
// Needs sharp: npm i -D sharp
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'assets-src/tex';
const SIZES = { desktop: 2048, phone: 1024 };

const walk = dir =>
  readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

for (const file of walk(SRC).filter(f => /\.(jpe?g|png)$/i.test(f))) {
  const name = path.relative(SRC, file).replace(/\.\w+$/, '');
  for (const [size, width] of Object.entries(SIZES)) {
    const out = path.join('public/tex', size, `${name}.webp`);
    mkdirSync(path.dirname(out), { recursive: true });
    await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    console.log(out);
  }
}
