import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Eph } from '../../src/engine/ephemeris.js';

const H = JSON.parse(readFileSync(new URL('../fixtures/horizons.json', import.meta.url)));
const o = () => ({ x: 0, y: 0, z: 0 });
const km = au => au * Eph.AU_KM;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const v3 = ([x, y, z]) => ({ x, y, z });
const LIGHT_HOUR_AU = 299792.458 * 3600 / Eph.AU_KM;
const voyagerErrorKm = p => km(dist(Eph.voyager(p.jd, o()), v3(p.pos)));
const lightHours = jd => dist(Eph.voyager(jd, o()), Eph.earth(Eph.ttFromUT(jd), o())) / LIGHT_HOUR_AU;

describe('Voyager 1 against JPL Horizons', () => {
  it('matches every table row within 300 km', () => {
    expect(Math.max(...H.rows.map(voyagerErrorKm))).toBeLessThan(300);
  });

  it('stays within 200,000 km from 1977 to 1985', () => {
    expect(Math.max(...H.grid1977to1985.map(voyagerErrorKm))).toBeLessThan(200_000);
  });

  it('stays within 15 million km at every midpoint after 1985', () => {
    const late = H.midpoints.filter(p => p.jd > 2446312.5);
    expect(Math.max(...late.map(voyagerErrorKm))).toBeLessThan(15_000_000);
  });

  it('is 348,083 km from Jupiter and 183,509 km from Saturn at the flybys', () => {
    const to = (name, event) => km(dist(Eph.voyager(Eph.VOY_EVENTS[event], o()), v3(H.planetsAtFlyby[name])));
    expect(to('jupiter', 'jupiter')).toBeCloseTo(348_083, -3);
    expect(to('saturn', 'saturn')).toBeCloseTo(183_509, -3);
  });

  it('crosses one light-day within 10 minutes of Horizons (18 Nov 2026 10:16:28 UTC)', () => {
    const horizons = Date.UTC(2026, 10, 18, 10, 16, 28) / 86400000 + 2440587.5;
    let t = horizons - 1;
    while (lightHours(t) < 24) t += 1 / 1440;
    expect(Math.abs(t - horizons) * 1440).toBeLessThan(10);
  });

  it('agrees with the Horizons range within 11,000 km near the crossing', () => {
    for (const [jd, au] of Object.entries(H.earthRangeAu)) {
      const j = Number(jd), got = dist(Eph.voyager(j, o()), Eph.earth(Eph.ttFromUT(j), o()));
      expect(Math.abs(km(got - au))).toBeLessThan(11_000);
    }
  });

  it('does not exist before launch, and keeps moving after the last row', () => {
    expect(Eph.voyager(Eph.calToJD(1977, 1, 1), o())).toBeNull();
    const a = Eph.voyager(Eph.calToJD(2030, 1, 2), o()), b = Eph.voyager(Eph.calToJD(2031, 1, 2), o());
    expect(dist(a, b)).toBeCloseTo(3.57, 1);
  });
});

describe('planets', () => {
  it('reproduces the 2020 Great Conjunction at 0.11°', () => {
    const tt = Eph.ttFromUT(Eph.calToJD(2020, 12, 21.75)), e = Eph.earth(tt, o());
    const rel = n => { const p = Eph.planet(n, tt, o()); return { x: p.x - e.x, y: p.y - e.y, z: p.z - e.z }; };
    const [J, S] = [rel('Jupiter'), rel('Saturn')], n = v => Math.hypot(v.x, v.y, v.z);
    const deg = Math.acos((J.x * S.x + J.y * S.y + J.z * S.z) / n(J) / n(S)) * 180 / Math.PI;
    expect(deg).toBeCloseTo(0.11, 1);
  });

  it('uses Table 1 from 1800 to 2050 and Table 2 outside', () => {
    expect(Eph.tableFor(Eph.calToJD(2000, 1, 1))).toBe(1);
    expect(Eph.tableFor(Eph.calToJD(1500, 1, 1))).toBe(2);
    expect(Eph.tableFor(Eph.calToJD(2051, 1, 1))).toBe(2);
  });
});

describe('calendar (Meeus)', () => {
  it.each([[2000, 1, 1.5, 2451545], [1987, 1, 27, 2446822.5], [-1000, 7, 12.5, 1356001], [-4712, 1, 1.5, 0]])(
    '%d-%d-%d is JD %d', (y, m, d, jd) => expect(Eph.calToJD(y, m, d)).toBe(jd));

  it('jumps from 4 to 15 October 1582', () => {
    expect(Eph.calToJD(1582, 10, 15) - Eph.calToJD(1582, 10, 4)).toBe(1);
  });

  it('round-trips a date', () => {
    expect(Eph.jdToCal(Eph.calToJD(1957, 10, 4.81))).toMatchObject({ year: 1957, month: 10, day: 4, h: 19 });
  });
});
