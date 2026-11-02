import * as THREE from 'three';
import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { pickables } from './planets.js';
import { V, scene, toScene } from './renderer.js';
import { sunGroup } from './sun.js';
import { additive, dotTex } from './textures.js';

/* ================= VOYAGER 1 ================= */
export const voyager = new THREE.Group();

export const voyAU = { x: 0, y: 0, z: 0 };

// Precomputed path, launch → 2200, drawn in the Sun's frame: past bright, future dim
export const VOY_STEP = 15;

export const VOY_END = Eph.calToJD(2200, 1, 1);

export let VOY_N;

export let voyPathAU;

export const voyPathGeo = new THREE.BufferGeometry();

export const voyFutureGeo = new THREE.BufferGeometry();

export let voyPast;

export let voyFuture;

export function rebuildVoyPath() {
  const arr = voyPathGeo.attributes.position.array,
    p = { x: 0, y: 0, z: 0 },
    v = V();
  for (let i = 0; i < VOY_N; i++) {
    p.x = voyPathAU[i * 3];
    p.y = voyPathAU[i * 3 + 1];
    p.z = voyPathAU[i * 3 + 2];
    toScene(p, v);
    arr[i * 3] = v.x;
    arr[i * 3 + 1] = v.y;
    arr[i * 3 + 2] = v.z;
  }
  voyPathGeo.attributes.position.needsUpdate = true;
  voyFuture.computeLineDistances();
}

export function initVoyager() {
  scene.add(voyager);
  {
    const white = new THREE.MeshStandardMaterial({
      color: 0xe9e9ef,
      roughness: 0.4,
      metalness: 0.3
    });
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.32),
      white
    );
    dish.rotation.x = Math.PI / 2;
    voyager.add(dish);
    const bus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.6, 10),
      new THREE.MeshStandardMaterial({ color: 0x9a8f7a, roughness: 0.6, metalness: 0.5 })
    );
    bus.rotation.x = Math.PI / 2;
    bus.position.z = -0.7;
    voyager.add(bus);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 7, 6), white);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(1.5, 0, -0.8);
    voyager.add(boom);
    const beacon = new THREE.Sprite(additive(dotTex, new THREE.Color('#ff6fa8')));
    beacon.scale.setScalar(9);
    voyager.add(beacon);
    voyager.userData.beacon = beacon;
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(5, 8, 6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.userData.body = 'Voyager 1';
    voyager.add(hit);
    pickables.push(hit);
  }
  live.voyVisible = false;
  VOY_N = Math.ceil((VOY_END - Eph.VOY_EVENTS.launch) / VOY_STEP) + 1;
  voyPathAU = new Float32Array(VOY_N * 3);
  {
    const p = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < VOY_N; i++) {
      Eph.voyager(Math.min(Eph.VOY_EVENTS.launch + i * VOY_STEP + 1e-6, VOY_END), p);
      voyPathAU.set([p.x, p.y, p.z], i * 3);
    }
  }
  voyPathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(VOY_N * 3), 3));
  voyFutureGeo.setAttribute('position', voyPathGeo.attributes.position);
  voyPast = new THREE.Line(
    voyPathGeo,
    new THREE.LineBasicMaterial({
      color: 0xff6fa8,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    })
  );
  voyFuture = new THREE.Line(
    voyFutureGeo,
    new THREE.LineDashedMaterial({
      color: 0xff6fa8,
      transparent: true,
      opacity: 0.3,
      dashSize: 4,
      gapSize: 4,
      depthWrite: false
    })
  );
  voyPast.frustumCulled = voyFuture.frustumCulled = false;
  sunGroup.add(voyPast, voyFuture);
}
