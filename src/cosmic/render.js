import * as THREE from 'three';
import { DEG } from '../core/util.js';
import { ccam } from './scales.js';
import { V, renderer } from '../scene/renderer.js';
import { glowTex } from '../scene/textures.js';

/* ---- Rendering: shader-drawn galaxies, fine stars, nebulae ---- */
export const GLSL_NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 6; i++){ v += a * noise(p); p = m * p + 17.1; a *= 0.5; } return v; }`;

export const PLANE_VS = `varying vec2 vUv; varying float vFace;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFace = abs(dot(normalize(normalMatrix * vec3(0.0, 0.0, 1.0)), normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`;

export let GALAXY_FS;

export function galaxyDisk(o) {
  const g = o.gal,
    arms = g.arms || 0,
    base = Math.log(g.r0 || o.r * 0.4),
    per = 2 * Math.PI * Math.tan(g.pitch * DEG);
  const ln = g.armLn || [0, 1, 2, 3].map(k => base + (k * per) / Math.max(1, arms));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uR: { value: o.r },
      uTanP: { value: Math.tan(g.pitch * DEG) },
      uNArms: { value: arms },
      uArmW: { value: g.armW || 0.1 },
      uBulge: { value: g.bulge },
      uBarLen: { value: g.bar || 0 },
      uBarAng: { value: g.barAng || 0 },
      uRs: { value: g.rs },
      uSpur: { value: g.spur || 0 },
      uSeed: { value: g.seed || 1 },
      uOpacity: { value: 1 },
      uIrr: { value: g.irr || 0 },
      uRingR: { value: g.ringR || 0 },
      uRingS: { value: g.ringS || 0 },
      uDust: { value: g.dust ?? 0.8 },
      uBright: { value: g.bright || 1 },
      uArmLn: { value: new THREE.Vector4(...ln) },
      uCoreCol: { value: new THREE.Color(g.core || '#ffd9a0') },
      uArmCol: { value: new THREE.Color(g.arm || '#a9c4ff') },
      uDiskCol: { value: new THREE.Color(g.disk || '#c9b9a0') }
    },
    vertexShader: PLANE_VS,
    fragmentShader: GALAXY_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(o.r * 2, o.r * 2, 1, 1), mat);
}

// Stars: world-sized points that never grow past a few pixels, so zooming reveals finer stars rather than bigger dots
export const STAR_VS = `attribute float size; attribute vec3 acol; uniform float uScale, uOpacity, uMaxPx; varying vec3 vC; varying float vA;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float s = size * uScale / max(-mv.z, 1e-6);
  vA = clamp(s / 1.4, 0.04, 1.0) * uOpacity; gl_PointSize = clamp(s, 1.0, uMaxPx); vC = acol; gl_Position = projectionMatrix * mv; }`;

export const STAR_FS = `varying vec3 vC; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0; float a = exp(-r2 * 3.5) + 0.35 * exp(-r2 * 0.9) * step(r2, 1.0);
  gl_FragColor = vec4(vC * a * vA, 1.0); }`;

export const starMats = [];

export function starCloud(n, fill, maxPx = 3.2, opacity = 1) {
  const pos = new Float32Array(n * 3),
    col = new Float32Array(n * 3),
    siz = new Float32Array(n),
    p = V(),
    c = new THREE.Color(),
    o = { size: 0.01 };
  for (let i = 0; i < n; i++) {
    fill(i, p, c, o);
    pos.set([p.x, p.y, p.z], i * 3);
    col.set([c.r, c.g, c.b], i * 3);
    siz[i] = o.size;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('acol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1 },
      uOpacity: { value: opacity },
      uMaxPx: { value: maxPx * renderer.getPixelRatio() }
    },
    vertexShader: STAR_VS,
    fragmentShader: STAR_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  starMats.push(m);
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

// Distant galaxies: each point is drawn as a small tilted ellipse with a bright core
export const GALPT_VS = `attribute float size; attribute vec3 acol; attribute vec2 shape; uniform float uScale, uOpacity, uMaxPx; varying vec3 vC; varying float vA; varying vec2 vS;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float s = size * uScale / max(-mv.z, 1e-6);
  vA = clamp(s / 1.6, 0.05, 1.0) * uOpacity; gl_PointSize = clamp(s, 1.0, uMaxPx); vC = acol; vS = shape; gl_Position = projectionMatrix * mv; }`;

export const GALPT_FS = `varying vec3 vC; varying float vA; varying vec2 vS;
void main(){ vec2 d = gl_PointCoord - 0.5; float c = cos(vS.x), s = sin(vS.x); d = vec2(c * d.x + s * d.y, -s * d.x + c * d.y); d.y /= vS.y;
  float r2 = dot(d, d) * 4.0; if (r2 > 1.0) discard; float a = exp(-r2 * 14.0) * 1.3 + 0.45 * exp(-r2 * 3.2);
  gl_FragColor = vec4(vC * a * vA, 1.0); }`;

export function galaxyCloud(n, fill, maxPx = 14) {
  const pos = new Float32Array(n * 3),
    col = new Float32Array(n * 3),
    siz = new Float32Array(n),
    shp = new Float32Array(n * 2),
    p = V(),
    c = new THREE.Color(),
    o = { size: 1, ang: 0, ratio: 1 };
  for (let i = 0; i < n; i++) {
    fill(i, p, c, o);
    pos.set([p.x, p.y, p.z], i * 3);
    col.set([c.r, c.g, c.b], i * 3);
    siz[i] = o.size;
    shp[i * 2] = o.ang;
    shp[i * 2 + 1] = o.ratio;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('acol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  g.setAttribute('shape', new THREE.BufferAttribute(shp, 2));
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uScale: { value: 1 },
      uOpacity: { value: 1 },
      uMaxPx: { value: maxPx * renderer.getPixelRatio() }
    },
    vertexShader: GALPT_VS,
    fragmentShader: GALPT_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  starMats.push(m);
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

export function updateStarScale() {
  const s = renderer.domElement.height / (2 * Math.tan((ccam.fov * DEG) / 2));
  starMats.forEach(m => (m.uniforms.uScale.value = s));
}

export let NEB_FS;

export const billboards = [];

export function nebula(size, type, c1, c2, c3, seed, stars = 0, opacity = 1) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uC1: { value: new THREE.Color(c1) },
      uC2: { value: new THREE.Color(c2) },
      uC3: { value: new THREE.Color(c3) },
      uSeed: { value: seed },
      uOpacity: { value: opacity },
      uStars: { value: stars },
      uType: { value: type },
      uTime: { value: 0 }
    },
    vertexShader: PLANE_VS,
    fragmentShader: NEB_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
  billboards.push(mesh);
  return mesh;
}

export let softTex;

export const V0 = new THREE.Vector3();

export function glowSprite(color, scale, opacity) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softTex,
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  s.scale.setScalar(scale);
  return s;
}

export function initCosmicRender() {
  // Spiral galaxy: log-spiral arms with clumpy star formation, dust lanes on the inner edge, bar and bulge
  GALAXY_FS = `
uniform float uR, uTanP, uNArms, uArmW, uBulge, uBarLen, uBarAng, uRs, uSpur, uSeed, uOpacity, uIrr, uRingR, uRingS, uDust, uBright;
uniform vec4 uArmLn; uniform vec3 uCoreCol, uArmCol, uDiskCol;
varying vec2 vUv; varying float vFace;
${GLSL_NOISE}
void main(){
  vec2 p = (vUv - 0.5) * 2.0 * uR; float r = length(p);
  if (r > uR) discard;
  float edge = 1.0 - smoothstep(uR * 0.62, uR, r);
  float phi = atan(-p.y, -p.x);
  vec2 np = p / uR * 6.0 + uSeed;
  float n = fbm(np), n2 = fbm(np * 3.1 + 5.0), n3 = fbm(np * 9.0 - 3.0);
  float lr = log(max(r, 0.05)), per = 6.2831853 * uTanP;
  float arms = 0.0, dust = 0.0;
  for (int k = 0; k < 4; k++){
    if (float(k) >= uNArms) break;
    float u = lr - phi * uTanP - uArmLn[k] + (n - 0.5) * (0.12 + uIrr * 0.5);
    u -= per * floor(u / per + 0.5);
    arms += exp(-pow(u / uArmW, 2.0));
    dust += exp(-pow((u + uArmW * 1.15) / (uArmW * 0.55), 2.0));
  }
  if (uSpur > 0.0){ float ds = r - 8.34 - phi * 0.55; arms += uSpur * exp(-pow(ds / 0.22, 2.0)) * smoothstep(0.5, 0.3, abs(phi)); }
  float ca = cos(uBarAng), sa = sin(uBarAng); vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
  float bulge = exp(-length(vec2(q.x / (uBulge * (1.0 + uBarLen)), q.y / uBulge)) * 2.4);
  float core = exp(-r / (uBulge * 0.12));
  float disk = exp(-r / uRs);
  float ring = uRingS * exp(-pow((r - uRingR) / (uR * 0.045), 2.0)) * (0.5 + n2);
  float clump = smoothstep(0.42, 0.78, n2), knots = smoothstep(0.7, 0.86, n3);
  float am = clamp(arms + ring, 0.0, 1.6);
  vec3 col = uDiskCol * disk * (0.45 + 0.6 * n);
  col += uArmCol * disk * 1.7 * am * (0.45 + 1.1 * clump);
  col += vec3(1.0, 0.36, 0.55) * knots * am * disk * 2.2;
  col += vec3(0.75, 0.88, 1.0) * smoothstep(0.78, 0.92, n3) * am * disk * 1.4;
  col += uCoreCol * (bulge * 1.5 + core * 1.2);
  float dl = clamp((dust * 0.8 + smoothstep(0.55, 0.8, n2) * 0.25 * am) * uDust * (0.45 + 0.9 * n) * smoothstep(0.0, uBulge * 0.8, r), 0.0, 0.62);
  col *= 1.0 - dl;
  col *= mix(1.0, 0.25 + 1.5 * n, uIrr);
  col *= edge * uBright * uOpacity * mix(0.35, 1.0, smoothstep(0.0, 0.4, vFace));
  gl_FragColor = vec4(col, 1.0);
}`;
  // Nebulae and diffuse objects: billboarded noise clouds
  NEB_FS = `uniform vec3 uC1, uC2, uC3; uniform float uSeed, uOpacity, uStars, uType, uTime; varying vec2 vUv; varying float vFace;
${GLSL_NOISE}
void main(){ vec2 p = (vUv - 0.5) * 2.0; float r = length(p); if (r > 1.0) discard;
  vec2 fl = vec2(uTime * 0.012, -uTime * 0.008); float f = fbm(p * 2.2 + uSeed + fl), g = fbm(p * 4.5 + f * 2.2 + uSeed * 1.7 - fl * 1.6), h = fbm(p * 9.0 - uSeed + fl * 2.5);
  vec3 col;
  if (uType < 0.5){ // emission nebula: glowing gas carved by dark dust
    float dens = smoothstep(1.0, 0.15, r + (f - 0.5) * 0.9) * (0.35 + g);
    col = mix(uC1, uC2, smoothstep(0.3, 0.7, g)) * dens * 1.6 + uC3 * pow(max(0.0, g - 0.45), 2.0) * 3.0 * dens;
    col *= smoothstep(0.28, 0.55, fbm(p * 3.6 - uSeed * 0.7) + 0.12);
  } else if (uType < 1.5){ // reflection haze around a young cluster
    col = uC1 * smoothstep(1.0, 0.0, r) * (0.25 + 0.9 * g * g) * 0.9;
  } else if (uType < 2.5){ // supernova remnant: filament shell
    float shell = exp(-pow((r - 0.62 - (f - 0.5) * 0.35) / 0.16, 2.0)); col = mix(uC1, uC2, h) * (shell * (0.4 + 1.6 * h) + 0.35 * exp(-r * r * 6.0) * g);
  } else { // dwarf spheroidal: smooth faint fuzz
    col = uC1 * exp(-r * r * 3.2) * (0.85 + 0.3 * g);
  }
  col += vec3(1.0) * exp(-r * r * 60.0) * uStars;
  gl_FragColor = vec4(col * uOpacity * smoothstep(1.0, 0.75, r), 1.0); }`;
  softTex = glowTex('rgba(255,255,255,.9)', 'rgba(255,255,255,.25)');
}
