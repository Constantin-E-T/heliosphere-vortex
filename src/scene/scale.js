import { live } from '../core/live.js';
import { S } from '../core/state.js';
import { bodies, moonMesh } from './planets.js';
import { SCALES } from './renderer.js';
import { glowA, glowB, guideObjs, helio, hpBell, sunMesh, tail, tsShell } from './sun.js';
import { rebuildVoyPath } from './voyager.js';
import { clearTrails } from './wakes.js';

/* ================= SCALE APPLY ================= */
export function applyScale() {
  live.SC = SCALES[S.scale];
  sunMesh.scale.setScalar(live.SC.sun);
  glowA.scale.setScalar(live.SC.sun * 7.4);
  glowB.scale.setScalar(live.SC.sun * 26);
  for (const n in bodies) {
    const b = bodies[n];
    b.tiltG.scale.setScalar(live.SC.size);
    b.orbitJD = null;
  }
  moonMesh.scale.setScalar(live.SC.size);
  const hp = live.SC.f(121.6),
    ts = live.SC.f(94);
  hpBell.scale.setScalar(hp);
  tsShell.scale.setScalar(ts);
  helio.userData.hp = hp;
  tail.material.size = S.scale === 'sqrt' ? 3 : 5;
  guideObjs.forEach(g =>
    g.arrow.setLength(live.SC.f(60), live.SC.f(60) * 0.08, live.SC.f(60) * 0.04)
  );
  rebuildVoyPath();
  clearTrails();
}
