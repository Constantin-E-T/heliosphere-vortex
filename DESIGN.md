# Design

The app is a full-screen 3D stage with glass instruments at the edges. The stage is the subject, so controls stay quiet.

## Tokens

All tokens live in `:root` in `src/styles/app.css`.

| Role | Value |
|---|---|
| Space background | `--void` #04050b |
| Text | `--ink` #e9edf7, `--muted` #8e97b2 |
| Heliosphere, live data, main action | `--helio` #7fd4ff |
| Sun, brand | `--sol` #ffb547 |
| Voyager 1, alerts | `--signal` #ff6fa8 |
| Display type | Syne |
| Text type | Manrope |
| Readouts | JetBrains Mono |

## First screen

One memorable idea: the headline is a live fact. The signal time ticks in `--helio`, in Manrope with fixed-width digits so it does not jitter. Content sits low on the left so the solar system stays visible.

## Rules

- Spacing uses the 4-point scale. Text is never under 12px on phones.
- Write what things do, in sentence case.
- Motion answers a person's action. The tour is the exception, and they start it.
- No NASA logo, and no FieldOps promotion that interrupts the experience.
