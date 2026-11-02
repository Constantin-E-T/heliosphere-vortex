import { texUrl } from '../core/tex-url.js';
import * as THREE from 'three';
import { rng } from '../core/util.js';
import { V, galToScene, renderer, scene } from './renderer.js';
import { additive, dotTex, glowTex } from './textures.js';

/* ================= SKY (true galactic orientation, follows camera) ================= */
export const sky = new THREE.Group();

export function starLayer(count, size, seed, bandShare) {
  const R = rng(seed),
    pos = new Float32Array(count * 3),
    col = new Float32Array(count * 3),
    c = new THREE.Color(),
    v = V(),
    rad = 9000;
  for (let i = 0; i < count; i++) {
    if (R() < bandShare) {
      const l = R() * Math.PI * 2,
        core = Math.pow(Math.max(0, Math.cos(l)), 3);
      galToScene(l, (R() + R() + R() - 1.5) * (0.12 + core * 0.18), v);
    } else {
      const u = R() * 2 - 1,
        th = R() * Math.PI * 2,
        s = Math.sqrt(1 - u * u);
      v.set(s * Math.cos(th), u, s * Math.sin(th));
    }
    v.multiplyScalar(rad);
    pos.set([v.x, v.y, v.z], i * 3);
    const t = R();
    c.setHSL(t < 0.18 ? 0.6 : t < 0.32 ? 0.09 : 0.62, t < 0.32 ? 0.6 : 0.12, 0.62 + R() * 0.3);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  sky.add(
    new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size,
        sizeAttenuation: false,
        vertexColors: true,
        map: dotTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );
}

/* Real sky: NASA Tycho star-catalogue map (equatorial, RA 0h at centre, RA increasing to the left) */
export const texLoader = new THREE.TextureLoader();

export const skyMesh = new THREE.Mesh(
  new THREE.SphereGeometry(9500, 64, 32),
  new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uGain: { value: 1.9 } },
    vertexShader:
      'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D uMap; uniform float uGain; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); vec3 e = vec3(d.x, -d.z, d.y); float ce = 0.9174820, se = 0.3977772;
      vec3 q = vec3(e.x, ce * e.y - se * e.z, se * e.y + ce * e.z);
      float ra = atan(q.y, q.x), dec = asin(clamp(q.z, -1.0, 1.0));
      vec3 c = texture2D(uMap, vec2(fract(0.5 - ra / 6.2831853), 0.5 + dec / 3.14159265)).rgb;
      c = max(c - vec3(0.045), 0.0) * uGain; gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  })
);

export function loadMap(mat, name) {
  if (!name) return;
  texLoader.load(
    texUrl(name),
    t => {
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      mat.map = t;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    },
    undefined,
    () => {}
  );
}

export function initSky() {
  scene.add(sky);
  starLayer(11000, 1.6 * renderer.getPixelRatio(), 11, 0.66);
  starLayer(700, 3.2 * renderer.getPixelRatio(), 23, 0.4);
  {
    const R = rng(5),
      haze = glowTex('rgba(255,255,255,.55)', 'rgba(255,255,255,.18)'),
      v = V();
    for (let i = 0; i < 34; i++) {
      const l = R() * Math.PI * 2,
        core = Math.pow(Math.max(0, Math.cos(l)), 2);
      const s = new THREE.Sprite(
        additive(
          haze,
          new THREE.Color().setHSL(0.62 - core * 0.53 + R() * 0.04, 0.45, 0.16 + core * 0.14),
          0.4 + core * 0.45
        )
      );
      galToScene(l, (R() - 0.5) * 0.05, v).multiplyScalar(8600);
      s.position.copy(v);
      s.scale.setScalar(2400 + R() * 1800 + core * 2600);
      sky.add(s);
    }
  }
  skyMesh.renderOrder = -10;
  skyMesh.visible = false;
  sky.add(skyMesh);
  texLoader.load(
    texUrl('sky'),
    t => {
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
      skyMesh.material.uniforms.uMap.value = t;
      skyMesh.visible = true;
      sky.children.forEach(c => {
        if (c !== skyMesh) c.visible = false;
      });
    },
    undefined,
    () => {}
  );
}
