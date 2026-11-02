# Launch checklist

Target: live by Fri 13 Nov 2026. Fixes only from Sun 15 Nov. Milestone: 18 Nov 2026, about 10:16 UTC.

## Needed from the owner

- [ ] Download the images from the claude.ai artifact and unzip them into `assets-src/tex`
- [ ] Say go for the public GitHub repository `Constantin-E-T/heliosphere-vortex`
- [ ] Say go for Cloudflare Pages, and choose the web address
- [ ] Try the app on a real iPhone and a real Android phone

## Then

- [ ] `npm i -D sharp` and `node scripts/process-images.mjs`
- [ ] Check every image in `CREDITS.md`
- [ ] `npx playwright test visual --update-snapshots`, and look at the screenshots
- [ ] If the address differs from `heliosphere-vortex.pages.dev`, update `.env.production`, `public/robots.txt` and `public/sitemap.xml`
- [ ] Remake the share card with `scripts/make-share-card.mjs`
- [ ] Test in real Safari. Firefox and WebKit engines already pass all feature tests
- [ ] Check the link preview in a messaging app
- [ ] Run the checks in `AGENTS.md`, then deploy `dist`

Cloudflare Pages settings: build command `npm run build`, output folder `dist`, Node 22.
