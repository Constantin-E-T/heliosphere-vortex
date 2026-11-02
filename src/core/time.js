import { Eph } from '../engine/ephemeris.js';
import { S } from './state.js';
import { $, reduceMotion } from './util.js';
import { MONTHS } from '../data/solar.js';
import { clearTrails } from '../scene/wakes.js';

/* ================= TIME HELPERS ================= */
export const clampJD = jd => Math.min(Eph.MAX_JD, Math.max(Eph.MIN_JD, jd));

export const pad = n => String(n).padStart(2, '0');

export function yearLabel(y) {
  return y <= 0 ? `${1 - y} BC` : y < 1000 ? `AD ${y}` : String(y);
}

export function fmtDate(jd) {
  const c = Eph.jdToCal(jd);
  return {
    c,
    date: `${c.day} ${MONTHS[c.month - 1]} ${yearLabel(c.year)}`,
    time: `${pad(c.h)}:${pad(c.min)}:${pad(c.s)} UTC`
  };
}

export function fmtShort(jd) {
  const c = Eph.jdToCal(jd);
  return c.year < 1 ? `${1 - c.year} BC` : `${c.year}-${pad(c.month)}-${pad(c.day)}`;
}

export function travelTo(jd, after) {
  jd = clampJD(jd);
  clearTrails();
  const span = Math.abs(jd - S.jd);
  if (span < 1e-4 || reduceMotion) {
    S.jd = jd;
    S.anchorJD = jd;
    after && after();
    return;
  }
  S.travel = {
    from: S.jd,
    to: jd,
    t: 0,
    dur: Math.min(2.6, 0.9 + Math.log10(1 + span / 30) * 0.45),
    after
  };
  $('#warp').classList.add('on');
}

/* Timeline mapping: piecewise so the modern era gets room */
export const TL = [
  [-2999, 0],
  [1500, 0.38],
  [1800, 0.52],
  [2050, 0.86],
  [3000, 1]
];

export function yearToPos(y) {
  for (let i = 0; i < TL.length - 1; i++) {
    const [y0, p0] = TL[i],
      [y1, p1] = TL[i + 1];
    if (y <= y1 || i === TL.length - 2)
      return Math.min(1, Math.max(0, p0 + ((p1 - p0) * (y - y0)) / (y1 - y0)));
  }
  return 1;
}

export function posToYear(p) {
  for (let i = 0; i < TL.length - 1; i++) {
    const [y0, p0] = TL[i],
      [y1, p1] = TL[i + 1];
    if (p <= p1) return y0 + ((y1 - y0) * (p - p0)) / (p1 - p0);
  }
  return 3000;
}

export const jdToPos = jd => yearToPos(Eph.yearOf(jd));

export const posToJD = p => Eph.J2000 + (posToYear(p) - 2000) * 365.25;

export function initTime() {
  {
    const pct = jd => (jdToPos(jd) * 100).toFixed(2) + '%';
    $('#band-t1').style.left = pct(Eph.T1_START);
    $('#band-t1').style.width = `calc(${pct(Eph.T1_END)} - ${pct(Eph.T1_START)})`;
    $('#band-voy').style.left = pct(Eph.VOY_EVENTS.launch);
    $('#band-voy').style.right = '0';
    const ticks = [
      [-2999, '3000 BC'],
      [1, 'AD 1', 1],
      [1500, '1500', 1],
      [1800, '1800'],
      [1977, '1977', 1],
      [2050, '2050'],
      [3000, '3000']
    ];
    $('#ticks').innerHTML = ticks
      .map(
        ([y, t, opt]) =>
          `<span${opt ? ' class="opt"' : ''} style="left:${(yearToPos(y) * 100).toFixed(2)}%">${t}</span>`
      )
      .join('');
  }
}
