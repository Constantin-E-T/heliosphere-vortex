import * as THREE from 'three';
import { live } from '../core/live.js';
import { UP } from '../camera/cinematic.js';
import { DEG, rng } from '../core/util.js';
import { galaxyDisk, glowSprite, starCloud } from './render.js';
import { GCP, R0, ZSUN, cosmic, gauss, gcV } from './scales.js';

/* ---- The Milky Way ---- */
export const MW = new THREE.Group();

export const mwPivot = new THREE.Group();

export let PITCH;

export const ARMS = [
  { name: 'Scutum–Centaurus Arm', R: 5.0 },
  { name: 'Sagittarius–Carina Arm', R: 6.6 },
  { name: 'Perseus Arm', R: 10.2 },
  { name: 'Norma–Outer Arm', R: 13.8 }
];

export let BAR;

export let mwDisk;

export const spinners = [];

export const rotMW = (v, out) => out.copy(v).sub(GCP).applyAxisAngle(UP, live.mwAngle).add(GCP);

export let sgrA;

export let youMark;

export function initMilkyWay() {
  mwPivot.add(MW);
  cosmic.add(mwPivot);
  PITCH = Math.tan(12.5 * DEG);
  BAR = 27 * DEG;
  mwDisk = galaxyDisk({
    r: 19,
    gal: {
      arms: 4,
      pitch: 12.5,
      armLn: ARMS.map(a => Math.log(a.R)),
      armW: 0.075,
      bulge: 1.25,
      bar: 1.6,
      barAng: Math.atan2(Math.sin(BAR), -Math.cos(BAR)),
      rs: 3.4,
      spur: 0.55,
      seed: 3.7,
      dust: 0.85,
      bright: 1.05,
      core: '#ffd49a',
      arm: '#a7c2ff',
      disk: '#d6c3a2'
    }
  });
  mwDisk.rotation.x = -Math.PI / 2;
  mwDisk.position.copy(GCP);
  MW.add(mwDisk);
  {
    const R = rng(2026),
      N = innerWidth < 720 ? 38000 : 65000,
      bx = -Math.cos(BAR),
      by = Math.sin(BAR);
    MW.add(
      starCloud(
        N,
        (i, p, c, o) => {
          const r = R();
          if (r < 0.14) {
            const u = Math.max(-4.5, Math.min(4.5, gauss(R) * 1.5)),
              v = gauss(R) * 0.6,
              w = gauss(R) * 0.38;
            p.set(R0 + u * bx + v * -by, w - ZSUN, -(u * by + v * bx));
            c.setHSL(0.09 + R() * 0.03, 0.6, 0.55 + R() * 0.2);
            o.size = 0.012 + R() * 0.01;
          } else if (r < 0.6) {
            const a = ARMS[Math.floor(R() * 4)],
              Rt = 3.2 + Math.pow(R(), 0.85) * 13.5,
              sc = 0.28 * Math.max(0.6, Rt / 8);
            gcV(
              Rt + gauss(R) * sc,
              Math.log(Rt / a.R) / PITCH + (gauss(R) * sc) / Rt,
              gauss(R) * 0.09,
              p
            );
            const t = R();
            c.setHSL(t < 0.05 ? 0.95 : 0.6, t < 0.05 ? 0.7 : 0.35, 0.65 + R() * 0.25);
            o.size = 0.008 + Math.pow(R(), 3) * 0.03;
          } else if (r < 0.64) {
            const ph = (R() - 0.5) * 0.75;
            gcV(8.34 + ph * 0.55 + gauss(R) * 0.12, ph, gauss(R) * 0.06, p);
            c.setHSL(0.6, 0.3, 0.75);
            o.size = 0.008 + Math.pow(R(), 3) * 0.02;
          } else {
            gcV(
              Math.min(18, 1.4 - 2.6 * Math.log(1 - R() * 0.97)),
              R() * Math.PI * 2,
              gauss(R) * 0.2,
              p
            );
            c.setHSL(0.1 + R() * 0.05, 0.25, 0.55 + R() * 0.25);
            o.size = 0.006 + R() * 0.008;
          }
        },
        2.6,
        0.9
      )
    );
    // Globular clusters in the halo (about 160 known)
    MW.add(
      starCloud(
        160,
        (i, p, c, o) => {
          const rr = 1 + Math.pow(R(), 2.2) * 40,
            u = R() * 2 - 1,
            t = R() * Math.PI * 2,
            s = Math.sqrt(1 - u * u);
          p.set(GCP.x + rr * s * Math.cos(t), GCP.y + rr * u, GCP.z + rr * s * Math.sin(t));
          c.setHSL(0.13, 0.45, 0.8);
          o.size = 0.06;
        },
        3.5,
        1
      )
    );
    // A neighbourhood of nearby stars around the Sun, so zooming in shows a real-looking star field
    MW.add(
      starCloud(
        9000,
        (i, p, c, o) => {
          const rr = Math.pow(R(), 0.5) * 0.6,
            u = R() * 2 - 1,
            t = R() * Math.PI * 2,
            s = Math.sqrt(1 - u * u);
          p.set(rr * s * Math.cos(t), rr * u * 0.35, rr * s * Math.sin(t));
          const k = R();
          c.setHSL(k < 0.1 ? 0.6 : k < 0.75 ? 0.1 : 0.03, k < 0.1 ? 0.5 : 0.45, 0.7 + R() * 0.25);
          o.size = 0.0006 + Math.pow(R(), 4) * 0.004;
        },
        2.6,
        1
      )
    );
  }
  mwPivot.position.copy(GCP);
  MW.position.copy(GCP).negate();
  live.mwAngle = 0;
  live.gSpin = true;
  sgrA = glowSprite('#fff2c8', 0.6, 1);
  sgrA.position.copy(GCP);
  cosmic.add(sgrA);
  youMark = glowSprite('#7fd4ff', 1, 1);
  cosmic.add(youMark);
}
