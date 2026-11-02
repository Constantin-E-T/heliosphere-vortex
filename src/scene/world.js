import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { sv } from '../camera/camera.js';
import { S } from '../core/state.js';
import { DEG } from '../core/util.js';
import { RATES } from '../data/solar.js';
import { DUST, dust, dustGeo, dustPos, dustSpan, grid } from './dust.js';
import { bodies, moonGeoAU, moonMesh } from './planets.js';
import { APEX, NGP, ecl, toScene } from './renderer.js';
import {
  TAIL,
  helio,
  sunGroup,
  sunMesh,
  sunPos,
  tailCol,
  tailGeo,
  tailPos,
  tailSeed
} from './sun.js';
import { VOY_N, VOY_STEP, voyAU, voyFutureGeo, voyPathGeo, voyager } from './voyager.js';

/* ================= WORLD UPDATE ================= */
export const au = { x: 0, y: 0, z: 0 };

export const orbitPt = { x: 0, y: 0, z: 0 };

export function rebuildOrbit(b, jdTT) {
  const el = Eph.elements(b.data.key, jdTT),
    arr = b.orbit.geometry.attributes.position.array;
  for (let i = 0; i <= 256; i++) {
    Eph.orbitPoint(el, (i / 256) * 360, orbitPt);
    toScene(orbitPt, sv);
    arr[i * 3] = sv.x;
    arr[i * 3 + 1] = sv.y;
    arr[i * 3 + 2] = sv.z;
  }
  b.orbit.geometry.attributes.position.needsUpdate = true;
  b.orbitJD = jdTT;
}

export function updateWorld(realDt) {
  const jdTT = Eph.ttFromUT(S.jd),
    dps = Math.abs(S.playing || S.travel ? (S.travel ? 1e4 : RATES[S.rate].d) : 0);
  // Sun position in the chosen frame
  if (S.frame === 'galactic')
    sunPos.copy(APEX).multiplyScalar((S.drift * (S.jd - S.anchorJD)) / 365.25);
  else sunPos.set(0, 0, 0);
  sunGroup.position.copy(sunPos);
  sunMesh.rotation.y = 2 * Math.PI * (((S.jd - Eph.J2000) / 25.38) % 1);

  for (const n in bodies) {
    const b = bodies[n],
      d = b.data;
    if (n === 'Earth') Eph.earth(jdTT, b.au, moonGeoAU);
    else Eph.planet(d.key, jdTT, b.au);
    toScene(b.au, b.holder.position);
    if (b.orbitJD === null || Math.abs(jdTT - b.orbitJD) > 1800) rebuildOrbit(b, jdTT);
    // Spin: true sidereal rate when slow enough to read, otherwise a calm stand-in
    const rotPerSec = (dps * 24) / Math.abs(d.rotH);
    if (rotPerSec < 0.6)
      b.spinner.rotation.y =
        n === 'Earth'
          ? ((280.46061837 + 360.98564736629 * (S.jd - 2451545)) % 360) * DEG // Greenwich sidereal time
          : 2 * Math.PI * (((((S.jd - Eph.J2000) * 24) / d.rotH) % 1) + 1);
    else b.spinner.rotation.y += Math.sign(d.rotH) * S.dir * realDt * 1.2;
    for (const m of b.moons) {
      const show = S.moons && dps / m.P < 1.2;
      m.mesh.visible = show;
      if (show) {
        const a = Eph.satLong(m.L0, m.P, jdTT) * DEG;
        m.mesh.position.set(Math.cos(a) * m.d, 0, -Math.sin(a) * m.d);
        m.mesh.rotation.y = a + Math.PI;
      } // tidally locked
    }
  }
  // Earth's Moon: true direction, enlarged distance
  moonMesh.visible = S.moons && dps / 27.32 < 1.2;
  ecl(moonGeoAU, moonMesh.position)
    .normalize()
    .multiplyScalar(bodies.Earth.data.r * live.SC.size * 2.4);

  // Voyager 1
  const vp = Eph.voyager(S.jd, voyAU);
  live.voyVisible = !!vp;
  voyager.visible = live.voyVisible;
  if (vp) {
    toScene(voyAU, voyager.position).add(sunPos);
    voyager.lookAt(sunPos);
    voyager.userData.beacon.material.opacity = 0.55 + Math.sin(performance.now() * 0.004) * 0.35;
  }
  const pre = S.jd < Eph.VOY_EVENTS.launch,
    idx = Math.max(0, Math.min(VOY_N - 1, Math.floor((S.jd - Eph.VOY_EVENTS.launch) / VOY_STEP)));
  voyPathGeo.setDrawRange(0, pre ? 0 : idx + 1);
  voyFutureGeo.setDrawRange(pre ? 0 : idx, pre ? VOY_N : VOY_N - idx);

  // Heliotail
  if (helio.visible) {
    const hp = helio.userData.hp,
      len = hp * 3.2,
      spd = S.playing ? realDt : 0;
    for (let i = 0; i < TAIL; i++) {
      const p = tailSeed[i];
      p.u += p.v * spd * 0.25;
      if (p.u > 1) p.u -= 1;
      const x = -p.u * len,
        rr = hp * p.rf * (0.92 + p.u * 0.45);
      tailPos[i * 3] = x;
      tailPos[i * 3 + 1] = Math.cos(p.a + p.u * 1.4) * rr;
      tailPos[i * 3 + 2] = Math.sin(p.a + p.u * 1.4) * rr;
      const f = (1 - p.u) * Math.min(1, p.u * 14) * 0.5;
      tailCol[i * 3] = 0.35 * f;
      tailCol[i * 3 + 1] = 0.7 * f;
      tailCol[i * 3 + 2] = f;
    }
    tailGeo.attributes.position.needsUpdate = tailGeo.attributes.color.needsUpdate = true;
  }

  // Dust wraps around the Sun in every direction
  if (dust.visible) {
    const h = dustSpan / 2;
    for (let i = 0; i < DUST; i++) {
      for (let a = 0; a < 3; a++) {
        const j = i * 3 + a,
          c = a === 0 ? sunPos.x : a === 1 ? sunPos.y : sunPos.z;
        let v = dustPos[j] - c;
        if (v < -h || v > h) {
          v = ((((v + h) % dustSpan) + dustSpan) % dustSpan) - h;
          dustPos[j] = c + v;
        }
      }
    }
    dustGeo.attributes.position.needsUpdate = true;
  }
  if (grid.visible) {
    grid.position.copy(sunPos).addScaledVector(NGP, -live.SC.f(20));
  }
}
