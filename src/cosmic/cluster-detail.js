import * as THREE from 'three';
import { rng } from '../core/util.js';
import { COS } from './catalogue.js';
import { PLANE_VS, billboards, galaxyDisk } from './render.js';
import { ccam } from './scales.js';

/* ---- Inside a cluster: real-looking galaxies replace the distant points as you fly in ---- */
export const ELL_FS = `uniform float uRatio, uAng, uOpacity, uTime; uniform vec3 uCol; varying vec2 vUv; varying float vFace;
void main(){ vec2 p = (vUv - 0.5) * 2.0; float c = cos(uAng), s = sin(uAng); p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y); p.y /= uRatio;
  float r = length(p); if (r > 1.0) discard; float a = exp(-pow(r * 7.0, 0.5) * 2.2) * 1.6 + 0.25 * exp(-r * r * 5.0);
  gl_FragColor = vec4(uCol * a * uOpacity * smoothstep(1.0, 0.7, r), 1.0); }`;

export function ellipticalCard(radius, ratio, ang, col) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRatio: { value: ratio },
      uAng: { value: ang },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uCol: { value: new THREE.Color(col) }
    },
    vertexShader: PLANE_VS,
    fragmentShader: ELL_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), m);
  billboards.push(mesh);
  return mesh;
}

export let detailFor = null;

export let detailGroup = null;

export function buildDetail(o) {
  if (detailGroup) {
    detailGroup.parent && detailGroup.parent.remove(detailGroup);
    detailGroup.traverse(m => {
      if (m.isMesh) {
        m.geometry.dispose();
        m.material.dispose();
        const i = billboards.indexOf(m);
        if (i >= 0) billboards.splice(i, 1);
      }
    });
  }
  detailFor = o;
  detailGroup = new THREE.Group();
  o.obj.add(detailGroup);
  const R = rng(Math.round(o.d) + 3),
    cols = ['#ffe2bf', '#ffd6a8', '#f6e6d0'],
    arms = ['#a9c4ff', '#b8ccff', '#c3d2ff'];
  o.members.forEach((m, i) => {
    const radius = i === 0 && o.cluster ? 70 : Math.max(5, Math.min(45, m.size * 0.22));
    let mesh;
    if (m.ell) {
      mesh = ellipticalCard(radius * 1.4, m.ratio, m.ang, cols[i % 3]);
    } else {
      mesh = galaxyDisk({
        r: radius,
        gal: {
          arms: 2,
          pitch: 10 + R() * 18,
          r0: radius * 0.16,
          armW: 0.1 + R() * 0.08,
          bulge: radius * 0.09,
          bar: R() < 0.35 ? 1.3 : 0,
          barAng: R() * 3,
          rs: radius * 0.3,
          dust: 0.45 + R() * 0.4,
          seed: R() * 30,
          bright: 1.25,
          arm: arms[i % 3]
        }
      });
      mesh.quaternion.setFromEuler(new THREE.Euler(R() * Math.PI * 2, R() * Math.PI * 2, 0));
    }
    mesh.position.copy(m.p);
    detailGroup.add(mesh);
  });
}

export function updateDetail() {
  let best = null,
    bd = Infinity;
  COS.forEach(o => {
    if (!o.members) return;
    const d = ccam.position.distanceTo(o.pos) / o.r;
    if (d < bd) {
      bd = d;
      best = o;
    }
  });
  if (best && bd < 14) {
    if (detailFor !== best) buildDetail(best);
  }
  if (!detailGroup) return;
  const k = detailFor === best ? Math.max(0, Math.min(1, (14 - bd) / 6)) : 0;
  detailGroup.visible = k > 0;
  detailGroup.children.forEach(m => {
    m.material.uniforms.uOpacity.value = k;
  });
}
