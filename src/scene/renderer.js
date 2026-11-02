import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { $, showFatal } from '../core/util.js';

/* ================= RENDERER ================= */
export let renderer;

export const scene = new THREE.Scene();

export let camera;

export let controls;

/* ================= FRAMES & SCALE ================= */
export const SCALES = {
  sqrt: { f: r => 44 * Math.sqrt(r), size: 1, sun: 6.5 },
  linear: { f: r => 6 * r, size: 0.3, sun: 2.2 }
};

export const ecl = (p, out) => out.set(p.x, p.z, -p.y); // J2000 ecliptic (z = north) → scene (y up)

export function toScene(p, out) {
  const r = Math.hypot(p.x, p.y, p.z),
    k = r > 0 ? live.SC.f(r) / r : 0;
  return out.set(p.x * k, p.z * k, -p.y * k);
}

export const V = () => new THREE.Vector3();

export let APEX;

export let NOSE;

export let GC;

export let NGP;

export let GROT;

export const galToScene = (l, b, out) =>
  out
    .copy(GC)
    .multiplyScalar(Math.cos(b) * Math.cos(l))
    .addScaledVector(GROT, Math.cos(b) * Math.sin(l))
    .addScaledVector(NGP, Math.sin(b));

export function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    $('#splash').classList.remove('gone');
    showFatal('The graphics driver reset. Reload the page to continue.');
  });
  THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
    $('#load-bar').style.width = `${Math.round((loaded / total) * 100)}%`;
    $('#load-t').textContent = `Loading NASA imagery · ${loaded} of ${total}`;
  };
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  $('#stage').appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 20000);
  camera.position.set(-420, 300, 460);
  controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true,
    dampingFactor: 0.08,
    minDistance: 2,
    maxDistance: 6000,
    rotateSpeed: 0.6,
    zoomSpeed: 0.9,
    autoRotateSpeed: 0.5
  });
  live.SC = SCALES.sqrt;
  APEX = ecl(Eph.SUN_APEX, V()).normalize();
  NOSE = ecl(Eph.HELIO_NOSE, V()).normalize();
  GC = ecl(Eph.GAL.center, V()).normalize();
  NGP = ecl(Eph.GAL.ngp, V()).normalize();
  GROT = ecl(Eph.GAL.rotation, V()).normalize();
}
