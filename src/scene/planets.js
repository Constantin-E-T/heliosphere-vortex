import * as THREE from 'three';
import { Eph } from '../engine/ephemeris.js';
import { DEG } from '../core/util.js';
import { PLANETS } from '../data/solar.js';
import { V, ecl } from './renderer.js';
import { loadMap } from './sky.js';
import { sunGroup, sunMesh } from './sun.js';
import { fresnelMat, planetTex, ringGeo, ringTex } from './textures.js';

/* ================= PLANETS ================= */
export const bodies = {};

export let pickables;

export const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.95 })
);

export const moonGeoAU = { x: 0, y: 0, z: 0 };

export function initPlanets() {
  pickables = [sunMesh];
  PLANETS.forEach(b => {
    const holder = new THREE.Group();
    sunGroup.add(holder);
    const tiltG = new THREE.Group();
    holder.add(tiltG);
    tiltG.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      ecl(Eph.eqToEcl(b.pole[0], b.pole[1]), V()).normalize()
    );
    if (b.name === 'Earth') {
      // full equatorial frame: local X → vernal equinox, so sidereal time sets the real orientation
      const c = Math.cos(Eph.OBLIQ * DEG),
        sn = Math.sin(Eph.OBLIQ * DEG);
      tiltG.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, c, -sn),
          new THREE.Vector3(0, sn, c)
        )
      );
    }
    const spinner = new THREE.Group();
    tiltG.add(spinner);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(b.r, 48, 32),
      new THREE.MeshStandardMaterial({ map: planetTex(b), roughness: 0.85, metalness: 0 })
    );
    mesh.userData.body = b.name;
    spinner.add(mesh);
    pickables.push(mesh);
    loadMap(mesh.material, b.map);
    if (b.name === 'Venus')
      spinner.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(b.r * 1.035, 48, 32),
          new THREE.MeshStandardMaterial({
            color: 0xead3a0,
            roughness: 1,
            transparent: true,
            opacity: 0.62,
            depthWrite: false
          })
        )
      );
    if (b.atmo)
      tiltG.add(
        new THREE.Mesh(new THREE.SphereGeometry(b.r * 1.12, 48, 32), fresnelMat(b.atmo, 3, 1.1))
      );
    if (b.type === 'cloud')
      tiltG.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(b.r * 1.08, 48, 32),
          fresnelMat('#ffd9a0', 2.5, 0.6)
        )
      );
    if (b.rings) {
      const ring = new THREE.Mesh(
        ringGeo(b.rings[0], b.rings[1]),
        new THREE.MeshLambertMaterial({
          map: ringTex(b.ringFaint),
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      ring.rotation.x = -Math.PI / 2;
      tiltG.add(ring);
    }
    const moons = (b.moons || []).map(m => {
      const mm = new THREE.Mesh(
        new THREE.SphereGeometry(m.r, 32, 20),
        new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.9 })
      );
      loadMap(mm.material, m.map);
      tiltG.add(mm);
      return { ...m, mesh: mm };
    });
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(257 * 3), 3));
    const orbit = new THREE.Line(
      orbitGeo,
      new THREE.LineBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.24,
        depthWrite: false
      })
    );
    orbit.frustumCulled = false;
    sunGroup.add(orbit);
    bodies[b.name] = {
      data: b,
      holder,
      tiltG,
      spinner,
      mesh,
      moons,
      orbit,
      orbitJD: null,
      au: { x: 0, y: 0, z: 0 },
      spinFree: 0
    };
  });
  bodies.Earth.holder.add(moonMesh);
}
