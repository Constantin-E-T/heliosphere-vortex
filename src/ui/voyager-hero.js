import { Eph } from '../engine/ephemeris.js';
import { lightdayState } from '../engine/lightday.js';
import { $ } from '../core/util.js';
import { formatSignal, milestoneLine } from './hero-copy.js';

const distanceAu = jd => {
  const v = Eph.voyager(jd, { x: 0, y: 0, z: 0 });
  const e = Eph.earth(Eph.ttFromUT(jd), { x: 0, y: 0, z: 0 });
  return Math.hypot(v.x - e.x, v.y - e.y, v.z - e.z);
};

function update() {
  const jd = Eph.nowJD();
  const state = lightdayState(jd, distanceAu(jd));
  $('#hero-time').textContent = formatSignal(state.signalSeconds);
  $('#hero-milestone').textContent = milestoneLine(state);
}

export function initVoyagerHero() {
  update();
  const timer = setInterval(() => {
    if ($('#splash').classList.contains('gone')) clearInterval(timer);
    else update();
  }, 1000);
}
