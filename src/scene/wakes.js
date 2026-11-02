import * as THREE from 'three';
import { S } from '../core/state.js';
import { PLANETS } from '../data/solar.js';
import { scene } from './renderer.js';

/* ================= WAKES ================= */
export const MAXT = 2000;

export function makeTrail(color, gain) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(MAXT * 3), 3).setUsage(THREE.DynamicDrawUsage)
  );
  geo.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(MAXT * 3), 3).setUsage(THREE.DynamicDrawUsage)
  );
  geo.setDrawRange(0, 0);
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  line.frustumCulled = false;
  scene.add(line);
  return {
    line,
    geo,
    ring: new Float32Array(MAXT * 3),
    head: -1,
    count: 0,
    color: new THREE.Color(color),
    gain
  };
}

export const trails = {};

export function pushTrail(t, v) {
  t.head = (t.head + 1) % MAXT;
  t.ring[t.head * 3] = v.x;
  t.ring[t.head * 3 + 1] = v.y;
  t.ring[t.head * 3 + 2] = v.z;
  if (t.count < MAXT) t.count++;
}

export function drawTrail(t) {
  const n = Math.min(t.count, S.wake),
    pos = t.geo.attributes.position.array,
    col = t.geo.attributes.color.array;
  for (let i = 0; i < n; i++) {
    const k = (((t.head - i) % MAXT) + MAXT) % MAXT,
      f = Math.pow(1 - i / n, 1.7) * t.gain;
    pos[i * 3] = t.ring[k * 3];
    pos[i * 3 + 1] = t.ring[k * 3 + 1];
    pos[i * 3 + 2] = t.ring[k * 3 + 2];
    col[i * 3] = t.color.r * f;
    col[i * 3 + 1] = t.color.g * f;
    col[i * 3 + 2] = t.color.b * f;
  }
  t.geo.setDrawRange(0, n);
  t.geo.attributes.position.needsUpdate = true;
  t.geo.attributes.color.needsUpdate = true;
}

export const drawAllTrails = () => {
  for (const k in trails) drawTrail(trails[k]);
};

export function clearTrails() {
  for (const k in trails) {
    trails[k].count = 0;
    trails[k].head = -1;
    trails[k].geo.setDrawRange(0, 0);
  }
  S.lastSample = null;
}

export function initWakes() {
  PLANETS.forEach(p => (trails[p.name] = makeTrail(p.color, 0.85)));
  trails.Sun = makeTrail('#ffb547', 0.7);
  trails['Voyager 1'] = makeTrail('#ff6fa8', 0.9);
}
