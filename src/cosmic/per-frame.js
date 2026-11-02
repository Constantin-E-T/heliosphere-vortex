import { live } from '../core/live.js';
import { sv, tmp } from '../camera/camera.js';
import { smoother } from '../camera/cinematic.js';
import { proj } from '../core/loop.js';
import { S } from '../core/state.js';
import { $, DEG } from '../core/util.js';
import { COS, COS_BY, lanShell } from './catalogue.js';
import { updateDetail } from './cluster-detail.js';
import { FLY } from './flight.js';
import { fmtLy } from './info.js';
import { TIER_RANGE, armLabels, cosLabels } from './levels.js';
import { mwPivot, rotMW, sgrA, spinners, youMark } from './milky-way.js';
import { ensurePhoto } from './photos.js';
import { V0, billboards, updateStarScale } from './render.js';
import { KPC_LY, ccam } from './scales.js';
import { controls } from '../scene/renderer.js';

/* ---- Per-frame ---- */
export let cosUi = 0;

export function updateCosmic(realDt) {
  controls.autoRotate = false;
  if (FLY.on) {
    FLY.t = Math.min(1, FLY.t + realDt / FLY.dur);
    const e = smoother(FLY.t);
    controls.target.lerpVectors(FLY.fT, FLY.tT, e);
    const D = Math.exp(Math.log(FLY.fD) + (Math.log(FLY.tD) - Math.log(FLY.fD)) * e);
    tmp.copy(FLY.fDir).lerp(FLY.tDir, e).normalize();
    ccam.position.copy(controls.target).addScaledVector(tmp, D);
    if (FLY.t >= 1) FLY.on = false;
  }
  controls.update();
  const D = ccam.position.distanceTo(controls.target);
  ccam.near = Math.max(1e-5, D / 2000);
  ccam.far = Math.max(D * 60, 2000);
  ccam.updateProjectionMatrix();
  // Fade detail in and out with zoom
  lanShell.visible = D > 30000;
  lanShell.material.uniforms.uStr.value = Math.min(0.22, (D - 30000) / 300000);
  billboards.forEach(b => {
    b.quaternion.copy(ccam.quaternion);
    b.material.uniforms.uTime.value += realDt;
  });
  updateStarScale();
  updateDetail();
  COS.forEach(o => {
    if (o.photo && o.card) {
      if (
        !o.card.userData.gas.material.uniforms.uMap.value &&
        ccam.position.distanceTo(o.pos) < o.size * 600
      )
        ensurePhoto(o, o.tel);
      const ud = o.card.userData;
      if (o.card.visible && ud.gas.material.uniforms.uOpacity.value < 1) {
        const v = Math.min(1, ud.gas.material.uniforms.uOpacity.value + realDt * 0.8);
        ud.gas.material.uniforms.uOpacity.value = ud.stars.material.uniforms.uOpacity.value = v;
      }
    }
  });
  // Galaxy rotation, sped up about 30 trillion times. The Milky Way only turns when seen from outside, and settles back to today's orientation as you fly in.
  const w = 0.03 * realDt;
  if (live.gSpin) spinners.forEach(o => o.spin.rotateZ(-w * Math.min(2, 8 / o.r)));
  if (live.gSpin && D > 120) live.mwAngle -= w;
  else if (D < 70) live.mwAngle *= 1 - Math.min(1, realDt * 1.2);
  mwPivot.rotation.y = live.mwAngle;
  rotMW(V0, youMark.position);
  COS_BY.sun.pos.copy(youMark.position);
  const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.15;
  youMark.scale.setScalar(D * 0.018 * pulse);
  youMark.material.opacity = D > 5000 || D < 0.05 ? 0 : 0.9;
  sgrA.scale.setScalar(Math.max(0.05, D * 0.006));
  // Labels
  if (S.labels) {
    const W = innerWidth,
      H = innerHeight;
    const place = (el, pos, show) => {
      if (!show) {
        el.hidden = true;
        return;
      }
      proj.copy(pos).project(ccam);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      el.hidden = !vis;
      if (vis)
        el.style.transform = `translate(${((proj.x * 0.5 + 0.5) * W + 10).toFixed(1)}px,${((-proj.y * 0.5 + 0.5) * H - 10).toFixed(1)}px)`;
    };
    cosLabels.forEach(L => {
      const r = TIER_RANGE[L.o.tier],
        far = ccam.position.distanceTo(L.o.pos) > Math.max(D * 60, 40);
      place(
        L.el,
        L.o.labelPos || L.o.pos,
        L.o.id === live.cosFocus || (D >= r[0] && D <= r[1] && !far)
      );
    });
    armLabels.forEach(a => place(a.el, rotMW(a.pos, sv), D > 8 && D < 160));
  }
  cosUi += realDt;
  if (cosUi > 0.15) {
    cosUi = 0;
    const w = 2 * D * Math.tan((ccam.fov * DEG) / 2) * ccam.aspect;
    $('#cos-scale').textContent = `View ≈ ${fmtLy(w * KPC_LY)} across`;
  }
}
