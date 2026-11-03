import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';

const csp = readFileSync('deploy/security-headers.conf', 'utf8').match(/Content-Security-Policy "(.+)"/)[1];

/** Writes robots.txt and sitemap.xml for the site's public address. */
function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // The Docker build passes VITE_SITE_URL; local builds fall back to the preview address.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/+$/, '');
  if (!/^https?:\/\/[\w.-]+(:\d+)?$/.test(siteUrl)) throw new Error(`VITE_SITE_URL must be an origin like https://example.com, got "${siteUrl}"`);
  process.env.VITE_SITE_URL = siteUrl;

  return {
    base: '/',
    plugins: [seoFiles(siteUrl)],
    build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 700 },
    preview: { headers: { 'Content-Security-Policy': csp } }
  };
});
