import range from '../data/lightday-range.json';

const AU_KM = 149597870.7;
const C_KM_S = 299792.458;
const LIGHT_DAY_KM = C_KM_S * 86400;

const rangeKm = jd => {
  const x = (jd - range.startJd) / range.stepDays;
  const i = Math.floor(x);
  if (i < 0 || i >= range.km.length - 1) return null;
  return range.km[i] + (range.km[i + 1] - range.km[i]) * (x - i);
};

const findCrossing = () => {
  const i = range.km.findIndex(km => km >= LIGHT_DAY_KM);
  const k = (LIGHT_DAY_KM - range.km[i - 1]) / (range.km[i] - range.km[i - 1]);
  return range.startJd + (i - 1 + k) * range.stepDays;
};

/** Julian date (UTC) when Voyager 1 first reaches one light-day from Earth. */
export const LIGHT_DAY_JD = findCrossing();

/**
 * Voyager's distance and the milestone clock at a moment.
 * @param {number} nowJd Julian date, UTC.
 * @param {number} [fallbackAu] Distance to use outside the Horizons table, in AU.
 * @returns {{phase: 'before'|'after', lightHours: number, signalSeconds: number, deltaSeconds: number}|null}
 */
export function lightdayState(nowJd, fallbackAu) {
  const km = rangeKm(nowJd) ?? (fallbackAu === undefined ? null : fallbackAu * AU_KM);
  if (km === null) return null;
  const signalSeconds = km / C_KM_S;
  return {
    phase: nowJd < LIGHT_DAY_JD ? 'before' : 'after',
    lightHours: signalSeconds / 3600,
    signalSeconds,
    deltaSeconds: Math.abs(LIGHT_DAY_JD - nowJd) * 86400
  };
}
