import * as THREE from 'three';
import { rng } from '../core/util.js';
import { V } from './renderer.js';

/* ================= TEXTURES ================= */
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export function glowTex(inner, mid) {
  return canvasTex(128, 128, g => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(0.22, mid);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
}

export let dotTex;

export function blob(g, x, y, r, R) {
  g.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      rr = r * (0.6 + R() * 0.6);
    const px = x + Math.cos(a) * rr * 1.4,
      py = y + Math.sin(a) * rr;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}

export function planetTex(b) {
  return canvasTex(512, 256, (g, w, h) => {
    const R = rng(b.name.length * 977 + b.r * 100),
      P = b.tex || [],
      pick = () => P[Math.floor(R() * P.length)];
    if (b.type === 'earth') {
      g.fillStyle = '#1d4b98';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        g.globalAlpha = 0.9;
        g.fillStyle = R() < 0.5 ? '#3d7a37' : '#78924a';
        blob(g, R() * w, h * 0.18 + R() * h * 0.64, 8 + R() * 30, R);
      }
      g.globalAlpha = 0.95;
      g.fillStyle = '#eef3fa';
      g.fillRect(0, 0, w, h * 0.07);
      g.fillRect(0, h * 0.93, w, h * 0.07);
      g.globalAlpha = 0.3;
      for (let i = 0; i < 110; i++) {
        g.fillStyle = '#fff';
        g.fillRect(R() * w, R() * h, 20 + R() * 80, 2 + R() * 4);
      }
    } else if (b.type === 'rock') {
      g.fillStyle = P[0];
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 600; i++) {
        g.globalAlpha = 0.12 + R() * 0.35;
        g.fillStyle = pick();
        g.beginPath();
        g.arc(R() * w, R() * h, 1 + R() * (i < 50 ? 16 : 4), 0, 7);
        g.fill();
      }
      if (b.name === 'Mars') {
        g.globalAlpha = 0.9;
        g.fillStyle = '#f3ece4';
        g.fillRect(0, 0, w, h * 0.05);
        g.fillRect(0, h * 0.96, w, h * 0.04);
      }
    } else {
      let y = 0;
      const gas = b.type === 'gas';
      while (y < h) {
        const bh = gas ? 3 + R() * 16 : 12 + R() * 40;
        g.globalAlpha = gas ? 0.95 : 0.7;
        g.fillStyle = pick();
        g.fillRect(0, y, w, bh + 1);
        y += bh;
      }
      for (let i = 0; i < (gas ? 320 : 60); i++) {
        g.globalAlpha = 0.06 + R() * 0.12;
        g.fillStyle = pick();
        g.fillRect(R() * w, R() * h, 30 + R() * 180, 1 + R() * 3);
      }
      if (b.name === 'Jupiter') {
        g.globalAlpha = 0.9;
        g.fillStyle = '#c0583a';
        g.beginPath();
        g.ellipse(w * 0.62, h * 0.64, 24, 11, 0, 0, 7);
        g.fill();
      }
      if (b.name === 'Neptune') {
        g.globalAlpha = 0.7;
        g.fillStyle = '#26378a';
        g.beginPath();
        g.ellipse(w * 0.3, h * 0.62, 18, 9, 0, 0, 7);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  });
}

export function ringTex(faint) {
  return canvasTex(512, 8, (g, w) => {
    const R = rng(faint ? 7 : 3);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let a = faint ? 0.25 : 0.55 + R() * 0.35;
      if (!faint && u > 0.58 && u < 0.63) a = 0.05;
      if (faint && u % 0.25 > 0.06) a = 0.04;
      a *= Math.min(1, u * 8) * Math.min(1, (1 - u) * 10);
      const l = 180 + R() * 60;
      g.fillStyle = `rgba(${l | 0},${(l * 0.92) | 0},${(l * 0.78) | 0},${a})`;
      g.fillRect(x, 0, 1, 8);
    }
  });
}

export function ringGeo(inner, outer) {
  const geo = new THREE.RingGeometry(inner, outer, 128, 1),
    pos = geo.attributes.position,
    uv = geo.attributes.uv,
    v = V();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  return geo;
}

export function fresnelMat(color, power, strength) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPow: { value: power },
      uStr: { value: strength }
    },
    vertexShader:
      'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:
      'uniform vec3 uColor;uniform float uPow;uniform float uStr;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uPow);gl_FragColor=vec4(uColor*f*uStr,1.0);}',
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

export const additive = (map, color = new THREE.Color(0xffffff), opacity = 1) =>
  new THREE.SpriteMaterial({
    map,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

export function initTextures() {
  dotTex = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.4)');
}
