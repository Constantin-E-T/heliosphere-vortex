import { describe, expect, it } from 'vitest';
import { LIGHT_DAY_JD, lightdayState } from '../../src/engine/lightday.js';

const jdOf = iso => Date.parse(iso) / 86400000 + 2440587.5;

describe('one light-day milestone', () => {
  it('falls at 18 Nov 2026 10:16 UTC, matching Horizons', () => {
    expect(Math.abs(LIGHT_DAY_JD - jdOf('2026-11-18T10:16:28Z')) * 1440).toBeLessThan(1);
  });

  it('counts down before the milestone', () => {
    const s = lightdayState(jdOf('2026-11-18T09:16:28Z'));
    expect(s.phase).toBe('before');
    expect(s.deltaSeconds).toBeCloseTo(3600, -2);
    expect(s.lightHours).toBeLessThan(24);
    expect(s.signalSeconds).toBeCloseTo(s.lightHours * 3600, 3);
  });

  it('counts up after it and never goes negative', () => {
    const s = lightdayState(jdOf('2026-12-18T10:16:28Z'));
    expect(s.phase).toBe('after');
    expect(s.deltaSeconds).toBeGreaterThan(0);
  });

  it('reads 24.00 light-hours at the moment itself', () => {
    expect(lightdayState(LIGHT_DAY_JD).lightHours).toBeCloseTo(24, 3);
  });

  it('uses the supplied distance outside the Horizons table', () => {
    const s = lightdayState(jdOf('2030-01-01T00:00:00Z'), 180);
    expect(s.phase).toBe('after');
    expect(s.lightHours).toBeCloseTo((180 * 149597870.7) / 299792.458 / 3600, 6);
  });

  it('returns null with no table entry and no fallback distance', () => {
    expect(lightdayState(jdOf('2030-01-01T00:00:00Z'))).toBeNull();
  });
});
