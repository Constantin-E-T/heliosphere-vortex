import * as THREE from 'three';
import { live } from '../core/live.js';
import { setFocus } from '../camera/camera.js';
import { CINE, cinePause, cineVisit } from '../camera/cinematic.js';
import { S } from '../core/state.js';
import { ccam } from '../cosmic/scales.js';
import { pickables } from '../scene/planets.js';
import { camera, renderer } from '../scene/renderer.js';

/* ================= PICKING ================= */
export const ray = new THREE.Raycaster();

export const ndc = new THREE.Vector2();

export let down = null;

export let hoverQueued = false;

export let lastMove = null;

export function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(
    pickables.filter(o => o.parent && (o.userData.body !== 'Voyager 1' || live.voyVisible)),
    false
  )[0];
  return h ? h.object.userData.body : null;
}

export function initPicking() {
  renderer.domElement.addEventListener('pointerdown', e => {
    if (CINE.on) {
      const U = CINE.user;
      U.dragging = true;
      U.idle = 0;
      U.x = U.sx = e.clientX;
      U.y = U.sy = e.clientY;
      U.t0 = performance.now();
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch (er) {}
      down = null;
      return;
    }
    live.idleT = 0;
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  addEventListener('pointermove', e => {
    if (!CINE.on || !CINE.user.dragging) return;
    const U = CINE.user;
    U.yaw -= (e.clientX - U.x) * 0.005;
    U.pitch = Math.max(-1.1, Math.min(1.1, U.pitch - (e.clientY - U.y) * 0.004));
    U.x = e.clientX;
    U.y = e.clientY;
    U.idle = 0;
  });
  renderer.domElement.addEventListener(
    'wheel',
    e => {
      if (!CINE.on) {
        live.idleT = 0;
        return;
      }
      e.preventDefault();
      const U = CINE.user;
      U.zoom = Math.max(0.3, Math.min(3.5, U.zoom * Math.exp(e.deltaY * 0.0012)));
      U.idle = 0;
    },
    { passive: false }
  );
  renderer.domElement.addEventListener('pointerup', e => {
    if (CINE.on) {
      const U = CINE.user;
      U.dragging = false;
      if (Math.hypot(e.clientX - U.sx, e.clientY - U.sy) < 6 && performance.now() - U.t0 < 450) {
        const b = pick(e.clientX, e.clientY);
        if (b) cineVisit(b);
        else cinePause();
      }
      return;
    }
    if (!down || S.level !== 'solar') {
      down = null;
      return;
    }
    if (
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 &&
      performance.now() - down.t < 450
    ) {
      const b = pick(e.clientX, e.clientY);
      if (b) setFocus(b);
    }
    down = null;
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || S.level !== 'solar') return;
    lastMove = e;
    if (!hoverQueued) {
      hoverQueued = true;
      requestAnimationFrame(() => {
        hoverQueued = false;
        renderer.domElement.style.cursor = pick(lastMove.clientX, lastMove.clientY)
          ? 'pointer'
          : '';
      });
    }
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (typeof ccam !== 'undefined') {
      ccam.aspect = camera.aspect;
      ccam.updateProjectionMatrix();
    }
    renderer.setSize(innerWidth, innerHeight);
  });
}
