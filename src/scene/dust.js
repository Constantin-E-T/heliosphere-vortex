import * as THREE from 'three';
import { rng } from '../core/util.js';
import { NGP, scene } from './renderer.js';
import { dotTex } from './textures.js';

/* ================= DUST & GALACTIC PLANE ================= */
export const DUST = 1400;

export const dustSpan = 1600;

export const dustGeo = new THREE.BufferGeometry();

export let dustPos;

export let dust;

export const grid = new THREE.GridHelper(3000, 30, 0x4060a0, 0x22304f);

export function initDust() {
  dustPos = new Float32Array(DUST * 3);
  {
    const R = rng(77);
    for (let i = 0; i < DUST * 3; i++) dustPos[i] = (R() - 0.5) * dustSpan;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 1.6,
      map: dotTex,
      color: 0x8fb8ff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  dust.frustumCulled = false;
  scene.add(dust);
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), NGP);
  grid.visible = false;
  scene.add(grid);
}
