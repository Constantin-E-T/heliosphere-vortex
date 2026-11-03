# Launch checklist

Target: live by Fri 13 Nov 2026. Fixes only from Sun 15 Nov. Milestone: 18 Nov 2026, about 10:16 UTC.

## Needed from the owner

- [ ] Download the images from the claude.ai artifact and unzip them into `assets-src/tex`
- [x] Public GitHub repository `Constantin-E-T/heliosphere-vortex`
- [ ] Choose the web address, and point its DNS at the Coolify VPS
- [ ] Try the app on a real iPhone and a real Android phone

## Then

- [ ] `npm i -D sharp` and `node scripts/process-images.mjs`
- [ ] Check every image in `CREDITS.md`
- [ ] `npx playwright test visual --update-snapshots`, and look at the screenshots
- [ ] Remake the share card with `scripts/make-share-card.mjs`
- [ ] Test in real Safari. Firefox and WebKit engines already pass all feature tests
- [ ] Run the checks in `AGENTS.md`, then deploy on Coolify
- [ ] Check the live headers: `curl -sI https://your.domain/`
- [ ] Check the link preview in a messaging app

## Coolify settings

- Source: GitHub `Constantin-E-T/heliosphere-vortex`, branch `main`
- Build pack: Dockerfile. Port: 80
- Build variable: `VITE_SITE_URL=https://your.domain` (no trailing slash). The build stops if it is missing.
- Domain: your address with `https://`. Coolify's proxy issues the certificate.
- Health check: the image has one built in (`wget` on `/`).

The site address sets the share links, `robots.txt` and `sitemap.xml`, which are made during the build.
