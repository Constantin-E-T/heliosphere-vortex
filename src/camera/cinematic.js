import * as THREE from 'three';
import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { focusPos, setFocus, tmp, tmp2 } from './camera.js';
import { S } from '../core/state.js';
import { $, reduceMotion } from '../core/util.js';
import { PLANETS } from '../data/solar.js';
import { bodies, moonGeoAU } from '../scene/planets.js';
import { APEX, GROT, NGP, V, camera, controls } from '../scene/renderer.js';
import { guides, sunPos } from '../scene/sun.js';
import { voyAU } from '../scene/voyager.js';
import { dist3, fmtAU, fmtLT } from '../ui/info-card.js';
import { setFrame, setPanel } from '../ui/panel.js';
import { setDir, setPlaying, setPop, setRate } from '../ui/time-machine.js';

export let CINE;

export const smoother = x => x * x * x * (x * (x * 6 - 15) + 10);

export const sphv = (az, el, out) =>
  out.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));

export const UP = new THREE.Vector3(0, 1, 0);

export let cP;

export let cT;

export let cO;

export let cS;

export const len3 = p => Math.hypot(p.x, p.y, p.z);

export function bodyR(n) {
  return n === 'Sun' ? live.SC.sun : n === 'Voyager 1' ? 2 : bodies[n].data.r * live.SC.size;
}

export function moonReach(n) {
  const b = bodies[n];
  if (!b) return 0;
  let m = 0;
  for (const x of b.moons) m = Math.max(m, x.d);
  if (b.data.rings) m = Math.max(m, b.data.rings[1]);
  return m * live.SC.size;
}

export function planetSub(n) {
  const p = bodies[n].au,
    E = bodies.Earth.au;
  return `${fmtAU(len3(p))} from the Sun · ${fmtLT(dist3(p, E))} from Earth`;
}

export let SHOTS;

export let VOYAGER_SHOTS;

export function computeShot(sh, e, cp, lp) {
  focusPos(sh.target, cP);
  const R = bodyR(sh.target),
    D = live.SC.f(32);
  cS.subVectors(sunPos, cP);
  if (cS.lengthSq() < 1e-6) cS.copy(APEX);
  cS.normalize();
  const sAz = Math.atan2(cS.z, cS.x);
  switch (sh.type) {
    case 'establish':
      sphv(sAz + 0.9 + e * 0.65, 0.46 - 0.14 * e, cp)
        .multiplyScalar(D * (2.75 - 0.8 * e))
        .add(cP);
      lp.copy(cP);
      break;
    case 'orbit': {
      const d = Math.max(R * 5.5, moonReach(sh.target) * 1.25) * (1.18 - 0.22 * e);
      sphv(sAz + 0.55 + e * 1.1, 0.16 + 0.14 * e, cp)
        .multiplyScalar(d)
        .add(cP);
      lp.copy(cP);
      break;
    }
    case 'reveal': {
      const d = Math.max(R * (4.5 + 3.8 * e), moonReach(sh.target) * (1 + 0.5 * e));
      sphv(sAz + Math.PI - 0.32 - 0.95 * e, 0.05 + 0.2 * e, cp)
        .multiplyScalar(d)
        .add(cP);
      lp.copy(cP);
      break;
    }
    case 'flyby': {
      const k = 2 * e - 1,
        d = R * (4.4 + 3.4 * k * k);
      sphv(sAz - 1.3 * k, 0.1 + 0.06 * (1 - k * k), cp)
        .multiplyScalar(d)
        .add(cP);
      lp.copy(cP);
      break;
    }
    case 'voyager': {
      cO.subVectors(cP, sunPos).normalize();
      cT.crossVectors(cO, UP).normalize();
      cp.copy(cP)
        .addScaledVector(cO, 9 + 34 * e)
        .addScaledVector(UP, 3 + 9 * e)
        .addScaledVector(cT, 5 + 7 * e);
      lp.copy(cP).lerp(sunPos, 0.5 * e);
      break;
    }
    case 'galactic': {
      cO.copy(APEX)
        .multiplyScalar(-0.9)
        .addScaledVector(NGP, 0.55)
        .addScaledVector(GROT, 0.3)
        .normalize();
      cp.copy(cP).addScaledVector(cO, D * (1.3 + 3.1 * e));
      lp.copy(cP).addScaledVector(APEX, D * 0.7 * e);
      break;
    }
  }
}

export function nextShot(forced) {
  const list = CINE.list;
  if (!forced) {
    if (list !== SHOTS && CINE.i === list.length - 1) {
      stopCine();
      return;
    }
    do {
      CINE.i = (CINE.i + 1) % list.length;
    } while (list[CINE.i].target === 'Voyager 1' && !live.voyVisible);
  }
  const sh = (CINE.sh = forced || list[CINE.i]);
  CINE.t = 0;
  CINE.shown = false;
  $('#l3').classList.remove('show');
  setRate(sh.rate);
  live.focus = sh.target;
  CINE.fromPos.copy(camera.position);
  CINE.fromLook.copy(CINE.look);
  CINE.blend = 0;
  computeShot(sh, 0, CINE.cp, CINE.lp);
  // Long moves get a dip to black instead of a fly-through
  const gap = camera.position.distanceTo(CINE.cp);
  CINE.blendDur = Math.min(5.5, 2.6 + Math.log10(1 + gap / 20) * 1.3);
  CINE.hop = gap * 0.28;
  if (reduceMotion && gap > live.SC.f(32) * 1.1) {
    CINE.cut = 0.5;
    $('#cine-fade').classList.add('on');
  }
  $('#cine-n').textContent =
    `${String(CINE.i + 1).padStart(2, '0')} / ${String(CINE.list.length).padStart(2, '0')}`;
}

export function fillL3(sh) {
  const n = sh.target,
    d = n === 'Sun' || n === 'Voyager 1' ? null : bodies[n].data;
  $('#l3-eb').textContent =
    sh.eb || (d ? `Planet ${PLANETS.indexOf(d) + 1} · ${d.tilt} tilt · ${d.day} day` : n);
  $('#l3-t').textContent = sh.title || n;
  $('#l3-s').textContent = sh.sub ? sh.sub() : planetSub(n);
}

export function updateCine(dt) {
  const sh = CINE.sh;
  if (CINE.cut > 0) {
    CINE.cut -= dt;
    if (CINE.cut <= 0) {
      CINE.blend = 1;
      $('#cine-fade').classList.remove('on');
    }
  } else if (!CINE.paused) CINE.t += dt;
  computeShot(sh, smoother(Math.min(1, CINE.t / sh.dur)), CINE.cp, CINE.lp);
  if (CINE.cut > 0) {
    /* hold under black */
  } else if (CINE.blend < 1) {
    CINE.blend = Math.min(1, CINE.blend + dt / (CINE.blendDur || 2.6));
    const b = smoother(CINE.blend);
    camera.position
      .lerpVectors(CINE.fromPos, CINE.cp, b)
      .addScaledVector(UP, (CINE.hop || 0) * Math.sin(Math.PI * b));
    CINE.look.lerpVectors(CINE.fromLook, CINE.lp, smoother(Math.min(1, CINE.blend * 1.25)));
  } else {
    camera.position.copy(CINE.cp);
    CINE.look.copy(CINE.lp);
  }
  // Viewer's own look-around, layered on top of the director's camera; eases back after a few idle seconds
  const U = CINE.user;
  if (!U.dragging) {
    U.idle += dt;
    if (U.idle > 2.5) {
      const k = Math.exp(-dt * 0.9);
      U.yaw *= k;
      U.pitch *= k;
      U.zoom = Math.exp(Math.log(U.zoom) * k);
    }
  }
  if (Math.abs(U.yaw) > 1e-4 || Math.abs(U.pitch) > 1e-4 || Math.abs(U.zoom - 1) > 1e-4) {
    tmp.subVectors(camera.position, CINE.look).applyAxisAngle(UP, U.yaw);
    tmp2.crossVectors(tmp, UP).normalize();
    tmp.applyAxisAngle(tmp2, U.pitch).multiplyScalar(U.zoom);
    camera.position.copy(CINE.look).add(tmp);
  }
  camera.lookAt(CINE.look);
  const f = camera.fov + (sh.fov - camera.fov) * Math.min(1, dt * 1.2);
  if (Math.abs(f - camera.fov) > 0.001) {
    camera.fov = f;
    camera.updateProjectionMatrix();
  }
  if (!CINE.shown && CINE.t > 1.1) {
    CINE.shown = true;
    fillL3(sh);
    $('#l3').classList.add('show');
  }
  if (CINE.shown && CINE.t > sh.dur - 1.4) $('#l3').classList.remove('show');
  $('#cine-prog').style.transform = `scaleX(${Math.min(1, CINE.t / sh.dur).toFixed(4)})`;
  if (CINE.t >= sh.dur) nextShot();
}

/** @param {typeof SHOTS} [list] Shots to play. The full tour loops; any other list ends on its last shot. */
export function startCine(list = SHOTS) {
  if (CINE.on) return;
  CINE.list = list;
  CINE.saved = {
    rate: S.rate,
    dir: S.dir,
    frame: S.frame,
    playing: S.playing,
    guides: guides.visible
  };
  guides.visible = false;
  CINE.on = true;
  document.body.classList.add('cine-on');
  const el = $('#cine');
  el.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  setPanel(false);
  setPop(false);
  controls.enabled = false;
  controls.autoRotate = false;
  CINE.look.copy(controls.target);
  if (S.frame !== 'galactic') setFrame('galactic');
  if (S.dir < 0) setDir(1);
  setPlaying(true);
  CINE.paused = false;
  setCinePauseIcon();
  Object.assign(CINE.user, { yaw: 0, pitch: 0, zoom: 1, idle: 9 });
  CINE.i = -1;
  nextShot();
  CINE.cut = 0;
  $('#cine-fade').classList.remove('on');
}

export function setCinePauseIcon() {
  $('#i-cine-pause').innerHTML = CINE.paused
    ? '<path d="M4 2.5v11l9-5.5z"/>'
    : '<rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/>';
  $('#cine-pause').setAttribute('aria-label', CINE.paused ? 'Resume tour' : 'Pause tour');
}

export function cinePause() {
  CINE.paused = !CINE.paused;
  setPlaying(!CINE.paused);
  setCinePauseIcon();
}

export function cineStep(dir) {
  if (dir < 0) CINE.i = (CINE.i - 2 + CINE.list.length * 2) % CINE.list.length;
  nextShot();
}

// Tapping a body during the tour: the director cuts to it, then carries on with the tour from there
export function cineVisit(name) {
  CINE.list = SHOTS; // tapping a body during a short film continues with the full tour
  const i = SHOTS.findIndex(x => x.target === name && x.type !== 'galactic');
  if (i >= 0) {
    CINE.i = i;
    nextShot(SHOTS[i]);
  } else
    nextShot({
      type: name === 'Voyager 1' ? 'voyager' : 'orbit',
      target: name,
      dur: 12,
      rate: 3,
      fov: 38
    });
}

export function stopCine() {
  if (!CINE.on) return;
  CINE.on = false;
  document.body.classList.remove('cine-on');
  const el = $('#cine');
  el.classList.remove('on');
  $('#l3').classList.remove('show');
  $('#cine-fade').classList.remove('on');
  setTimeout(() => {
    if (!CINE.on) el.hidden = true;
  }, 1000);
  controls.enabled = true;
  controls.target.copy(CINE.look);
  const sv = CINE.saved;
  guides.visible = sv.guides;
  setRate(sv.rate);
  if (sv.dir !== S.dir) setDir(sv.dir);
  if (sv.frame !== S.frame) setFrame(sv.frame);
  setPlaying(sv.playing);
  const tgt = CINE.sh.target;
  setFocus(live.voyVisible || tgt !== 'Voyager 1' ? tgt : 'Sun', {
    dist: camera.position.distanceTo(controls.target)
  });
  document.querySelectorAll('.view').forEach(b => b.setAttribute('aria-pressed', 'false'));
}

export function initCinematic() {
  /* ================= CINEMATIC DIRECTOR ================= */
  CINE = {
    user: { yaw: 0, pitch: 0, zoom: 1, dragging: false, idle: 9, x: 0, y: 0, sx: 0, sy: 0, t0: 0 },
    paused: false,
    sh: null,
    on: false,
    i: -1,
    t: 0,
    blend: 1,
    cut: 0,
    fromPos: V(),
    fromLook: V(),
    look: V(),
    cp: V(),
    lp: V(),
    saved: null,
    shown: false
  };
  cP = V();
  cT = V();
  cO = V();
  cS = V();
  SHOTS = [
    {
      type: 'establish',
      target: 'Sun',
      dur: 13,
      rate: 5,
      fov: 46,
      eb: 'Positions from NASA JPL',
      title: 'The Solar System',
      sub: () => 'Eight planets, each where JPL places it on this date'
    },
    {
      type: 'orbit',
      target: 'Earth',
      dur: 11,
      rate: 3,
      fov: 36,
      sub: () =>
        `${fmtAU(len3(bodies.Earth.au))} from the Sun · the Moon ${Math.round(len3(moonGeoAU) * Eph.AU_KM).toLocaleString('en-GB')} km away`
    },
    { type: 'reveal', target: 'Venus', dur: 10, rate: 3, fov: 34 },
    { type: 'flyby', target: 'Mars', dur: 9, rate: 3, fov: 40 },
    {
      type: 'orbit',
      target: 'Jupiter',
      dur: 12,
      rate: 3,
      fov: 38,
      sub: () => `${planetSub('Jupiter')} · Galilean moons at JPL phases`
    },
    { type: 'reveal', target: 'Saturn', dur: 11, rate: 3, fov: 36 },
    {
      type: 'flyby',
      target: 'Uranus',
      dur: 9,
      rate: 3,
      fov: 40,
      sub: () => `${planetSub('Uranus')} · spinning on its side`
    },
    { type: 'orbit', target: 'Neptune', dur: 10, rate: 3, fov: 38 },
    {
      type: 'voyager',
      target: 'Voyager 1',
      dur: 13,
      rate: 4,
      fov: 42,
      eb: 'Looking home',
      sub: () =>
        `${fmtAU(len3(voyAU))} from the Sun · its signal takes ${fmtLT(dist3(voyAU, bodies.Earth.au))}`
    },
    {
      type: 'galactic',
      target: 'Sun',
      dur: 16,
      rate: 7,
      fov: 52,
      eb: 'Galactic frame',
      title: 'Through the Milky Way',
      sub: () => 'The Sun carries every planet at 251.9 km/s, 60° from their orbital plane'
    }
  ];
  const voyagerShot = SHOTS.find(s => s.target === 'Voyager 1');
  VOYAGER_SHOTS = [
    voyagerShot,
    {
      ...voyagerShot,
      dur: 12,
      rate: 2,
      eb: 'In interstellar space since 2012',
      sub: () => 'Still inside the Milky Way. This view was built by FieldOps.'
    }
  ];
  $('#cine-prev').addEventListener('click', () => cineStep(-1));
  $('#cine-next').addEventListener('click', () => cineStep(1));
  $('#cine-pause').addEventListener('click', cinePause);
  $('#cine-exit').addEventListener('click', stopCine);
  $('#b-cine').addEventListener('click', startCine);
}
