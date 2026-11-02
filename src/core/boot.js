import { live } from './live.js';
import { VIEWS, setFocus } from '../camera/camera.js';
import { S } from './state.js';
import { RATES } from '../data/solar.js';
import { camera } from '../scene/renderer.js';
import { applyScale } from '../scene/scale.js';
import { setClean } from '../ui/clean-view.js';
import { setLabels } from '../ui/panel.js';
import { renderRate, setPlaying } from '../ui/time-machine.js';

export let prefs;

export function initBoot() {
  /* ================= START ================= */
  prefs = {};
  try {
    prefs = JSON.parse(localStorage.getItem('hv-prefs') || '{}') || {};
  } catch (e) {}
  if (prefs.scale === 'linear') {
    S.scale = 'linear';
    document
      .querySelectorAll('[data-scale]')
      .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scale === 'linear')));
  }
  if (prefs.frame === 'helio') {
    S.frame = 'helio';
    document
      .querySelectorAll('[data-frame]')
      .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.frame === 'helio')));
  }
  if (Number.isInteger(prefs.rate) && prefs.rate >= 0 && prefs.rate < RATES.length)
    S.rate = prefs.rate;
  S.rateCur = RATES[S.rate].d;
  applyScale();
  setPlaying(true);
  renderRate();
  if (prefs.labels === false) setLabels(false);
  try {
    if (localStorage.getItem('hv-clean') === '1') setClean(true);
  } catch (e) {}
  setFocus('Sun', VIEWS.overview());
  camera.position
    .copy(VIEWS.overview().dir)
    .normalize()
    .multiplyScalar(live.SC.f(32) * 2.6);
}
