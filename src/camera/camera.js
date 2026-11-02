import * as THREE from 'three';
import { live } from '../core/live.js';
import { startCine } from './cinematic.js';
import { S } from '../core/state.js';
import { reduceMotion } from '../core/util.js';
import { ORDER } from '../data/solar.js';
import { bodies, moonMesh } from '../scene/planets.js';
import { APEX, GC, NGP, V, camera, controls, scene } from '../scene/renderer.js';
import { sunPos } from '../scene/sun.js';
import { voyager } from '../scene/voyager.js';
import { renderInfo } from '../ui/info-card.js';
import { labelEls } from '../ui/labels.js';

export let wantDist = 0;

export let wantDir = null;

export let tourT = 0;

export let prevFocus;

export let fp;

export let tmp;

export let tmp2;

export let sv;

export function focusPos(name, out) {
  if (name === 'Sun') return out.copy(sunPos);
  if (name === 'Voyager 1') return out.copy(voyager.position);
  if (name === 'Moon') return moonMesh.getWorldPosition(out);
  return bodies[name].mesh.getWorldPosition(out);
}

export function defaultDist(name) {
  if (name === 'Sun') return live.SC.f(32) * 2.6;
  if (name === 'Voyager 1') return 45;
  return (bodies[name].data.r * 7 + 14) * Math.max(live.SC.size, 0.5);
}

export function setFocus(name, opts = {}) {
  if (!ORDER.includes(name)) return;
  live.focus = name;
  scene.updateMatrixWorld();
  focusPos(name, prevFocus);
  wantDist = opts.dist ?? defaultDist(name);
  wantDir = opts.dir ? opts.dir.clone().normalize() : null;
  live.transT = 1;
  // Arc flight: ease out, rise and pull back mid-way so the move reads as travel, then settle in
  FL.fT.copy(controls.target);
  FL.fD = Math.max(0.5, camera.position.distanceTo(controls.target));
  FL.fDir.subVectors(camera.position, controls.target).normalize();
  FL.tD = wantDist;
  FL.tDir = wantDir;
  const sep = prevFocus.distanceTo(controls.target);
  FL.hop = Math.min(2.2, (sep / (FL.fD + FL.tD)) * 0.45);
  FL.dur = reduceMotion
    ? 0.01
    : Math.min(3.8, 1.2 + Math.log10(1 + sep / Math.max(1, Math.min(FL.fD, FL.tD))) * 0.95);
  FL.t = 0;
  FL.on = true;
  document
    .querySelectorAll('.chip')
    .forEach(c => c.setAttribute('aria-pressed', String(c.dataset.body === name)));
  for (const k in labelEls) labelEls[k].el.classList.toggle('on', k === name);
  const chip = document.querySelector(`.chip[data-body="${CSS.escape(name)}"]`);
  chip &&
    chip.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  renderInfo();
}

export const FL = {
  on: false,
  t: 0,
  dur: 1,
  fT: new THREE.Vector3(),
  fD: 1,
  fDir: new THREE.Vector3(),
  tD: 1,
  tDir: null,
  hop: 0
};

export let VIEWS;

export let VIEW_ORDER;

export function setView(v) {
  if (v === 'cine') {
    startCine();
    return;
  }
  S.view = v;
  S.tour = v === 'tour';
  controls.autoRotate = S.tour && !reduceMotion;
  tourT = 0;
  document
    .querySelectorAll('.view')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  if (v) setFocus('Sun', VIEWS[v]());
}

export function initCamera() {
  /* ================= CAMERA ================= */
  live.idleT = 0;
  live.focus = 'Sun';
  live.transT = 1;
  prevFocus = V();
  fp = V();
  tmp = V();
  tmp2 = V();
  sv = V();
  controls.addEventListener('start', () => {
    live.transT = 1;
    FL.on = false;
    if (S.tour) setView(null);
  });
  VIEWS = {
    overview: () => ({ dir: new THREE.Vector3(-0.62, 0.55, 0.58), dist: live.SC.f(32) * 2.6 }),
    top: () => ({ dir: new THREE.Vector3(0, 1, 0.002), dist: live.SC.f(32) * 2.7 }),
    edge: () => ({ dir: new THREE.Vector3(0.02, 0.05, 1), dist: live.SC.f(32) * 2.6 }),
    chase: () => ({
      dir: APEX.clone().negate().add(NGP.clone().multiplyScalar(0.35)),
      dist: live.SC.f(32) * 2.2
    }),
    galaxy: () => ({
      dir: NGP.clone().multiplyScalar(0.25).add(GC.clone().negate()),
      dist: live.SC.f(32) * 3.2
    }),
    cine: () => ({})
  };
  VIEW_ORDER = Object.keys(VIEWS);
}
