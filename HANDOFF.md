# Heliosphere Vortex: handoff

Read `AGENTS.md` first. The launch steps left are in `docs/launch-checklist.md`.

## Where things stand

- Version 1.5, a Vite project in `~/Desktop/Heliosphere-Vortex`, on the local `main` branch. Not pushed or deployed yet.
- The live app is still the old version: https://claude.ai/artifact/EqAZ9ikSDM5fuW7D94wdAi
- Design system artifact: https://claude.ai/artifact/M3WJAdJCTKFJ2U866DgQ8X
- The 20 images are only in the app artifact, under `tex/` and `tex/photo/`. Until they arrive, planets use generated surfaces.
- `reference/` holds the single-file app this project came from.

## Architecture

- `src/main.js` shows the first screen, then loads `src/app.js`, which runs the startup steps in order with a pause between each.
- Modules hold their shared objects as exported bindings, set by an `init` function. `src/core/live.js` holds values several modules reassign.
- Scene mapping: `(x, y, z)` ecliptic becomes `(x, z, −y)`. The solar scene is in AU, the cosmic scene in kpc, with x toward the Galactic Centre and y toward the north galactic pole.
- Voyager 1 uses Sun-centred Horizons vectors, interpolated in x, y, z. Do not use Horizons observer-table r and longitude: they lag by the light-travel time.
- The one-light-day clock uses `src/data/lightday-range.json`, refreshed by `scripts/fetch-lightday-range.mjs`. It runs out on 1 Feb 2027, then the engine's distance is used.

## Verified results

- Voyager within 275 km of Horizons at every table date, and under 200,000 km across 1977–1985. Peak error between rows is about 14 million km near 1987, under 3 million km after 1995.
- Flybys against real planet positions: 348,083 km from Jupiter, 183,509 km from Saturn.
- The engine's own Saturn is 0.0107 AU off at the flyby. The Standish elements cause this.
- Horizons puts the one-light-day crossing at 18 Nov 2026 10:16:28 UTC. The engine alone gives 10:23.
- Great Conjunction 2020: 0.11° (observed 0.10°).

## Ideas after launch

- Denser Voyager rows for 1985–1995.
- Real photos for Andromeda, Orion and the Pillars of Creation.
- Pluto and Halley's Comet (2061).
- Android port: `src/engine` has no dependencies.
- Upgrade three.js, with a visual test plan.
