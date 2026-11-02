// Fails when the compressed code goes over budget. Run after `npm run build`.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 300;
const dir = new URL('../dist/assets/', import.meta.url);
const code = readdirSync(dir).filter(f => /\.(js|css)$/.test(f));
const kb = code.reduce((sum, f) => sum + gzipSync(readFileSync(new URL(f, dir))).length, 0) / 1024;
console.log(`Compressed code: ${kb.toFixed(1)} KB of ${LIMIT_KB} KB`);
if (kb > LIMIT_KB) process.exit(1);
