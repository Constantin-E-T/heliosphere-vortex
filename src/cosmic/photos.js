import * as THREE from 'three';
import { live } from '../core/live.js';
import { COS_BY } from './catalogue.js';
import { renderCosInfo } from './info.js';
import { GLSL_NOISE, PLANE_VS, billboards, nebula } from './render.js';
import { renderer } from '../scene/renderer.js';
import { texLoader } from '../scene/sky.js';

export let IMG_FS;

export function photoCard(o) {
  const g = new THREE.Group(),
    mk = layer =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
          uniforms: {
            uMap: { value: null },
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uLayer: { value: layer },
            uSeed: { value: o.d % 17 }
          },
          vertexShader: PLANE_VS,
          fragmentShader: IMG_FS,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        })
      );
  // A soft glow in the object's colour, so the photograph sits inside its own light
  const halo = nebula(o.size * 2.6, 1, o.color, o.color, o.color, o.d % 11, 0, 0.28);
  g.add(halo);
  const gas = mk(0),
    stars = mk(1);
  g.add(gas, stars);
  billboards.push(gas, stars);
  // Depth layers along the line of sight from Earth give the picture parallax as you orbit it
  const los = o.pos ? o.pos.clone().negate().normalize() : new THREE.Vector3(0, 0, 1);
  gas.position.copy(los).multiplyScalar(-o.size * 0.06);
  stars.position.copy(los).multiplyScalar(o.size * 0.14);
  g.userData = { gas, stars, halo };
  g.visible = false;
  g.material = gas.material;
  return g;
}

export const photoCache = {};

export function ensurePhoto(o, tel) {
  const key = `${tel}_${o.photo}`;
  const apply = t => {
    if (o.tel !== tel) return;
    const im = t.image,
      u = o.card.userData;
    [u.gas, u.stars].forEach(m => {
      m.material.uniforms.uMap.value = t;
      m.scale.set(o.size, (o.size * im.height) / im.width, 1);
    });
    o.card.visible = true;
  };
  o.tel = tel;
  if (photoCache[key]) {
    if (photoCache[key].image) apply(photoCache[key]);
    return;
  }
  photoCache[key] = texLoader.load(
    `tex/photo/${key}.jpg`,
    t => {
      t.generateMipmaps = true;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      apply(t);
    },
    undefined,
    () => {}
  );
}

export function initPhotos() {
  /* ---- Telescope photographs (Webb and Hubble), brought to life in a shader ---- */
  IMG_FS = `uniform sampler2D uMap; uniform float uTime, uOpacity, uLayer, uSeed; varying vec2 vUv; varying float vFace;
${GLSL_NOISE}
void main(){
  vec2 uv = vUv, q = (uv - 0.5) * 2.0;
  // Irregular cloud-shaped edge instead of a rectangle
  float edge = fbm(uv * 2.6 + uSeed) - 0.5, rr = length(q * vec2(1.0, 1.08)) + edge * 0.55;
  float mask = 1.0 - smoothstep(0.6, 1.06, rr);
  if (mask <= 0.0) discard;
  vec3 base = texture2D(uMap, uv).rgb;
  float lum = dot(base, vec3(0.299, 0.587, 0.114)), star = smoothstep(0.7, 0.95, lum) * smoothstep(0.0, 0.25, lum - dot(texture2D(uMap, uv + vec2(0.006, 0.0)).rgb, vec3(0.333)));
  vec3 c;
  if (uLayer < 0.5){ // gas: drifts and breathes; bright stars lifted out to the front layer
    vec2 w = vec2(fbm(uv * 3.0 + uTime * 0.018), fbm(uv * 3.0 - uTime * 0.014)) - 0.5;
    c = texture2D(uMap, uv + w * 0.003).rgb * (1.0 - star * 0.8);
    c *= 1.0 + 0.06 * sin(uTime * 0.35 + fbm(uv * 2.0) * 6.2831);
    c = max(c - 0.03, 0.0) * 1.08;
  } else {           // stars: sharp, twinkling, slightly nearer so they parallax against the gas
    c = base * star * (1.15 + 0.3 * sin(uTime * 2.1 + hash(floor(uv * 700.0)) * 6.2831));
  }
  gl_FragColor = vec4(c * mask * uOpacity, 1.0);
}`;
  document.querySelectorAll('#in-tel button').forEach(b =>
    b.addEventListener('click', () => {
      const o = COS_BY[live.cosFocus];
      if (!o || !o.photo) return;
      ensurePhoto(o, b.dataset.tel);
      renderCosInfo();
    })
  );
}
