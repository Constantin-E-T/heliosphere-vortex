import { live } from '../core/live.js';
import { reduceMotion } from '../core/util.js';
import { COS_BY } from './catalogue.js';
import { renderCosInfo } from './info.js';
import { ccam } from './scales.js';
import { V, controls } from '../scene/renderer.js';

export let FLY;

export function flyTo(target, dist, dir, dur) {
  FLY.fT.copy(controls.target);
  FLY.tT.copy(target);
  FLY.fD = Math.max(1e-4, ccam.position.distanceTo(controls.target));
  FLY.tD = dist;
  FLY.fDir.subVectors(ccam.position, controls.target).normalize();
  FLY.tDir.copy(dir ? dir.clone().normalize() : FLY.fDir);
  FLY.t = 0;
  FLY.dur = reduceMotion
    ? 0.01
    : dur || Math.min(4.2, 1.6 + Math.abs(Math.log10(FLY.tD / FLY.fD)) * 0.6);
  FLY.on = true;
}

export function focusCosmic(id, dir) {
  const o = COS_BY[id];
  live.cosFocus = id;
  renderCosInfo();
  flyTo(o.pos, o.view, dir || o.viewDir);
}

export function initFlight() {
  /* ---- Flight: log-distance zoom ---- */
  FLY = { on: false, t: 0, dur: 2.8, fT: V(), tT: V(), fD: 1, tD: 1, fDir: V(), tDir: V() };
  controls.addEventListener('start', () => {
    FLY.on = false;
  });
}
