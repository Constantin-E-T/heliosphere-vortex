import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { setFocus, setView, tmp } from '../camera/camera.js';
import { S } from '../core/state.js';
import { $ } from '../core/util.js';
import { dust, grid } from '../scene/dust.js';
import { bodies } from '../scene/planets.js';
import { camera, controls } from '../scene/renderer.js';
import { applyScale } from '../scene/scale.js';
import { guides, helio, sunPos } from '../scene/sun.js';
import { voyFuture, voyPast } from '../scene/voyager.js';
import { clearTrails, drawAllTrails, trails } from '../scene/wakes.js';
import { toast } from './info-card.js';
import { labelsLayer } from './labels.js';
import { CINE_ON, savePrefs } from './time-machine.js';

export let panel;

export let scrim;

export function setPanel(open) {
  panel.classList.toggle('closed', !open);
  scrim.classList.toggle('on', open);
  $('#b-panel').setAttribute('aria-pressed', String(open));
}

export function setFrame(f) {
  if (!CINE_ON()) setTimeout(savePrefs, 0);
  S.frame = f;
  document
    .querySelectorAll('[data-frame]')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.frame === f)));
  sunPos.set(0, 0, 0);
  S.anchorJD = S.jd;
  clearTrails();
  setFocus(live.focus, { dist: tmp.subVectors(camera.position, controls.target).length() });
}

export function setScale(s) {
  S.scale = s;
  savePrefs();
  document
    .querySelectorAll('[data-scale]')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scale === s)));
  applyScale();
  setFocus(live.focus);
}

export function bindRange(id, out, fmt, fn) {
  const el = $(id);
  const upd = () => {
    const v = parseFloat(el.value);
    $(out).textContent = fmt(v);
    fn(v);
  };
  el.addEventListener('input', upd);
  upd();
}

export const TRUE_DRIFT = (6 * 251.9 * 86400 * 365.25) / Eph.AU_KM; // 53.1 AU per year, linear scale

export function bindToggle(id, fn) {
  const el = $(id);
  el.addEventListener('change', () => fn(el.checked));
  fn(el.checked);
}

export function setLabels(on) {
  S.labels = on;
  labelsLayer.hidden = !on;
  $('#b-labels').setAttribute('aria-pressed', String(on));
  savePrefs();
}

export function initPanel() {
  /* ================= PANEL & TOGGLES ================= */
  panel = $('#panel');
  scrim = $('#scrim');
  setPanel(innerWidth > 1180);
  $('#b-panel').addEventListener('click', () => setPanel(panel.classList.contains('closed')));
  $('#p-close').addEventListener('click', () => setPanel(false));
  scrim.addEventListener('click', () => setPanel(false));
  document
    .querySelectorAll('.view')
    .forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  document
    .querySelectorAll('[data-frame]')
    .forEach(b => b.addEventListener('click', () => setFrame(b.dataset.frame)));
  document
    .querySelectorAll('[data-scale]')
    .forEach(b => b.addEventListener('click', () => setScale(b.dataset.scale)));
  bindRange(
    '#s-drift',
    '#o-drift',
    v => (v === 0 ? 'stopped' : v.toFixed(0)),
    v => {
      S.drift = v;
      S.anchorJD = S.jd;
      sunPos.set(0, 0, 0);
      clearTrails();
    }
  );
  bindRange(
    '#s-wake',
    '#o-wake',
    v => String(v),
    v => {
      S.wake = v;
      drawAllTrails();
    }
  );
  $('#b-true').addEventListener('click', () => {
    setScale('linear');
    setFrame('galactic');
    const s = $('#s-drift');
    s.max = String(Math.ceil(TRUE_DRIFT));
    s.value = TRUE_DRIFT;
    s.dispatchEvent(new Event('input'));
    $('#o-drift').textContent = '53.1 AU/yr (true)';
    toast('True ratio: the Sun moves 53 AU for every year');
  });
  bindToggle('#t-trails', on => {
    S.trails = on;
    for (const k in trails) trails[k].line.visible = on;
  });
  bindToggle('#t-orbits', on => {
    for (const n in bodies) bodies[n].orbit.visible = on;
  });
  bindToggle('#t-helio', on => {
    helio.visible = on;
  });
  bindToggle('#t-voypath', on => {
    voyPast.visible = voyFuture.visible = on;
  });
  bindToggle('#t-guides', on => {
    guides.visible = on;
  });
  bindToggle('#t-grid', on => {
    grid.visible = on;
  });
  bindToggle('#t-moons', on => {
    S.moons = on;
  });
  bindToggle('#t-dust', on => {
    dust.visible = on;
  });
  $('#b-labels').addEventListener('click', () => setLabels(!S.labels));
}
