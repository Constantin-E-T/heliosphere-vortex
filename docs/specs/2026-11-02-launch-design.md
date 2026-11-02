# Heliosphere Vortex: public launch design

Date: 2 Nov 2026. Status: waiting for approval. Nothing is built yet.

## Why

Voyager 1 reaches about one light-day from Earth on 18 Nov 2026. Public interest gives this app a real launch moment.

The app has two jobs:
1. Let anyone explore real space positions in a browser, free, with no install and no account.
2. Show what FieldOps can build. The code and structure are part of that showcase, so they must be clean enough to show a client.

## Rules

1. **Do not break it.** Everything the app does today must still work at launch.
2. **Fast everywhere.** Current Chrome, Safari, Firefox and Edge, on desktop and phone.
3. **Accuracy is the brand.** Every claim on screen must be true and tested.

## Goals

- Live at a public link by Fri 13 Nov 2026, frozen except for fixes from Sun 15 Nov.
- A clean project in `~/Desktop/Heliosphere-Vortex`, under git.
- A clear Voyager story on the first screen.
- Link previews that look good when shared.

## Non-goals before launch

- Android or iOS apps.
- Accounts, comments or anything needing a backend.
- Upgrading three.js. It stays on r128 until after launch, because newer versions change lighting and colour.
- Pluto, Halley's Comet and new telescope photos.
- A full redesign. The visual identity is kept and sharpened.

## Failure, even if it technically works

- A feature that works today is missing or looks worse.
- A phone crashes or overheats, or the first screen stays blank.
- The app states something false, such as Voyager leaving the galaxy.
- It looks like a NASA product. NASA's name is used only to credit data and images, with no NASA logo.
- FieldOps promotion gets in the way of the experience.

## Constraints found in the audit

- The app is one 189 KB HTML file of about 2,260 lines: 45 KB CSS and markup at the top, then the engine, then about 1,550 lines of app code.
- It loads three.js, OrbitControls and fonts from outside services. All of these move into the project.
- It needs 20 images: `tex/sky.jpg`, 13 planet and moon maps, and 6 photos in `tex/photo/`. **They are not on this computer.** The artifact needs a claude.ai sign-in, so the chat that made them must package them.
- Tools available: Node 22, npm, and GitHub signed in as `Constantin-E-T`. No hosting tool is installed yet.

## Project structure (builder's call)

Vite with plain JavaScript modules, and JSDoc types checked by TypeScript. No UI framework: the app is a 3D canvas with light controls, so a framework adds weight without benefit.

```
Heliosphere-Vortex/
  index.html
  public/           images, fonts, share card
  src/
    engine/         ephemeris, Voyager data, frames: no three.js, no browser
    data/           bodies, events, cosmic catalogue, shots
    scene/          renderer, sky, planets, heliosphere, wakes, cosmic levels
    camera/         camera, flight, cinematic director
    ui/             panels, time machine, cards, welcome, modal, sound, keyboard
    styles/         tokens and component CSS
    main.js
  tests/
    engine/         accuracy checks
    e2e/            browser journeys and screenshots
  scripts/          Horizons refresh, image processing
  docs/
```

The engine stays free of browser code, so the later Android port can follow it directly.

## How we avoid breaking it

Work happens in this order, and each step must pass before the next starts.

1. **Baseline.** Record the current app with the real images: screenshots of each scale and key events, plus a written feature checklist.
2. **Move as it is.** Put the app into Vite with no behaviour changes. Compare against the baseline.
3. **Lock accuracy.** Turn every check from `HANDOFF.md` into an automated test, including the Horizons comparisons.
4. **Split into modules**, one area at a time, one commit each, with browser tests after each.
5. **Improve** only after the structure is stable.

The original `heliosphere-vortex.html` stays untouched as the reference until launch.

## Speed targets

| Measure | Target |
|---|---|
| First screen visible on a mid-range phone, 4G | under 2.5 s |
| Code download, compressed | under 300 KB |
| Frame rate, desktop | 60 fps |
| Frame rate, mid-range Android | steady 30 fps or better |
| Lighthouse performance, accessibility, best practices, SEO | 90+ each |

How we get there:
- Self-host and compress all images as WebP, in desktop and phone sizes, loading the phone size on small screens.
- Load the galaxy levels only when someone opens them.
- Show the app before high-resolution images finish.
- Build the existing adaptive pixel ratio into a quality system that reduces effects on slow devices.
- Pause rendering when the tab is hidden.
- Keep the code in a check that fails the build if it exceeds the size target.

## Improvements

**For launch**
- A Voyager first screen: live distance from Earth, signal travel time, and a countdown to one light-day. After the moment it changes to time since the milestone.
- A direct link, `#voyager`, that opens on Voyager.
- A short Voyager cinematic built from existing shots.
- Share previews for social and messaging apps, with one designed image.
- A friendly message for browsers without WebGL.
- Keyboard use, screen reader labels on controls, visible focus, and reduced motion support.
- Phone layout pass on the panels and timeline.
- Design polish using the existing tokens: spacing, hierarchy, and cleaner first-run flow.
- Self-hosted fonts and a security policy that allows only the app's own files.

**The light-day clock must be exact.** The planet model puts the crossing about 7 minutes late, at 10:23 UTC against Horizons' 10:16. The countdown will therefore use a small table of Earth-to-Voyager distances from Horizons, and the wording will say "about", matching NASA.

**The story must be accurate.** Voyager 1 left the Sun's heliosphere in 2012 and is in interstellar space. It remains inside the Milky Way.

## FieldOps (my guess, please correct)

- A quiet "Built by FieldOps" link in the app corner and the credits, opening the FieldOps website.
- A short "How this was built" section in the credits, with a link to the source code.
- One line at the end of the Voyager cinematic.
- No popups and no sales forms.
- The README and the marketing copy credit the build honestly, including Claude's part.

## Publishing (my guess, please correct)

- Hosting on Cloudflare Pages, free and fast, because FieldOps already uses Cloudflare.
- GitHub repository `Constantin-E-T/heliosphere-vortex`, public, MIT licence for the code. Images keep their own credits in `CREDITS.md`.
- Automatic checks on GitHub: tests, build, size limit.
- Privacy-friendly: no cookies, no tracking banner. Cloudflare's cookie-free visitor count only.

Creating the repository, going public and connecting a domain each need your go-ahead at that moment.

## Definition of done

- The feature checklist passes against the baseline.
- All accuracy tests pass.
- Tested in real browsers: Chrome, Safari, Firefox, and a phone-sized view. Real-device testing on your phone is the last step before launch.
- Speed targets met, or any miss reported with numbers.
- Security review of the full change passed.
- `README.md`, `CREDITS.md`, `AGENTS.md`, `DESIGN.md` and `HANDOFF.md` are written.

## Risks

| Risk | Fallback |
|---|---|
| Images arrive late | Build with placeholders; launch needs them by 8 Nov |
| A launch-day traffic spike | Static hosting on a global network handles it |
| Phone performance misses target | Lower quality tier on phones |
| Module split runs long | Launch with the parts done; the app still works after each step |
| Image licence question | Keep only images with a clear NASA/ESA credit path; check each in `CREDITS.md` |
