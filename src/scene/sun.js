import * as THREE from 'three';
import { Eph } from '../engine/ephemeris.js';
import { rng } from '../core/util.js';
import { APEX, GC, NOSE, V, ecl, scene } from './renderer.js';
import { additive, canvasTex, dotTex, fresnelMat, glowTex } from './textures.js';

/* ================= SUN, HELIOSPHERE, GUIDES ================= */
export const sunGroup = new THREE.Group();

export let sunPos;

export const sunBody = new THREE.Group();

export let sunMesh;

export let glowA;

export let glowB;

// Heliosphere: nose toward the interstellar inflow direction (local +X), tail streams away
export const helio = new THREE.Group();

export let hpBell;

export let tsShell;

export const TAIL = 900;

export const tailGeo = new THREE.BufferGeometry();

export let tailPos;

export let tailCol;

export const tailSeed = [];

export let tail;

export const guides = new THREE.Group();

export let GUIDE_DEFS;

export let guideObjs;

export function initSun() {
  scene.add(sunGroup);
  sunPos = V();
  sunGroup.add(sunBody);
  sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshBasicMaterial({
      map: canvasTex(512, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#ffcf6a');
        gr.addColorStop(0.5, '#ffe7a8');
        gr.addColorStop(1, '#ffcf6a');
        g.fillStyle = gr;
        g.fillRect(0, 0, w, h);
        const R = rng(99);
        for (let i = 0; i < 2600; i++) {
          g.globalAlpha = 0.1 + R() * 0.2;
          g.fillStyle = R() < 0.5 ? '#ff9a2e' : '#fff3c4';
          g.beginPath();
          g.arc(R() * w, R() * h, 0.8 + R() * 2.4, 0, 7);
          g.fill();
        }
      })
    })
  );
  sunMesh.userData.body = 'Sun';
  sunBody.add(sunMesh);
  {
    const p = Eph.eqToEcl(286.13, 63.87);
    sunBody.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ecl(p, V()).normalize());
  }
  glowA = new THREE.Sprite(additive(glowTex('rgba(255,240,200,1)', 'rgba(255,170,60,.55)')));
  sunGroup.add(glowA);
  glowB = new THREE.Sprite(
    additive(glowTex('rgba(255,190,110,.6)', 'rgba(255,120,40,.12)'), undefined, 0.8)
  );
  sunGroup.add(glowB);
  sunGroup.add(new THREE.PointLight(0xfff1dc, 2.4, 0, 0));
  scene.add(new THREE.AmbientLight(0x404a70, 0.3));
  sunGroup.add(helio);
  helio.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), NOSE);
  hpBell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 72, 40, 0, Math.PI * 2, 0, Math.PI * 0.62),
    fresnelMat('#5fc4ff', 2.6, 0.55)
  );
  hpBell.rotation.z = -Math.PI / 2;
  helio.add(hpBell);
  tsShell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), fresnelMat('#8f7dff', 3.5, 0.22));
  helio.add(tsShell);
  tailPos = new Float32Array(TAIL * 3);
  tailCol = new Float32Array(TAIL * 3);
  {
    const R = rng(42);
    for (let i = 0; i < TAIL; i++)
      tailSeed.push({ a: R() * Math.PI * 2, rf: 0.75 + R() * 0.4, u: R(), v: 0.06 + R() * 0.08 });
  }
  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
  tailGeo.setAttribute('color', new THREE.BufferAttribute(tailCol, 3));
  tail = new THREE.Points(
    tailGeo,
    new THREE.PointsMaterial({
      size: 3,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  tail.frustumCulled = false;
  helio.add(tail);
  sunGroup.add(guides);
  GUIDE_DEFS = [
    { dir: APEX, color: 0xffb547, text: "Sun's motion · 251.9 km/s" },
    { dir: GC, color: 0xffd27a, text: 'Galactic centre · 8.3 kpc' },
    { dir: NOSE, color: 0x7fd4ff, text: 'Interstellar wind arrives' }
  ];
  guideObjs = GUIDE_DEFS.map(g => {
    const a = new THREE.ArrowHelper(g.dir, new THREE.Vector3(), 1, g.color);
    a.line.material.transparent = true;
    a.line.material.opacity = 0.55;
    guides.add(a);
    return { ...g, arrow: a };
  });
}
