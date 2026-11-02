import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const csp = readFileSync('public/_headers', 'utf8').match(/Content-Security-Policy: (.+)/)[1];

export default defineConfig({
  base: '/',
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 700 },
  preview: { headers: { 'Content-Security-Policy': csp } }
});
