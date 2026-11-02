import { Eph } from '../engine/ephemeris.js';

/* ================= STATE ================= */
export const S = {
  jd: Eph.nowJD(),
  rate: 4,
  rateCur: 1,
  dir: 1,
  playing: true,
  frame: 'galactic',
  scale: 'sqrt',
  drift: 120,
  wake: 600,
  anchorJD: null,
  labels: true,
  trails: true,
  moons: true,
  sound: false,
  view: 'overview',
  tour: false,
  travel: null,
  lastSample: null,
  scrubbing: false
};

export function initState() {
  S.anchorJD = S.jd;
}
