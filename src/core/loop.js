import * as THREE from 'three';
import { Eph } from '../engine/ephemeris.js';
import { live } from './live.js';
import {
  FL,
  focusPos,
  fp,
  prevFocus,
  setFocus,
  sv,
  tmp,
  tmp2,
  wantDir,
  wantDist
} from '../camera/camera.js';
import { CINE, UP, planetSub, smoother, updateCine } from '../camera/cinematic.js';
import { S } from './state.js';
import { clampJD, fmtDate, jdToPos } from './time.js';
import { $, reduceMotion } from './util.js';
import { updateCosmic } from '../cosmic/per-frame.js';
import { ccam, cosmic } from '../cosmic/scales.js';
import { RATES } from '../data/solar.js';
import { DUST, dustPos } from '../scene/dust.js';
import { bodies } from '../scene/planets.js';
import { V, camera, controls, renderer, scene } from '../scene/renderer.js';
import { sky } from '../scene/sky.js';
import { guideObjs, guides, helio, sunGroup, sunPos } from '../scene/sun.js';
import { voyager } from '../scene/voyager.js';
import { clearTrails, drawAllTrails, pushTrail, trails } from '../scene/wakes.js';
import { updateWorld } from '../scene/world.js';
import { toast, updateInfoLive } from '../ui/info-card.js';
import { heliLabels, labelEls, labelsLayer, subLabels } from '../ui/labels.js';
import { audio } from '../ui/sound.js';
import { setPlaying, tl } from '../ui/time-machine.js';
import { watchPerf } from '../ui/welcome.js';

/* ================= FRAME LOOP ================= */
export const clock = new THREE.Clock();

export let uiAcc = 0;

export let audioAcc = 0;

export let proj;

export let lastTable = 0;

export function frame() {
  requestAnimationFrame(frame);
  const rawDt = clock.getDelta(),
    realDt = Math.min(rawDt, 0.05);
  watchPerf(rawDt);

  // Advance time
  if (S.travel) {
    const tr = S.travel;
    tr.t = Math.min(1, tr.t + Math.min(rawDt, 0.25) / tr.dur);
    const e = tr.t < 0.5 ? 4 * tr.t ** 3 : 1 - Math.pow(-2 * tr.t + 2, 3) / 2;
    S.jd = tr.from + (tr.to - tr.from) * e;
    S.anchorJD = S.jd;
    if (tr.t >= 1) {
      S.jd = tr.to;
      S.anchorJD = S.jd;
      S.travel = null;
      $('#warp').classList.remove('on');
      clearTrails();
      tr.after && tr.after();
    }
  } else if (S.playing && !S.scrubbing) {
    const tgt = RATES[S.rate].d;
    S.rateCur = Math.exp(
      Math.log(S.rateCur) + (Math.log(tgt) - Math.log(S.rateCur)) * (1 - Math.exp(-realDt * 5))
    );
    const next = S.jd + S.dir * S.rateCur * realDt;
    if (next > Eph.MAX_JD || next < Eph.MIN_JD) {
      S.jd = clampJD(next);
      setPlaying(false);
      toast("Edge of JPL's fitted range, 3000 BC to AD 3000");
    } else S.jd = next;
  }

  if (S.level !== 'solar') {
    updateCosmic(realDt);
    renderer.render(cosmic, ccam);
    return;
  }
  updateWorld(realDt);
  scene.updateMatrixWorld();

  // Wakes sample on simulated time
  if (!S.travel && !S.scrubbing) {
    const minStep = Math.max(0.05, RATES[S.rate].d / 90);
    if (S.lastSample === null || Math.abs(S.jd - S.lastSample) >= minStep) {
      if (S.lastSample === null) clearTrails();
      S.lastSample = S.jd;
      for (const n in bodies) pushTrail(trails[n], bodies[n].mesh.getWorldPosition(tmp));
      pushTrail(trails.Sun, sunPos);
      if (live.voyVisible) pushTrail(trails['Voyager 1'], voyager.position);
      if (S.trails) drawAllTrails();
    }
  }

  // Floating origin for long galactic runs
  if (sunPos.length() > 4000) {
    const s = sunPos.clone();
    S.anchorJD = S.jd;
    sunPos.set(0, 0, 0);
    sunGroup.position.set(0, 0, 0);
    camera.position.sub(s);
    controls.target.sub(s);
    prevFocus.sub(s);
    voyager.position.sub(s);
    for (const k in trails) {
      const t = trails[k];
      for (let i = 0; i < t.count; i++) {
        t.ring[i * 3] -= s.x;
        t.ring[i * 3 + 1] -= s.y;
        t.ring[i * 3 + 2] -= s.z;
      }
    }
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] -= s.x;
      dustPos[i * 3 + 1] -= s.y;
      dustPos[i * 3 + 2] -= s.z;
    }
    if (CINE.on) {
      CINE.fromPos.sub(s);
      CINE.fromLook.sub(s);
      CINE.look.sub(s);
    }
    scene.updateMatrixWorld();
    drawAllTrails();
  }

  // Camera: cinematic director, or ride with the focused body
  live.idleT += realDt;
  controls.autoRotate =
    !CINE.on && !FL.on && S.level === 'solar' && live.idleT > 20 && !reduceMotion;
  controls.autoRotateSpeed = 0.35;
  if (CINE.on) {
    updateCine(realDt);
    focusPos(live.focus, prevFocus);
  } else {
    if (Math.abs(camera.fov - 50) > 0.01) {
      camera.fov += (50 - camera.fov) * Math.min(1, realDt * 3);
      camera.updateProjectionMatrix();
    }
    if (live.focus === 'Voyager 1' && !live.voyVisible) setFocus('Sun');
    focusPos(live.focus, fp);
    if (FL.on) {
      FL.t = Math.min(1, FL.t + rawDt / FL.dur);
      const e = smoother(FL.t),
        arc = Math.sin(Math.PI * e);
      controls.target.lerpVectors(FL.fT, fp, e);
      const D =
        Math.exp(Math.log(FL.fD) + (Math.log(FL.tD) - Math.log(FL.fD)) * e) * (1 + FL.hop * arc);
      tmp.copy(FL.fDir);
      if (FL.tDir) tmp.lerp(FL.tDir, e);
      tmp
        .normalize()
        .lerp(UP, 0.35 * arc * Math.min(1, FL.hop))
        .normalize();
      camera.position.copy(controls.target).addScaledVector(tmp, D);
      prevFocus.copy(fp);
      if (FL.t >= 1) FL.on = false;
    } else {
      tmp2.subVectors(fp, prevFocus);
      camera.position.add(tmp2);
      controls.target.add(tmp2);
      prevFocus.copy(fp);
    }
    if (live.transT < 1) {
      live.transT = Math.min(1, live.transT + realDt / 1.6);
      const k = live.transT >= 1 ? 1 : 1 - Math.exp(-realDt * 4.5);
      controls.target.lerp(fp, k);
      tmp.subVectors(camera.position, controls.target);
      const len = tmp.length();
      tmp.normalize();
      if (wantDir) tmp.lerp(wantDir, k).normalize();
      camera.position.copy(controls.target).addScaledVector(tmp, len + (wantDist - len) * k);
    }
    controls.update();
  }
  sky.position.copy(camera.position);

  // Labels
  if (S.labels && !labelsLayer.hidden && !CINE.on) {
    const W = innerWidth,
      H = innerHeight;
    const place = (el, pos, extra) => {
      const d = pos.distanceTo(camera.position);
      proj.copy(pos).project(camera);
      const vis =
        proj.z < 1 &&
        Math.abs(proj.x) < 1.05 &&
        Math.abs(proj.y) < 1.05 &&
        (extra === undefined || extra(d));
      el.hidden = !vis;
      if (vis)
        el.style.transform = `translate(${((proj.x * 0.5 + 0.5) * W + 10).toFixed(1)}px,${((-proj.y * 0.5 + 0.5) * H - 10).toFixed(1)}px)`;
    };
    for (const n in labelEls) {
      if (n === 'Voyager 1' && !live.voyVisible) {
        labelEls[n].el.hidden = true;
        continue;
      }
      focusPos(n, sv);
      place(labelEls[n].el, sv);
    }
    subLabels.forEach(s => {
      if (!s.show()) {
        s.el.hidden = true;
        return;
      }
      s.get(sv);
      place(s.el, sv, d => d < 120);
    });
    guideObjs.forEach(g => {
      if (!guides.visible) {
        g.el.hidden = true;
        return;
      }
      sv.copy(g.dir)
        .multiplyScalar(live.SC.f(60) * 1.04)
        .add(sunPos);
      place(g.el, sv);
    });
    heliLabels.forEach(h => {
      if (!helio.visible) {
        h.el.hidden = true;
        return;
      }
      sv.copy(h.dir).multiplyScalar(h.r()).add(sunPos);
      place(h.el, sv);
    });
  }

  renderer.render(scene, camera);

  // Clock, timeline, precision, info (about 8 times a second)
  uiAcc += realDt;
  if (uiAcc > 0.12) {
    uiAcc = 0;
    const f = fmtDate(S.jd),
      julian = S.jd < 2299160.5;
    $('#d-date').textContent = f.date;
    if (S.clean) $('#m-date').textContent = f.date;
    $('#d-time').innerHTML = `${f.time}${julian ? ' · <b>Julian calendar</b>' : ''}`;
    if (!S.scrubbing) tl.value = Math.round(jdToPos(S.jd) * 10000);
    $('#band-now').style.left = (jdToPos(Eph.nowJD()) * 100).toFixed(2) + '%';
    const t = Eph.tableFor(Eph.ttFromUT(S.jd));
    if (t !== lastTable) {
      lastTable = t;
      $('#d-prec').classList.toggle('t2', t === 2);
      $('#d-prec-t').textContent =
        t === 1 ? 'JPL TABLE 1 · PLANETS WITHIN 10′' : 'JPL TABLE 2 · PLANETS WITHIN 34′';
    }
    updateInfoLive();
    if (CINE.on) {
      if (CINE.shown) {
        const sh = CINE.sh;
        $('#l3-s').textContent = sh.sub ? sh.sub() : planetSub(sh.target);
      }
      $('#cine-date').textContent = `${f.date} · ${f.time}`;
      $('#cine-rate').textContent = '· ' + RATES[S.rate].t;
    }
  }
  audioAcc += realDt;
  if (audio && S.sound && audioAcc > 0.25) {
    audioAcc = 0;
    audio.lp.frequency.setTargetAtTime(
      300 + Math.log10(1 + RATES[S.rate].d * 86400) * 70,
      audio.ctx.currentTime,
      0.5
    );
  }
}

export function initLoop() {
  proj = V();
}
