# Working on Heliosphere Vortex

Read `README.md`, `DESIGN.md` and `HANDOFF.md` first.

## Rules

- Accuracy comes first. A position change needs a test against JPL Horizons.
- Keep `src/engine` free of browser and three.js code.
- Keep three.js at 0.128.0 until a test plan exists: newer versions change lighting and colour.
- Do not change the order in `src/app.js` without reading what each step uses.
- Say "first reached" for one light-day: Earth's orbit takes Voyager back under it for part of 2027.
- Voyager 1 is in interstellar space. It has not left the Milky Way.
- Everything loads from the app's own address. The security policy in `public/_headers` blocks the rest.
- Do not edit `reference/`.

## Before committing

```bash
npm run lint && npm test && npm run build && npm run check:size
```

```bash
npm run test:e2e
```

If a look changes on purpose, update the screenshots with `npx playwright test visual --update-snapshots` and look at them.
