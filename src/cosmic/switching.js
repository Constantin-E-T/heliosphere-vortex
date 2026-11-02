import { live } from '../core/live.js';
import { setFocus } from '../camera/camera.js';
import { CINE, stopCine } from '../camera/cinematic.js';
import { S } from '../core/state.js';
import { $, reduceMotion } from '../core/util.js';
import { FLY, focusCosmic } from './flight.js';
import { LEVELS, armLabels, buildCosmicChips, cosLabels } from './levels.js';
import { ccam } from './scales.js';
import { V, camera, controls } from '../scene/renderer.js';
import { guideObjs } from '../scene/sun.js';
import { renderInfo } from '../ui/info-card.js';
import { heliLabels, labelEls, subLabels } from '../ui/labels.js';
import { setPanel } from '../ui/panel.js';

export let solarCam;

export const LEVEL_HASH = {
  solar: 'solar-system',
  mw: 'milky-way',
  lg: 'local-group',
  lu: 'local-universe'
};

export function setLevel(lv) {
  try {
    history.replaceState(null, '', '#' + LEVEL_HASH[lv]);
  } catch (e) {}
  if (lv === S.level) {
    if (lv !== 'solar') focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir);
    return;
  }
  const from = S.level;
  document
    .querySelectorAll('[data-level]')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === lv)));
  if (CINE.on) stopCine();
  if (from === 'solar' || lv === 'solar') {
    $('#fade').classList.add('on');
    setTimeout(
      () => {
        if (lv === 'solar') {
          // back home
          S.level = 'solar';
          controls.object = camera;
          controls.minDistance = solarCam.min;
          controls.maxDistance = solarCam.max;
          camera.position.copy(solarCam.pos);
          controls.target.copy(solarCam.target);
          FLY.on = false;
          $('#hud').classList.remove('cosmic');
          setCosmicLabels(false);
          renderInfo();
          setFocus(live.focus, { dist: camera.position.distanceTo(controls.target) });
        } else {
          solarCam.pos.copy(camera.position);
          solarCam.target.copy(controls.target);
          S.level = lv;
          controls.object = ccam;
          controls.minDistance = 0.0001;
          controls.maxDistance = 700000;
          controls.target.set(0, 0, 0);
          ccam.position.copy(LEVELS[lv].dir).normalize().multiplyScalar(0.004); // start at the Sun
          $('#hud').classList.add('cosmic');
          setCosmicLabels(true);
          setPanel(false);
          buildCosmicChips(lv);
          focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir);
          FLY.dur = reduceMotion ? 0.01 : 4.2;
        }
        setTimeout(() => $('#fade').classList.remove('on'), 60);
      },
      reduceMotion ? 0 : 420
    );
  } else {
    S.level = lv;
    buildCosmicChips(lv);
    focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir);
  }
}

export function setCosmicLabels(on) {
  for (const k in labelEls) labelEls[k].el.hidden = on;
  subLabels.forEach(s => (s.el.hidden = on));
  guideObjs.forEach(g => (g.el.hidden = on));
  heliLabels.forEach(h => (h.el.hidden = on));
  if (!on) {
    cosLabels.forEach(L => (L.el.hidden = true));
    armLabels.forEach(a => (a.el.hidden = true));
  }
}

export function initSwitching() {
  /* ---- Switching scales ---- */
  solarCam = { pos: V(), target: V(), min: 2, max: 6000 };
  document
    .querySelectorAll('[data-level]')
    .forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));
  $('#b-gspin').addEventListener('click', e => {
    live.gSpin = !live.gSpin;
    e.currentTarget.setAttribute('aria-pressed', String(live.gSpin));
    e.currentTarget.textContent = live.gSpin ? 'Galaxies turning' : 'Galaxies still';
  });
}
