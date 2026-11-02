import * as THREE from 'three';
import { S } from '../core/state.js';
import { DEG } from '../core/util.js';

export const KPC_LY = 3261.56;

export const R0 = 8.275;

export const ZSUN = 0.0208;

export const cosmic = new THREE.Scene();

export let ccam;

export const galV = (l, b, d, out) =>
  out.set(
    d * Math.cos(b * DEG) * Math.cos(l * DEG),
    d * Math.sin(b * DEG),
    -d * Math.cos(b * DEG) * Math.sin(l * DEG)
  );

// Galactocentric (R, φ measured from the GC→Sun line toward −l, height z) → scene
export const gcV = (R, phi, z, out) => out.set(R0 - R * Math.cos(phi), z - ZSUN, R * Math.sin(phi));

export let GCP;

export const gauss = R => (R() + R() + R() + R() - 2) * 1.732;

export function initCosmicScales() {
  /* ================= COSMIC SCALES =================
   Frame: Sun-centred galactic coordinates in kpc. Scene axes: x → Galactic Centre, y → North Galactic Pole, −z → l = 90°.
   Sources: GRAVITY 2021 (R0 = 8.275 kpc), Bennett & Bovy 2019 (Sun 20.8 pc above plane), McConnachie 2012 (Local Group dwarfs),
   Pietrzyński 2019 (LMC), Graczyk 2020 (SMC), Li et al. 2021 (M31), Mei 2007 (Virgo), Blakeslee 2009 (Fornax), Tully et al. 2014 (Laniakea).
   Cluster distances beyond 40 Mpc are redshift distances with H0 = 70 km/s/Mpc. Spiral arms are a log-spiral model, not a map. */
  S.level = 'solar';
  cosmic.background = new THREE.Color(0x020308);
  ccam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.001, 1e6);
  GCP = new THREE.Vector3(R0, -ZSUN, 0);
}
