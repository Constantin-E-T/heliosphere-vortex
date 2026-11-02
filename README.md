# Heliosphere Vortex

Real positions of the planets, Voyager 1 and the nearby universe, in your browser. Follow Voyager 1 to one light-day from Earth, then fly from today's planets to the Laniakea Supercluster, across 6,000 years. Free, with no install and no account.

Designed and built by [FieldOps](https://fieldops.uk), with Claude as coding partner. Not affiliated with or endorsed by NASA.

## How accurate it is

Positions are computed in your browser from published data, and tests check them against [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/).

| Check | Result |
|---|---|
| Voyager 1, table dates | within 300 km of Horizons |
| Voyager 1, 1977 to 1985 | within 200,000 km |
| Voyager 1 at Jupiter | 348,083 km from the planet's centre |
| Voyager 1 at Saturn | 183,509 km from the planet's centre |
| One light-day clock | Horizons distances, 18 Nov 2026 10:16 UTC |
| Great Conjunction, 2020 | 0.11° (observed 0.10°) |

Planets use JPL's approximate elements: within 10′ for 1800 to 2050, and 34′ for 3000 BC to AD 3000.

## Run it

```bash
npm install
```

```bash
npm run dev
```

## Check it

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run lint
```

## How it is organised

| Folder | Holds |
|---|---|
| `src/engine` | Positions and dates. No browser or three.js code |
| `src/data` | Planets, events and Horizons distances |
| `src/scene` | Renderer, sky, Sun, planets, Voyager, heliosphere |
| `src/cosmic` | Milky Way, Local Group, Local Universe |
| `src/camera` | Camera and cinematic tour |
| `src/ui` | Controls, cards, first screen, keyboard |
| `src/core` | State, time, frame loop |

`src/main.js` shows the first screen. `src/app.js` then starts each part in order.

## Licence

Code: MIT. Images and data keep their own terms, listed in [CREDITS.md](CREDITS.md).
