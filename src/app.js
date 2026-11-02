import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eph } from './engine/ephemeris.js';

export function start() {
const $ = s => document.querySelector(s);
const DEG = Math.PI / 180;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function showFatal(msg){ $('#splash-err').hidden = false; $('#splash-err').textContent = msg; $('#load-t').textContent = 'Unable to start'; $('#load-bar').style.width = '0'; }
{ let ok = false; try { const c = document.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) {}
  if (!ok){ showFatal('This device or browser has WebGL turned off, so the 3D view cannot run. Try a recent Chrome, Safari, Edge or Firefox.'); return; } }

/* ================= DATA ================= */
const PLANETS = [
  { name:'Mercury', key:'Mercury', r:.45, color:'#b4aca4', type:'rock', tex:['#8d8580','#b5aea6','#6f6a66'], pole:[281.0103,61.4155], rotH:1407.6,
    year:'88.0 days', day:'58.6 days', tilt:'0.03°', moonsN:'0', note:'Smallest planet and the fastest, sweeping its orbit in 88 days. Its orbit is the most eccentric of the eight.' },
  { name:'Venus', key:'Venus', map:'venus', r:1.05, color:'#e8b37a', type:'cloud', tex:['#e9c48f','#d9a066','#f3dcb0'], pole:[272.76,67.16], rotH:-5832.5,
    year:'224.7 days', day:'243 days, retrograde', tilt:'177.4°', moonsN:'0', note:'Spins backwards, so slowly that its day is longer than its year. Hottest surface in the solar system.' },
  { name:'Earth', key:'EMB', map:'earth', r:1.1, color:'#4f8fe8', type:'earth', pole:[0,90], rotH:23.934, atmo:'#5aa9ff',
    year:'365.26 days', day:'23.9 hours', tilt:'23.4°', moonsN:'1', note:'Its 23.4° tilt gives the seasons. The Moon is placed from the Astronomical Almanac series; its distance is drawn enlarged.' },
  { name:'Mars', key:'Mars', map:'mars', r:.62, color:'#d0603a', type:'rock', tex:['#b5502f','#d97a4f','#8a3a22'], pole:[317.269,54.433], rotH:24.6,
    year:'687.0 days', day:'24.6 hours', tilt:'25.2°', moonsN:'2', note:'Home to Olympus Mons. Phobos circles faster than Mars spins and is slowly spiralling inward.',
    moons:[{ name:'Phobos', map:'phobos', r:.12, d:1.3, P:.3187, L0:215.2, color:'#9b8b7c' },{ name:'Deimos', map:'deimos', r:.1, d:1.9, P:1.2625, L0:259.3, color:'#a89a8c' }] },
  { name:'Jupiter', key:'Jupiter', map:'jupiter', r:4.2, color:'#d8a46c', type:'gas', tex:['#e3c39b','#b9845a','#f1e0c5','#9c6a45'], pole:[268.057,64.495], rotH:9.9,
    year:'11.86 years', day:'9.9 hours', tilt:'3.1°', moonsN:'101 (IAU, Mar 2026)', note:'More than twice the mass of all other planets combined. Shown with Io, Europa, Ganymede and Callisto at their JPL phases.',
    moons:[{ name:'Io', map:'io', r:.3, d:6.0, P:1.762732, L0:20.0, color:'#e6d46a' },{ name:'Europa', map:'europa', r:.26, d:7.3, P:3.525463, L0:214.4, color:'#d8cbb4' },
           { name:'Ganymede', map:'ganymede', r:.42, d:9.0, P:7.155588, L0:221.6, color:'#a9a196' },{ name:'Callisto', map:'callisto', r:.38, d:10.9, P:16.69044, L0:80.3, color:'#7d7468' }] },
  { name:'Saturn', key:'Saturn', map:'saturn', r:3.6, color:'#e6cf94', type:'gas', tex:['#efdcae','#d2b67a','#f6ebcc','#b89c62'], pole:[40.589,83.537], rotH:10.7, rings:[4.6,8.6],
    year:'29.4 years', day:'10.7 hours', tilt:'26.7°', moonsN:'285 (IAU, Mar 2026)', note:'Its rings are mostly water ice. Titan, shown here, has a thick nitrogen atmosphere.',
    moons:[{ name:'Titan', map:'titan', r:.5, d:11, P:15.945, L0:0, color:'#e0a64a' }] },
  { name:'Uranus', key:'Uranus', r:2.2, color:'#9fdde4', type:'ice', tex:['#a9e3ea','#94d4dc','#b8eaef'], pole:[257.311,-15.175], rotH:-17.2, rings:[3.0,4.0], ringFaint:true,
    year:'83.7 years', day:'17.2 hours, retrograde', tilt:'97.8°', moonsN:'28', note:'Rolls around the Sun on its side. Watch its pole swing toward and away from the Sun over 84 years.' },
  { name:'Neptune', key:'Neptune', map:'neptune', r:2.1, color:'#4f6fe0', type:'ice', tex:['#5476e6','#3f5bc4','#6a8af0'], pole:[299.36,43.46], rotH:16.1,
    year:'163.7 years', day:'16.1 hours', tilt:'28.3°', moonsN:'16', note:'Found in 1846 from its pull on Uranus. It has completed only one orbit since then, in 2011.' }
];
const ORDER = ['Sun', ...PLANETS.map(p => p.name), 'Voyager 1'];
const COLORS = { Sun:'#ffb547', 'Voyager 1':'#ff6fa8' }; PLANETS.forEach(p => COLORS[p.name] = p.color);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RATES = [
  { d:1/86400, t:'Live (1 s/s)' }, { d:1/1440, t:'1 min / s' }, { d:1/24, t:'1 hour / s' }, { d:.25, t:'6 hours / s' }, { d:1, t:'1 day / s' },
  { d:7, t:'1 week / s' }, { d:30.4375, t:'1 month / s' }, { d:91.3125, t:'3 months / s' }, { d:365.25, t:'1 year / s' }, { d:3652.5, t:'10 years / s' }, { d:36525, t:'100 years / s' }
];
const ev = (y, m, d, h, mi) => Eph.calToJD(y, m, d + ((h || 0) + (mi || 0) / 60) / 24);
const EVENTS = [
  { jd:ev(-43,3,15,12), name:'Ides of March', sub:'The sky on the day Julius Caesar died', focus:'Earth' },
  { jd:ev(1610,1,7,18), name:'Galileo sees Jupiter\'s moons', sub:'First telescopic view of Io, Europa, Ganymede, Callisto', focus:'Jupiter' },
  { jd:ev(1781,3,13,22), name:'Herschel discovers Uranus', sub:'First planet found with a telescope', focus:'Uranus' },
  { jd:ev(1846,9,23,23), name:'Neptune found', sub:'Located by Galle from Le Verrier\'s prediction', focus:'Neptune' },
  { jd:ev(1969,7,20,20,17), name:'Apollo 11 lands', sub:'Eagle touches down in the Sea of Tranquility', focus:'Earth' },
  { jd:ev(1977,9,5,12,56), name:'Voyager 1 launches', sub:'Titan IIIE–Centaur, Cape Canaveral', focus:'Voyager 1' },
  { jd:ev(1979,3,5,12,4), name:'Voyager 1 at Jupiter', sub:'Closest approach 348,890 km from centre', focus:'Voyager 1' },
  { jd:ev(1980,11,12,23,46), name:'Voyager 1 at Saturn', sub:'Hours after a 6,490 km pass of Titan', focus:'Voyager 1' },
  { jd:ev(1990,2,14,5,22), name:'Pale Blue Dot', sub:'Earth photographed from 40.4 AU', focus:'Voyager 1' },
  { jd:ev(1998,2,17), name:'Most distant human object', sub:'Voyager 1 passes Pioneer 10 at 69.4 AU', focus:'Voyager 1' },
  { jd:ev(2004,12,16), name:'Termination shock', sub:'Solar wind drops below sound speed, 94 AU', focus:'Voyager 1' },
  { jd:ev(2012,8,25), name:'Interstellar space', sub:'Voyager 1 crosses the heliopause at 121.6 AU', focus:'Voyager 1' },
  { jd:ev(2020,12,21,18,20), name:'Great Conjunction', sub:'Jupiter and Saturn 0.1° apart from Earth', focus:'Jupiter' },
  { jd:ev(2026,11,18,10,16), name:'One light-day', sub:'Voyager 1 is 24 light-hours from Earth (time approximate)', focus:'Voyager 1' },
  { jd:ev(2032,11,13,8,54), name:'Transit of Mercury', sub:'Mercury crosses the face of the Sun', focus:'Mercury' },
  { jd:ev(2040,10,31,12), name:'Next Great Conjunction', sub:'Jupiter and Saturn meet again', focus:'Saturn' },
  { jd:ev(3000,6,21,12), name:'AD 3000', sub:'Edge of JPL\'s fitted range', focus:'Sun' }
];

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); $('#splash').classList.remove('gone'); showFatal('The graphics driver reset. Reload the page to continue.'); });
THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => { $('#load-bar').style.width = `${Math.round(loaded / total * 100)}%`; $('#load-t').textContent = `Loading NASA imagery · ${loaded} of ${total}`; };
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
$('#stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 20000);
camera.position.set(-420, 300, 460);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping:true, dampingFactor:.08, minDistance:2, maxDistance:6000, rotateSpeed:.6, zoomSpeed:.9, autoRotateSpeed:.5 });

/* ================= FRAMES & SCALE ================= */
const SCALES = { sqrt:{ f:r => 44 * Math.sqrt(r), size:1, sun:6.5 }, linear:{ f:r => 6 * r, size:.3, sun:2.2 } };
let SC = SCALES.sqrt;
const ecl = (p, out) => out.set(p.x, p.z, -p.y);                       // J2000 ecliptic (z = north) → scene (y up)
function toScene(p, out){ const r = Math.hypot(p.x, p.y, p.z), k = r > 0 ? SC.f(r) / r : 0; return out.set(p.x * k, p.z * k, -p.y * k); }
const V = () => new THREE.Vector3();
const APEX = ecl(Eph.SUN_APEX, V()).normalize(), NOSE = ecl(Eph.HELIO_NOSE, V()).normalize();
const GC = ecl(Eph.GAL.center, V()).normalize(), NGP = ecl(Eph.GAL.ngp, V()).normalize(), GROT = ecl(Eph.GAL.rotation, V()).normalize();
const galToScene = (l, b, out) => out.copy(GC).multiplyScalar(Math.cos(b) * Math.cos(l)).addScaledVector(GROT, Math.cos(b) * Math.sin(l)).addScaledVector(NGP, Math.sin(b));

/* ================= TEXTURES ================= */
function canvasTex(w, h, draw){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
function glowTex(inner, mid){ return canvasTex(128, 128, g => { const gr = g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0, inner); gr.addColorStop(.22, mid); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0,0,128,128); }); }
const dotTex = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.4)');
function blob(g, x, y, r, R){ g.beginPath(); for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2, rr = r * (.6 + R() * .6); const px = x + Math.cos(a) * rr * 1.4, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); }
function planetTex(b){
  return canvasTex(512, 256, (g, w, h) => {
    const R = rng(b.name.length * 977 + b.r * 100), P = b.tex || [], pick = () => P[Math.floor(R() * P.length)];
    if (b.type === 'earth'){
      g.fillStyle = '#1d4b98'; g.fillRect(0,0,w,h);
      for (let i = 0; i < 48; i++){ g.globalAlpha = .9; g.fillStyle = R() < .5 ? '#3d7a37' : '#78924a'; blob(g, R()*w, h*.18 + R()*h*.64, 8 + R()*30, R); }
      g.globalAlpha = .95; g.fillStyle = '#eef3fa'; g.fillRect(0,0,w,h*.07); g.fillRect(0,h*.93,w,h*.07);
      g.globalAlpha = .3; for (let i = 0; i < 110; i++){ g.fillStyle = '#fff'; g.fillRect(R()*w, R()*h, 20 + R()*80, 2 + R()*4); }
    } else if (b.type === 'rock'){
      g.fillStyle = P[0]; g.fillRect(0,0,w,h);
      for (let i = 0; i < 600; i++){ g.globalAlpha = .12 + R()*.35; g.fillStyle = pick(); g.beginPath(); g.arc(R()*w, R()*h, 1 + R()*(i < 50 ? 16 : 4), 0, 7); g.fill(); }
      if (b.name === 'Mars'){ g.globalAlpha = .9; g.fillStyle = '#f3ece4'; g.fillRect(0,0,w,h*.05); g.fillRect(0,h*.96,w,h*.04); }
    } else {
      let y = 0; const gas = b.type === 'gas';
      while (y < h){ const bh = gas ? 3 + R()*16 : 12 + R()*40; g.globalAlpha = gas ? .95 : .7; g.fillStyle = pick(); g.fillRect(0, y, w, bh + 1); y += bh; }
      for (let i = 0; i < (gas ? 320 : 60); i++){ g.globalAlpha = .06 + R()*.12; g.fillStyle = pick(); g.fillRect(R()*w, R()*h, 30 + R()*180, 1 + R()*3); }
      if (b.name === 'Jupiter'){ g.globalAlpha = .9; g.fillStyle = '#c0583a'; g.beginPath(); g.ellipse(w*.62, h*.64, 24, 11, 0, 0, 7); g.fill(); }
      if (b.name === 'Neptune'){ g.globalAlpha = .7; g.fillStyle = '#26378a'; g.beginPath(); g.ellipse(w*.3, h*.62, 18, 9, 0, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  });
}
function ringTex(faint){
  return canvasTex(512, 8, (g, w) => {
    const R = rng(faint ? 7 : 3);
    for (let x = 0; x < w; x++){
      const u = x / w; let a = faint ? .25 : .55 + R()*.35;
      if (!faint && u > .58 && u < .63) a = .05;
      if (faint && (u % .25) > .06) a = .04;
      a *= Math.min(1, u * 8) * Math.min(1, (1 - u) * 10);
      const l = 180 + R()*60; g.fillStyle = `rgba(${l|0},${l*.92|0},${l*.78|0},${a})`; g.fillRect(x, 0, 1, 8);
    }
  });
}
function ringGeo(inner, outer){
  const geo = new THREE.RingGeometry(inner, outer, 128, 1), pos = geo.attributes.position, uv = geo.attributes.uv, v = V();
  for (let i = 0; i < pos.count; i++){ v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - inner) / (outer - inner), .5); }
  return geo;
}
function fresnelMat(color, power, strength){
  return new THREE.ShaderMaterial({
    uniforms:{ uColor:{ value:new THREE.Color(color) }, uPow:{ value:power }, uStr:{ value:strength } },
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 uColor;uniform float uPow;uniform float uStr;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uPow);gl_FragColor=vec4(uColor*f*uStr,1.0);}',
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide
  });
}
const additive = (map, color = new THREE.Color(0xffffff), opacity = 1) => new THREE.SpriteMaterial({ map, color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false });

/* ================= SKY (true galactic orientation, follows camera) ================= */
const sky = new THREE.Group(); scene.add(sky);
function starLayer(count, size, seed, bandShare){
  const R = rng(seed), pos = new Float32Array(count*3), col = new Float32Array(count*3), c = new THREE.Color(), v = V(), rad = 9000;
  for (let i = 0; i < count; i++){
    if (R() < bandShare){ const l = R()*Math.PI*2, core = Math.pow(Math.max(0, Math.cos(l)), 3); galToScene(l, (R()+R()+R()-1.5) * (.12 + core*.18), v); }
    else { const u = R()*2-1, th = R()*Math.PI*2, s = Math.sqrt(1-u*u); v.set(s*Math.cos(th), u, s*Math.sin(th)); }
    v.multiplyScalar(rad); pos.set([v.x, v.y, v.z], i*3);
    const t = R(); c.setHSL(t < .18 ? .6 : t < .32 ? .09 : .62, t < .32 ? .6 : .12, .62 + R()*.3); col.set([c.r, c.g, c.b], i*3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3)); geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  sky.add(new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation:false, vertexColors:true, map:dotTex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending })));
}
starLayer(11000, 1.6 * renderer.getPixelRatio(), 11, .66);
starLayer(700, 3.2 * renderer.getPixelRatio(), 23, .4);
{ const R = rng(5), haze = glowTex('rgba(255,255,255,.55)', 'rgba(255,255,255,.18)'), v = V();
  for (let i = 0; i < 34; i++){
    const l = R()*Math.PI*2, core = Math.pow(Math.max(0, Math.cos(l)), 2);
    const s = new THREE.Sprite(additive(haze, new THREE.Color().setHSL(.62 - core*.53 + R()*.04, .45, .16 + core*.14), .4 + core*.45));
    galToScene(l, (R()-.5)*.05, v).multiplyScalar(8600); s.position.copy(v); s.scale.setScalar(2400 + R()*1800 + core*2600); sky.add(s);
  }
}

/* Real sky: NASA Tycho star-catalogue map (equatorial, RA 0h at centre, RA increasing to the left) */
const texLoader = new THREE.TextureLoader();
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(9500, 64, 32), new THREE.ShaderMaterial({
  uniforms:{ uMap:{ value:null }, uGain:{ value:1.9 } },
  vertexShader:'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:`uniform sampler2D uMap; uniform float uGain; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); vec3 e = vec3(d.x, -d.z, d.y); float ce = 0.9174820, se = 0.3977772;
      vec3 q = vec3(e.x, ce * e.y - se * e.z, se * e.y + ce * e.z);
      float ra = atan(q.y, q.x), dec = asin(clamp(q.z, -1.0, 1.0));
      vec3 c = texture2D(uMap, vec2(fract(0.5 - ra / 6.2831853), 0.5 + dec / 3.14159265)).rgb;
      c = max(c - vec3(0.045), 0.0) * uGain; gl_FragColor = vec4(c, 1.0); }`,
  side:THREE.BackSide, depthWrite:false, depthTest:false }));
skyMesh.renderOrder = -10; skyMesh.visible = false; sky.add(skyMesh);
texLoader.load('tex/sky.jpg', t => { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; skyMesh.material.uniforms.uMap.value = t; skyMesh.visible = true;
  sky.children.forEach(c => { if (c !== skyMesh) c.visible = false; }); }, undefined, () => {});
function loadMap(mat, name){ if (!name) return; texLoader.load(`tex/${name}.jpg`, t => { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; }, undefined, () => {}); }

/* ================= SUN, HELIOSPHERE, GUIDES ================= */
const sunGroup = new THREE.Group(); scene.add(sunGroup);
const sunPos = V();
const sunBody = new THREE.Group(); sunGroup.add(sunBody);
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshBasicMaterial({ map: canvasTex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#ffcf6a'); gr.addColorStop(.5,'#ffe7a8'); gr.addColorStop(1,'#ffcf6a'); g.fillStyle = gr; g.fillRect(0,0,w,h);
  const R = rng(99); for (let i = 0; i < 2600; i++){ g.globalAlpha = .1 + R()*.2; g.fillStyle = R() < .5 ? '#ff9a2e' : '#fff3c4'; g.beginPath(); g.arc(R()*w, R()*h, .8 + R()*2.4, 0, 7); g.fill(); }
}) }));
sunMesh.userData.body = 'Sun'; sunBody.add(sunMesh);
{ const p = Eph.eqToEcl(286.13, 63.87); sunBody.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), ecl(p, V()).normalize()); }
const glowA = new THREE.Sprite(additive(glowTex('rgba(255,240,200,1)','rgba(255,170,60,.55)'))); sunGroup.add(glowA);
const glowB = new THREE.Sprite(additive(glowTex('rgba(255,190,110,.6)','rgba(255,120,40,.12)'), undefined, .8)); sunGroup.add(glowB);
sunGroup.add(new THREE.PointLight(0xfff1dc, 2.4, 0, 0));
scene.add(new THREE.AmbientLight(0x404a70, .3));

// Heliosphere: nose toward the interstellar inflow direction (local +X), tail streams away
const helio = new THREE.Group(); sunGroup.add(helio);
helio.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), NOSE);
const hpBell = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 40, 0, Math.PI*2, 0, Math.PI*.62), fresnelMat('#5fc4ff', 2.6, .55)); hpBell.rotation.z = -Math.PI/2; helio.add(hpBell);
const tsShell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), fresnelMat('#8f7dff', 3.5, .22)); helio.add(tsShell);
const TAIL = 900, tailGeo = new THREE.BufferGeometry(), tailPos = new Float32Array(TAIL*3), tailCol = new Float32Array(TAIL*3), tailSeed = [];
{ const R = rng(42); for (let i = 0; i < TAIL; i++) tailSeed.push({ a:R()*Math.PI*2, rf:.75 + R()*.4, u:R(), v:.06 + R()*.08 }); }
tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos,3)); tailGeo.setAttribute('color', new THREE.BufferAttribute(tailCol,3));
const tail = new THREE.Points(tailGeo, new THREE.PointsMaterial({ size:3, map:dotTex, vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
tail.frustumCulled = false; helio.add(tail);

const guides = new THREE.Group(); sunGroup.add(guides);
const GUIDE_DEFS = [
  { dir:APEX, color:0xffb547, text:'Sun\'s motion · 251.9 km/s' },
  { dir:GC, color:0xffd27a, text:'Galactic centre · 8.3 kpc' },
  { dir:NOSE, color:0x7fd4ff, text:'Interstellar wind arrives' }
];
const guideObjs = GUIDE_DEFS.map(g => { const a = new THREE.ArrowHelper(g.dir, new THREE.Vector3(), 1, g.color); a.line.material.transparent = true; a.line.material.opacity = .55; guides.add(a); return { ...g, arrow:a }; });

/* ================= PLANETS ================= */
const bodies = {}; const pickables = [sunMesh];
PLANETS.forEach(b => {
  const holder = new THREE.Group(); sunGroup.add(holder);
  const tiltG = new THREE.Group(); holder.add(tiltG);
  tiltG.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), ecl(Eph.eqToEcl(b.pole[0], b.pole[1]), V()).normalize());
  if (b.name === 'Earth'){ // full equatorial frame: local X → vernal equinox, so sidereal time sets the real orientation
    const c = Math.cos(Eph.OBLIQ * DEG), sn = Math.sin(Eph.OBLIQ * DEG);
    tiltG.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0), new THREE.Vector3(0,c,-sn), new THREE.Vector3(0,sn,c))); }
  const spinner = new THREE.Group(); tiltG.add(spinner);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 48, 32), new THREE.MeshStandardMaterial({ map:planetTex(b), roughness:.85, metalness:0 }));
  mesh.userData.body = b.name; spinner.add(mesh); pickables.push(mesh); loadMap(mesh.material, b.map);
  if (b.name === 'Venus') spinner.add(new THREE.Mesh(new THREE.SphereGeometry(b.r * 1.035, 48, 32), new THREE.MeshStandardMaterial({ color:0xead3a0, roughness:1, transparent:true, opacity:.62, depthWrite:false })));
  if (b.atmo) tiltG.add(new THREE.Mesh(new THREE.SphereGeometry(b.r*1.12, 48, 32), fresnelMat(b.atmo, 3, 1.1)));
  if (b.type === 'cloud') tiltG.add(new THREE.Mesh(new THREE.SphereGeometry(b.r*1.08, 48, 32), fresnelMat('#ffd9a0', 2.5, .6)));
  if (b.rings){ const ring = new THREE.Mesh(ringGeo(b.rings[0], b.rings[1]), new THREE.MeshLambertMaterial({ map:ringTex(b.ringFaint), transparent:true, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x = -Math.PI/2; tiltG.add(ring); }
  const moons = (b.moons || []).map(m => { const mm = new THREE.Mesh(new THREE.SphereGeometry(m.r, 32, 20), new THREE.MeshStandardMaterial({ color:m.color, roughness:.9 })); loadMap(mm.material, m.map); tiltG.add(mm); return { ...m, mesh:mm }; });
  const orbitGeo = new THREE.BufferGeometry(); orbitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(257*3), 3));
  const orbit = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color:b.color, transparent:true, opacity:.24, depthWrite:false })); orbit.frustumCulled = false; sunGroup.add(orbit);
  bodies[b.name] = { data:b, holder, tiltG, spinner, mesh, moons, orbit, orbitJD:null, au:{x:0,y:0,z:0}, spinFree:0 };
});
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(.32, 24, 16), new THREE.MeshStandardMaterial({ color:0xcfcfcf, roughness:.95 }));
bodies.Earth.holder.add(moonMesh);
const moonGeoAU = { x:0, y:0, z:0 };

/* ================= VOYAGER 1 ================= */
const voyager = new THREE.Group(); scene.add(voyager);
{
  const white = new THREE.MeshStandardMaterial({ color:0xe9e9ef, roughness:.4, metalness:.3 });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 24, 10, 0, Math.PI*2, 0, Math.PI*.32), white); dish.rotation.x = Math.PI/2; voyager.add(dish);
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .6, 10), new THREE.MeshStandardMaterial({ color:0x9a8f7a, roughness:.6, metalness:.5 })); bus.rotation.x = Math.PI/2; bus.position.z = -.7; voyager.add(bus);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 7, 6), white); boom.rotation.z = Math.PI/2; boom.position.set(1.5, 0, -.8); voyager.add(boom);
  const beacon = new THREE.Sprite(additive(dotTex, new THREE.Color('#ff6fa8'))); beacon.scale.setScalar(9); voyager.add(beacon); voyager.userData.beacon = beacon;
  const hit = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 6), new THREE.MeshBasicMaterial({ visible:false })); hit.userData.body = 'Voyager 1'; voyager.add(hit); pickables.push(hit);
}
const voyAU = { x:0, y:0, z:0 }; let voyVisible = false;
// Precomputed path, launch → 2200, drawn in the Sun's frame: past bright, future dim
const VOY_STEP = 15, VOY_END = Eph.calToJD(2200, 1, 1), VOY_N = Math.ceil((VOY_END - Eph.VOY_EVENTS.launch) / VOY_STEP) + 1;
const voyPathAU = new Float32Array(VOY_N * 3);
{ const p = { x:0, y:0, z:0 }; for (let i = 0; i < VOY_N; i++){ Eph.voyager(Math.min(Eph.VOY_EVENTS.launch + i * VOY_STEP + 1e-6, VOY_END), p); voyPathAU.set([p.x, p.y, p.z], i*3); } }
const voyPathGeo = new THREE.BufferGeometry(); voyPathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(VOY_N*3), 3));
const voyFutureGeo = new THREE.BufferGeometry(); voyFutureGeo.setAttribute('position', voyPathGeo.attributes.position);
const voyPast = new THREE.Line(voyPathGeo, new THREE.LineBasicMaterial({ color:0xff6fa8, transparent:true, opacity:.75, depthWrite:false }));
const voyFuture = new THREE.Line(voyFutureGeo, new THREE.LineDashedMaterial({ color:0xff6fa8, transparent:true, opacity:.3, dashSize:4, gapSize:4, depthWrite:false }));
voyPast.frustumCulled = voyFuture.frustumCulled = false; sunGroup.add(voyPast, voyFuture);
function rebuildVoyPath(){
  const arr = voyPathGeo.attributes.position.array, p = { x:0, y:0, z:0 }, v = V();
  for (let i = 0; i < VOY_N; i++){ p.x = voyPathAU[i*3]; p.y = voyPathAU[i*3+1]; p.z = voyPathAU[i*3+2]; toScene(p, v); arr[i*3] = v.x; arr[i*3+1] = v.y; arr[i*3+2] = v.z; }
  voyPathGeo.attributes.position.needsUpdate = true; voyFuture.computeLineDistances();
}

/* ================= DUST & GALACTIC PLANE ================= */
const DUST = 1400, dustSpan = 1600, dustGeo = new THREE.BufferGeometry(), dustPos = new Float32Array(DUST*3);
{ const R = rng(77); for (let i = 0; i < DUST*3; i++) dustPos[i] = (R()-.5) * dustSpan; }
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos,3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size:1.6, map:dotTex, color:0x8fb8ff, transparent:true, opacity:.45, depthWrite:false, blending:THREE.AdditiveBlending }));
dust.frustumCulled = false; scene.add(dust);
const grid = new THREE.GridHelper(3000, 30, 0x4060a0, 0x22304f); grid.material.transparent = true; grid.material.opacity = .22;
grid.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), NGP); grid.visible = false; scene.add(grid);

/* ================= WAKES ================= */
const MAXT = 2000;
function makeTrail(color, gain){
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXT*3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXT*3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  line.frustumCulled = false; scene.add(line);
  return { line, geo, ring:new Float32Array(MAXT*3), head:-1, count:0, color:new THREE.Color(color), gain };
}
const trails = {}; PLANETS.forEach(p => trails[p.name] = makeTrail(p.color, .85)); trails.Sun = makeTrail('#ffb547', .7); trails['Voyager 1'] = makeTrail('#ff6fa8', .9);
function pushTrail(t, v){ t.head = (t.head + 1) % MAXT; t.ring[t.head*3] = v.x; t.ring[t.head*3+1] = v.y; t.ring[t.head*3+2] = v.z; if (t.count < MAXT) t.count++; }
function drawTrail(t){
  const n = Math.min(t.count, S.wake), pos = t.geo.attributes.position.array, col = t.geo.attributes.color.array;
  for (let i = 0; i < n; i++){
    const k = ((t.head - i) % MAXT + MAXT) % MAXT, f = Math.pow(1 - i/n, 1.7) * t.gain;
    pos[i*3] = t.ring[k*3]; pos[i*3+1] = t.ring[k*3+1]; pos[i*3+2] = t.ring[k*3+2];
    col[i*3] = t.color.r*f; col[i*3+1] = t.color.g*f; col[i*3+2] = t.color.b*f;
  }
  t.geo.setDrawRange(0, n); t.geo.attributes.position.needsUpdate = true; t.geo.attributes.color.needsUpdate = true;
}
const drawAllTrails = () => { for (const k in trails) drawTrail(trails[k]); };
function clearTrails(){ for (const k in trails){ trails[k].count = 0; trails[k].head = -1; trails[k].geo.setDrawRange(0, 0); } S.lastSample = null; }

/* ================= STATE ================= */
const S = { jd:Eph.nowJD(), rate:4, rateCur:1, dir:1, playing:true, frame:'galactic', scale:'sqrt', drift:120, wake:600, anchorJD:null,
            labels:true, trails:true, moons:true, sound:false, view:'overview', tour:false, travel:null, lastSample:null, scrubbing:false };
S.anchorJD = S.jd;

/* ================= SCALE APPLY ================= */
function applyScale(){
  SC = SCALES[S.scale];
  sunMesh.scale.setScalar(SC.sun); glowA.scale.setScalar(SC.sun * 7.4); glowB.scale.setScalar(SC.sun * 26);
  for (const n in bodies){ const b = bodies[n]; b.tiltG.scale.setScalar(SC.size); b.orbitJD = null; }
  moonMesh.scale.setScalar(SC.size);
  const hp = SC.f(121.6), ts = SC.f(94);
  hpBell.scale.setScalar(hp); tsShell.scale.setScalar(ts); helio.userData.hp = hp;
  tail.material.size = S.scale === 'sqrt' ? 3 : 5;
  guideObjs.forEach(g => g.arrow.setLength(SC.f(60), SC.f(60) * .08, SC.f(60) * .04));
  rebuildVoyPath(); clearTrails();
}

/* ================= TIME HELPERS ================= */
const clampJD = jd => Math.min(Eph.MAX_JD, Math.max(Eph.MIN_JD, jd));
const pad = n => String(n).padStart(2, '0');
function yearLabel(y){ return y <= 0 ? `${1 - y} BC` : (y < 1000 ? `AD ${y}` : String(y)); }
function fmtDate(jd){ const c = Eph.jdToCal(jd); return { c, date:`${c.day} ${MONTHS[c.month-1]} ${yearLabel(c.year)}`, time:`${pad(c.h)}:${pad(c.min)}:${pad(c.s)} UTC` }; }
function fmtShort(jd){ const c = Eph.jdToCal(jd); return c.year < 1 ? `${1 - c.year} BC` : `${c.year}-${pad(c.month)}-${pad(c.day)}`; }
function travelTo(jd, after){
  jd = clampJD(jd); clearTrails();
  const span = Math.abs(jd - S.jd);
  if (span < 1e-4 || reduceMotion){ S.jd = jd; S.anchorJD = jd; after && after(); return; }
  S.travel = { from:S.jd, to:jd, t:0, dur: Math.min(2.6, .9 + Math.log10(1 + span / 30) * .45), after };
  $('#warp').classList.add('on');
}

/* Timeline mapping: piecewise so the modern era gets room */
const TL = [[-2999,0],[1500,.38],[1800,.52],[2050,.86],[3000,1]];
function yearToPos(y){ for (let i = 0; i < TL.length - 1; i++){ const [y0,p0] = TL[i], [y1,p1] = TL[i+1]; if (y <= y1 || i === TL.length - 2) return Math.min(1, Math.max(0, p0 + (p1 - p0) * (y - y0) / (y1 - y0))); } return 1; }
function posToYear(p){ for (let i = 0; i < TL.length - 1; i++){ const [y0,p0] = TL[i], [y1,p1] = TL[i+1]; if (p <= p1) return y0 + (y1 - y0) * (p - p0) / (p1 - p0); } return 3000; }
const jdToPos = jd => yearToPos(Eph.yearOf(jd)), posToJD = p => Eph.J2000 + (posToYear(p) - 2000) * 365.25;
{
  const pct = jd => (jdToPos(jd) * 100).toFixed(2) + '%';
  $('#band-t1').style.left = pct(Eph.T1_START); $('#band-t1').style.width = `calc(${pct(Eph.T1_END)} - ${pct(Eph.T1_START)})`;
  $('#band-voy').style.left = pct(Eph.VOY_EVENTS.launch); $('#band-voy').style.right = '0';
  const ticks = [[-2999,'3000 BC'],[1,'AD 1',1],[1500,'1500',1],[1800,'1800'],[1977,'1977',1],[2050,'2050'],[3000,'3000']];
  $('#ticks').innerHTML = ticks.map(([y, t, opt]) => `<span${opt ? ' class="opt"' : ''} style="left:${(yearToPos(y)*100).toFixed(2)}%">${t}</span>`).join('');
}

/* ================= CAMERA ================= */
let idleT = 0;
let focus = 'Sun', wantDist = 0, wantDir = null, transT = 1, tourT = 0;
const prevFocus = V(), fp = V(), tmp = V(), tmp2 = V(), sv = V();
function focusPos(name, out){
  if (name === 'Sun') return out.copy(sunPos);
  if (name === 'Voyager 1') return out.copy(voyager.position);
  if (name === 'Moon') return moonMesh.getWorldPosition(out);
  return bodies[name].mesh.getWorldPosition(out);
}
function defaultDist(name){ if (name === 'Sun') return SC.f(32) * 2.6; if (name === 'Voyager 1') return 45; return (bodies[name].data.r * 7 + 14) * Math.max(SC.size, .5); }
function setFocus(name, opts = {}){
  if (!ORDER.includes(name)) return;
  focus = name; scene.updateMatrixWorld(); focusPos(name, prevFocus);
  wantDist = opts.dist ?? defaultDist(name); wantDir = opts.dir ? opts.dir.clone().normalize() : null; transT = 1;
  // Arc flight: ease out, rise and pull back mid-way so the move reads as travel, then settle in
  FL.fT.copy(controls.target); FL.fD = Math.max(.5, camera.position.distanceTo(controls.target)); FL.fDir.subVectors(camera.position, controls.target).normalize();
  FL.tD = wantDist; FL.tDir = wantDir; const sep = prevFocus.distanceTo(controls.target);
  FL.hop = Math.min(2.2, sep / (FL.fD + FL.tD) * .45);
  FL.dur = reduceMotion ? .01 : Math.min(3.8, 1.2 + Math.log10(1 + sep / Math.max(1, Math.min(FL.fD, FL.tD))) * .95); FL.t = 0; FL.on = true;
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.body === name)));
  for (const k in labelEls) labelEls[k].el.classList.toggle('on', k === name);
  const chip = document.querySelector(`.chip[data-body="${CSS.escape(name)}"]`); chip && chip.scrollIntoView({ block:'nearest', inline:'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  renderInfo();
}
const FL = { on:false, t:0, dur:1, fT:new THREE.Vector3(), fD:1, fDir:new THREE.Vector3(), tD:1, tDir:null, hop:0 };
controls.addEventListener('start', () => { transT = 1; FL.on = false; if (S.tour) setView(null); });
const VIEWS = {
  overview: () => ({ dir:new THREE.Vector3(-.62, .55, .58), dist:SC.f(32) * 2.6 }),
  top:      () => ({ dir:new THREE.Vector3(0, 1, .002), dist:SC.f(32) * 2.7 }),
  edge:     () => ({ dir:new THREE.Vector3(.02, .05, 1), dist:SC.f(32) * 2.6 }),
  chase:    () => ({ dir:APEX.clone().negate().add(NGP.clone().multiplyScalar(.35)), dist:SC.f(32) * 2.2 }),
  galaxy:   () => ({ dir:NGP.clone().multiplyScalar(.25).add(GC.clone().negate()), dist:SC.f(32) * 3.2 }),
  cine:     () => ({})
};
const VIEW_ORDER = Object.keys(VIEWS);
function setView(v){
  if (v === 'cine'){ startCine(); return; }
  S.view = v; S.tour = v === 'tour'; controls.autoRotate = S.tour && !reduceMotion; tourT = 0;
  document.querySelectorAll('.view').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  if (v) setFocus('Sun', VIEWS[v]());
}

/* ================= UI: chips, labels ================= */
const bar = $('#bar'), labelsLayer = $('#labels'), labelEls = {};
ORDER.forEach((name, i) => {
  const color = COLORS[name];
  const chip = document.createElement('button'); chip.className = 'chip'; chip.dataset.body = name; chip.setAttribute('aria-pressed', String(i === 0));
  chip.innerHTML = `<i style="background:${color};box-shadow:0 0 8px ${color}"></i>${name}<kbd>${i}</kbd>`;
  chip.addEventListener('click', () => setFocus(name)); bar.appendChild(chip);
  const el = document.createElement('div'); el.className = 'lbl' + (i === 0 ? ' on' : ''); el.innerHTML = `<i style="background:${color}"></i>${name}`;
  el.addEventListener('click', () => setFocus(name)); labelsLayer.appendChild(el);
  labelEls[name] = { el };
});
const subLabels = [{ name:'Moon', get:o => moonMesh.getWorldPosition(o), show:() => moonMesh.visible }];
subLabels.forEach(s => { s.el = document.createElement('div'); s.el.className = 'lbl sub'; s.el.textContent = s.name; labelsLayer.appendChild(s.el); });
guideObjs.forEach(g => { g.el = document.createElement('div'); g.el.className = 'lbl guide'; g.el.style.color = '#' + g.color.toString(16).padStart(6, '0'); g.el.textContent = g.text; labelsLayer.appendChild(g.el); });
const heliLabels = [{ text:'Heliopause · 121.6 AU', r:() => helio.userData.hp, dir:NOSE }];
heliLabels.forEach(h => { h.el = document.createElement('div'); h.el.className = 'lbl guide'; h.el.style.color = '#5fc4ff'; h.el.textContent = h.text; labelsLayer.appendChild(h.el); });

/* ================= INFO CARD ================= */
const AU_LT_S = 499.004784;
const fmtAU = au => au < 0.1 ? `${(au * Eph.AU_KM / 1e6).toFixed(2)} M km` : `${au.toFixed(au < 10 ? 3 : 2)} AU`;
function fmtLT(au){ const s = au * AU_LT_S; if (s < 3600) return `${(s / 60).toFixed(1)} light-min`; return `${(s / 3600).toFixed(2)} light-hours`; }
function lonLat(p){ const r = Math.hypot(p.x, p.y, p.z); return `${((Math.atan2(p.y, p.x) / DEG + 360) % 360).toFixed(2)}°, ${(Math.asin(p.z / r) / DEG >= 0 ? '+' : '')}${(Math.asin(p.z / r) / DEG).toFixed(2)}°`; }
const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
let infoStatic = '';
function renderInfo(){
  $('#in-tel').hidden = true;
  const name = focus, color = COLORS[name];
  $('#in-name').textContent = name; $('#in-sw').style.background = color; $('#in-sw').style.color = color;
  let kind, note;
  if (name === 'Sun'){ kind = 'G2V star'; note = 'Carries every planet around the Milky Way at about 251.9 km/s. In the galactic frame the wakes show the true direction of that motion, 60° from the ecliptic.'; }
  else if (name === 'Voyager 1'){ kind = 'Probe'; note = 'Position from JPL Horizons. Before 1981 JPL rates the trajectory as rough; after 2030 it continues in a straight line at 16.9 km/s.'; }
  else { const d = bodies[name].data; kind = 'Planet ' + (PLANETS.indexOf(d) + 1); note = d.note; }
  $('#in-kind').textContent = kind; $('#in-note').textContent = note;
  infoStatic = name; updateInfoLive(true);
}
function stat(k, v, live){ return `<div><dt>${k}</dt><dd${live ? ' class="live"' : ''}>${v}</dd></div>`; }
function updateInfoLive(){
  const name = focus, E = bodies.Earth.au; let html = '', status = '';
  if (name === 'Sun'){
    const r = Math.hypot(E.x, E.y, E.z);
    html = stat('From Earth', fmtAU(r), 1) + stat('Light time', fmtLT(r), 1) + stat('Galactic speed', '251.9 km/s') + stat('Heading (ecliptic)', '341.5°, +60.9°')
         + stat('To galactic centre', '8.275 kpc') + stat('Above galactic plane', '20.8 pc');
  } else if (name === 'Voyager 1'){
    const L = Eph.VOY_EVENTS;
    if (!voyVisible){ const days = L.launch - S.jd; status = `● LAUNCHES 5 SEP 1977 · ${days > 365.25 ? (days / 365.25).toFixed(1) + ' YEARS' : days.toFixed(0) + ' DAYS'} AWAY`;
      html = stat('Launch', '1977-09-05 12:56 UTC') + stat('Asymptotic speed', '16.9 km/s'); }
    else {
      const r = Math.hypot(voyAU.x, voyAU.y, voyAU.z), re = dist3(voyAU, E);
      status = S.jd < L.jupiter ? '● CRUISE TO JUPITER' : S.jd < L.saturn ? '● CRUISE TO SATURN' : S.jd < L.ts ? '● OUTBOUND IN THE SOLAR WIND' : S.jd < L.hp ? '● HELIOSHEATH, PAST THE TERMINATION SHOCK' : '● INTERSTELLAR SPACE';
      if (S.jd > L.extrap) status += ' · EXTRAPOLATED';
      html = stat('From Sun', fmtAU(r), 1) + stat('From Earth', fmtAU(re), 1) + stat('Signal time', fmtLT(re), 1) + stat('Helio λ, β', lonLat(voyAU), 1)
           + stat('Mission time', `${((S.jd - L.launch) / 365.25).toFixed(2)} yr`, 1) + stat('Launched', '5 Sep 1977');
    }
  } else {
    const b = bodies[name], d = b.data, p = b.au, r = Math.hypot(p.x, p.y, p.z);
    const first = name === 'Earth'
      ? stat('From Sun', fmtAU(r), 1) + stat('Moon distance', `${Math.round(Math.hypot(moonGeoAU.x, moonGeoAU.y, moonGeoAU.z) * Eph.AU_KM).toLocaleString('en-GB')} km`, 1)
      : stat('From Sun', fmtAU(r), 1) + stat('From Earth', `${fmtAU(dist3(p, E))} · ${fmtLT(dist3(p, E))}`, 1);
    html = first + stat('Helio λ, β (J2000)', lonLat(p), 1) + stat('Year', d.year) + stat('Day', d.day) + stat('Axial tilt', d.tilt) + (d.moonsN !== '0' ? stat('Known moons', d.moonsN) : stat('Known moons', 'None'));
  }
  $('#in-stats').innerHTML = html;
  $('#in-status').hidden = !status; $('#in-status').textContent = status;
}
$('#in-min').addEventListener('click', e => { const min = $('#info').classList.toggle('min'); e.currentTarget.textContent = min ? '+' : '–'; e.currentTarget.setAttribute('aria-label', min ? 'Expand details' : 'Collapse details'); });
if (innerWidth < 720){ $('#info').classList.add('min'); $('#in-min').textContent = '+'; }

const toastEl = $('#toast'); let toastTimer;
function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800); }

/* ================= TIME UI ================= */
const PLAY_ICON = '<path d="M4 2.5v11l9-5.5z"/>', PAUSE_ICON = '<rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/>';
function setPlaying(p){ S.playing = p; $('#i-play').innerHTML = $('#i-play2').innerHTML = p ? PAUSE_ICON : PLAY_ICON; $('#m-play').setAttribute('aria-label', p ? 'Pause' : 'Play'); $('#b-play').setAttribute('aria-label', p ? 'Pause' : 'Play'); }
function setRate(i){ S.rate = Math.max(0, Math.min(RATES.length - 1, i)); renderRate(); if (!CINE_ON()) savePrefs(); }
const CINE_ON = () => typeof CINE !== 'undefined' && CINE.on;
function savePrefs(){ try { localStorage.setItem('hv-prefs', JSON.stringify({ rate:S.rate, frame:S.frame, scale:S.scale, labels:S.labels })); } catch (e) {} }
function renderRate(){ $('#o-rate').textContent = $('#m-rate').textContent = (S.dir < 0 ? '−' : '') + RATES[S.rate].t; $('#b-rev').setAttribute('aria-pressed', String(S.dir < 0)); }
function setDir(d){ S.dir = d; renderRate(); clearTrails(); }
$('#b-play').addEventListener('click', () => setPlaying(!S.playing));
$('#b-slower').addEventListener('click', () => setRate(S.rate - 1));
$('#b-faster').addEventListener('click', () => setRate(S.rate + 1));
$('#b-rev').addEventListener('click', () => setDir(-S.dir));
function step(days){ S.jd = clampJD(S.jd + days); S.lastSample = null; }
$('#b-back').addEventListener('click', () => step(-stepSize()));
$('#b-fwd').addEventListener('click', () => step(stepSize()));
const stepSize = () => Math.max(1 / 24, Math.min(365.25, RATES[S.rate].d));
$('#b-now').addEventListener('click', goNow);
function goNow(){ travelTo(Eph.nowJD(), () => { setRate(0); setDir(1); setPlaying(true); toast('Back to the present, running in real time'); }); }

const tl = $('#tl');
tl.addEventListener('pointerdown', () => { S.scrubbing = true; clearTrails(); });
tl.addEventListener('input', () => { S.travel = null; S.jd = clampJD(posToJD(tl.value / 10000)); S.anchorJD = S.jd; clearTrails(); });
const endScrub = () => { S.scrubbing = false; };
tl.addEventListener('pointerup', endScrub); tl.addEventListener('change', endScrub); tl.addEventListener('blur', endScrub);

// Jump popover
const pop = $('#pop');
function setPop(open){ pop.hidden = !open; $('#b-jump').setAttribute('aria-expanded', String(open)); if (open){ renderEvents(); if (innerWidth > 720) setTimeout(() => $('#i-date').focus(), 0); } }
$('#b-jump').addEventListener('click', e => { e.stopPropagation(); setPop(pop.hidden); });
document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && !$('#b-jump').contains(e.target)) setPop(false); });
function renderEvents(){
  const now = Eph.nowJD(), up = EVENTS.find(e => e.jd > now);
  let html = '';
  if (up){ const d = up.jd - now, when = d < 1 ? 'today' : d < 60 ? `in ${Math.ceil(d)} days` : d < 730 ? `in ${Math.round(d / 30.44)} months` : `in ${Math.round(d / 365.25)} years`;
    html += `<div class="evh">Coming up ${when}</div><button class="ev future" data-i="${EVENTS.indexOf(up)}"><time>${fmtShort(up.jd)}</time><span>${up.name}<small>${up.sub}</small></span></button>`; }
  html += '<div class="evh">Past</div>'; let inFuture = false;
  EVENTS.forEach((e, i) => {
    if (!inFuture && e.jd > now){ inFuture = true; html += '<div class="evh">Ahead</div>'; }
    html += `<button class="ev${e.jd > now ? ' future' : ''}" data-i="${i}"><time>${fmtShort(e.jd)}</time><span>${e.name}<small>${e.sub}</small></span></button>`;
  });
  $('#evs').innerHTML = html;
  $('#evs').querySelectorAll('.ev').forEach(b => b.addEventListener('click', () => {
    const e = EVENTS[+b.dataset.i]; setPop(false); setPlaying(false);
    travelTo(e.jd, () => { if (e.focus) setFocus(e.focus); toast(`${e.name} · ${fmtDate(e.jd).date}`); });
  }));
}
function parseDate(s){
  const m = s.trim().match(/^(-?\d{1,4})\s*(BC|BCE|AD|CE)?(?:[-/. ](\d{1,2}))?(?:[-/. ](\d{1,2}))?(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*(UTC|Z)?$/i);
  if (!m) return null;
  let y = parseInt(m[1], 10); const era = (m[2] || '').toUpperCase();
  if (era === 'BC' || era === 'BCE'){ if (y < 1) return null; y = 1 - y; }
  const mo = m[3] ? +m[3] : 1, d = m[4] ? +m[4] : 1, h = m[5] ? +m[5] : 0, mi = m[6] ? +m[6] : 0, sec = m[7] ? +m[7] : 0;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return Eph.calToJD(y, mo, d + (h + mi / 60 + sec / 3600) / 24);
}
$('#f-go').addEventListener('submit', e => {
  e.preventDefault(); const jd = parseDate($('#i-date').value), hint = $('#go-hint');
  if (jd === null){ hint.textContent = 'Use year-month-day, for example 1969-07-20 20:17, -43-03-15 or 44 BC-03-15.'; hint.classList.add('err'); return; }
  if (jd < Eph.MIN_JD || jd > Eph.MAX_JD){ hint.textContent = 'JPL\'s elements are fitted for 3000 BC to AD 3000. Pick a date inside that range.'; hint.classList.add('err'); return; }
  hint.classList.remove('err'); hint.textContent = 'Any date from 3000 BC to AD 3000, in UTC. Dates before 15 Oct 1582 use the Julian calendar.';
  setPop(false); setPlaying(false); travelTo(jd, () => toast(fmtDate(jd).date));
});

/* ================= CLEAN VIEW ================= */
const EYE = '<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>';
const EYE_OFF = EYE + '<path d="M2.5 2.5l11 11"/>';
function setClean(on, quiet){
  S.clean = on; $('#hud').classList.toggle('clean', on); $('#mini').hidden = !on;
  $('#b-ui').setAttribute('aria-pressed', String(on)); $('#t-ui').textContent = on ? 'Show UI' : 'Hide UI'; $('#i-ui').innerHTML = on ? EYE_OFF : EYE;
  if (on){ setPanel(false); setPop(false); $('#m-date').textContent = $('#d-date').textContent; }
  try { localStorage.setItem('hv-clean', on ? '1' : '0'); } catch (e) {}
}
$('#b-ui').addEventListener('click', () => setClean(!S.clean));
$('#m-show').addEventListener('click', () => setClean(false));
$('#m-play').addEventListener('click', () => setPlaying(!S.playing));

/* ================= PANEL & TOGGLES ================= */
const panel = $('#panel'), scrim = $('#scrim');
function setPanel(open){ panel.classList.toggle('closed', !open); scrim.classList.toggle('on', open); $('#b-panel').setAttribute('aria-pressed', String(open)); }
setPanel(innerWidth > 1180);
$('#b-panel').addEventListener('click', () => setPanel(panel.classList.contains('closed')));
$('#p-close').addEventListener('click', () => setPanel(false));
scrim.addEventListener('click', () => setPanel(false));
document.querySelectorAll('.view').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

function setFrame(f){
  if (!CINE_ON()) setTimeout(savePrefs, 0);
  S.frame = f; document.querySelectorAll('[data-frame]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.frame === f)));
  sunPos.set(0, 0, 0); S.anchorJD = S.jd; clearTrails();
  setFocus(focus, { dist: tmp.subVectors(camera.position, controls.target).length() });
}
document.querySelectorAll('[data-frame]').forEach(b => b.addEventListener('click', () => setFrame(b.dataset.frame)));
function setScale(s){ S.scale = s; savePrefs(); document.querySelectorAll('[data-scale]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scale === s))); applyScale(); setFocus(focus); }
document.querySelectorAll('[data-scale]').forEach(b => b.addEventListener('click', () => setScale(b.dataset.scale)));

function bindRange(id, out, fmt, fn){ const el = $(id); const upd = () => { const v = parseFloat(el.value); $(out).textContent = fmt(v); fn(v); }; el.addEventListener('input', upd); upd(); }
bindRange('#s-drift', '#o-drift', v => v === 0 ? 'stopped' : v.toFixed(0), v => { S.drift = v; S.anchorJD = S.jd; sunPos.set(0,0,0); clearTrails(); });
bindRange('#s-wake', '#o-wake', v => String(v), v => { S.wake = v; drawAllTrails(); });
const TRUE_DRIFT = 6 * 251.9 * 86400 * 365.25 / Eph.AU_KM;   // 53.1 AU per year, linear scale
$('#b-true').addEventListener('click', () => { setScale('linear'); setFrame('galactic'); const s = $('#s-drift'); s.max = String(Math.ceil(TRUE_DRIFT)); s.value = TRUE_DRIFT; s.dispatchEvent(new Event('input')); $('#o-drift').textContent = '53.1 AU/yr (true)'; toast('True ratio: the Sun moves 53 AU for every year'); });

function bindToggle(id, fn){ const el = $(id); el.addEventListener('change', () => fn(el.checked)); fn(el.checked); }
bindToggle('#t-trails', on => { S.trails = on; for (const k in trails) trails[k].line.visible = on; });
bindToggle('#t-orbits', on => { for (const n in bodies) bodies[n].orbit.visible = on; });
bindToggle('#t-helio', on => { helio.visible = on; });
bindToggle('#t-voypath', on => { voyPast.visible = voyFuture.visible = on; });
bindToggle('#t-guides', on => { guides.visible = on; });
bindToggle('#t-grid', on => { grid.visible = on; });
bindToggle('#t-moons', on => { S.moons = on; });
bindToggle('#t-dust', on => { dust.visible = on; });

function setLabels(on){ S.labels = on; labelsLayer.hidden = !on; $('#b-labels').setAttribute('aria-pressed', String(on)); savePrefs(); }
$('#b-labels').addEventListener('click', () => setLabels(!S.labels));

/* ================= SOUND ================= */
let audio = null;
function setSound(on){
  S.sound = on; $('#b-sound').setAttribute('aria-pressed', String(on));
  try {
    if (on){
      if (!audio){
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain(); master.gain.value = 0;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 5;
        lp.connect(master); master.connect(ctx.destination);
        [[55,.22,'sine'],[55.35,.2,'sine'],[82.4,.08,'triangle'],[110.2,.05,'triangle'],[164.8,.025,'sine']].forEach(([f, gv, type]) => {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.value = gv; o.connect(g); g.connect(lp); o.start();
        });
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .06; lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
        audio = { ctx, master, lp };
      }
      audio.ctx.resume(); audio.master.gain.setTargetAtTime(.18, audio.ctx.currentTime, .8);
    } else if (audio){
      audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, .25);
      setTimeout(() => { if (!S.sound) audio.ctx.suspend(); }, 1500);
    }
  } catch (e){ toast('Sound is not available in this browser'); S.sound = false; $('#b-sound').setAttribute('aria-pressed', 'false'); }
}
$('#b-sound').addEventListener('click', () => setSound(!S.sound));

/* ================= KEYBOARD ================= */
addEventListener('keydown', e => {
  idleT = 0;
  if (e.target.matches('input[type=text]')){ if (e.key === 'Escape') setPop(false); return; }
  if (!$('#splash').classList.contains('gone') || !$('#help').hidden) return;
  if (CINE.on){ const kk = e.key; if (kk === ' '){ e.preventDefault(); cinePause(); } else if (kk === 'ArrowRight'){ e.preventDefault(); cineStep(1); } else if (kk === 'ArrowLeft'){ e.preventDefault(); cineStep(-1); }
    else if (kk === 'Escape' || kk.toLowerCase() === 'c') stopCine(); return; }
  if (S.level !== 'solar' && !['l','h','escape'].includes(e.key.toLowerCase())) return;
  if (e.key.toLowerCase() === 'c'){ startCine(); return; }
  const k = e.key.toLowerCase();
  if (k === ' '){ e.preventDefault(); setPlaying(!S.playing); }
  else if (k === 'arrowright'){ e.preventDefault(); step(e.shiftKey ? 365.25 : 1); }
  else if (k === 'arrowleft'){ e.preventDefault(); step(e.shiftKey ? -365.25 : -1); }
  else if (k === ']' || k === '=' || k === '+') setRate(S.rate + 1);
  else if (k === '[' || k === '-') setRate(S.rate - 1);
  else if (k === 'r') setDir(-S.dir);
  else if (k === 'n') goNow();
  else if (k === 'e'){ e.preventDefault(); setPop(pop.hidden); }
  else if (/^[0-9]$/.test(k)) setFocus(ORDER[+k]);
  else if (k === 'g') setFrame(S.frame === 'galactic' ? 'helio' : 'galactic');
  else if (k === 'v') setView(VIEW_ORDER[(VIEW_ORDER.indexOf(S.view) + 1) % VIEW_ORDER.length]);
  else if (k === 'l') setLabels(!S.labels);
  else if (k === 't'){ const t = $('#t-trails'); t.checked = !t.checked; t.dispatchEvent(new Event('change')); }
  else if (k === 'o'){ const t = $('#t-orbits'); t.checked = !t.checked; t.dispatchEvent(new Event('change')); }
  else if (k === 'h') setClean(!S.clean);
  else if (k === 'escape'){ setPanel(false); setPop(false); }
  else if (k === '?' || k === '/'){ e.preventDefault(); openHelp(); }
});

/* ================= PICKING ================= */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null, hoverQueued = false, lastMove = null;
function pick(x, y){ ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pickables.filter(o => o.parent && (o.userData.body !== 'Voyager 1' || voyVisible)), false)[0]; return h ? h.object.userData.body : null; }
renderer.domElement.addEventListener('pointerdown', e => { if (CINE.on){ const U = CINE.user; U.dragging = true; U.idle = 0; U.x = U.sx = e.clientX; U.y = U.sy = e.clientY; U.t0 = performance.now(); try { renderer.domElement.setPointerCapture(e.pointerId); } catch (er) {} down = null; return; } idleT = 0; down = { x:e.clientX, y:e.clientY, t:performance.now() }; });
addEventListener('pointermove', e => { if (!CINE.on || !CINE.user.dragging) return; const U = CINE.user;
  U.yaw -= (e.clientX - U.x) * .005; U.pitch = Math.max(-1.1, Math.min(1.1, U.pitch - (e.clientY - U.y) * .004)); U.x = e.clientX; U.y = e.clientY; U.idle = 0; });
renderer.domElement.addEventListener('wheel', e => { if (!CINE.on) { idleT = 0; return; } e.preventDefault(); const U = CINE.user; U.zoom = Math.max(.3, Math.min(3.5, U.zoom * Math.exp(e.deltaY * .0012))); U.idle = 0; }, { passive:false });
renderer.domElement.addEventListener('pointerup', e => {
  if (CINE.on){ const U = CINE.user; U.dragging = false;
    if (Math.hypot(e.clientX - U.sx, e.clientY - U.sy) < 6 && performance.now() - U.t0 < 450){ const b = pick(e.clientX, e.clientY); if (b) cineVisit(b); else cinePause(); }
    return; }
  if (!down || S.level !== 'solar'){ down = null; return; }
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 450){ const b = pick(e.clientX, e.clientY); if (b) setFocus(b); }
  down = null;
});
renderer.domElement.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || S.level !== 'solar') return; lastMove = e; if (!hoverQueued){ hoverQueued = true; requestAnimationFrame(() => { hoverQueued = false; renderer.domElement.style.cursor = pick(lastMove.clientX, lastMove.clientY) ? 'pointer' : ''; }); } });

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (typeof ccam !== 'undefined'){ ccam.aspect = camera.aspect; ccam.updateProjectionMatrix(); } renderer.setSize(innerWidth, innerHeight); });

/* ================= WORLD UPDATE ================= */
const au = { x:0, y:0, z:0 }, orbitPt = { x:0, y:0, z:0 };
function rebuildOrbit(b, jdTT){
  const el = Eph.elements(b.data.key, jdTT), arr = b.orbit.geometry.attributes.position.array;
  for (let i = 0; i <= 256; i++){ Eph.orbitPoint(el, i / 256 * 360, orbitPt); toScene(orbitPt, sv); arr[i*3] = sv.x; arr[i*3+1] = sv.y; arr[i*3+2] = sv.z; }
  b.orbit.geometry.attributes.position.needsUpdate = true; b.orbitJD = jdTT;
}
function updateWorld(realDt){
  const jdTT = Eph.ttFromUT(S.jd), dps = Math.abs(S.playing || S.travel ? (S.travel ? 1e4 : RATES[S.rate].d) : 0);
  // Sun position in the chosen frame
  if (S.frame === 'galactic') sunPos.copy(APEX).multiplyScalar(S.drift * (S.jd - S.anchorJD) / 365.25); else sunPos.set(0, 0, 0);
  sunGroup.position.copy(sunPos);
  sunMesh.rotation.y = 2 * Math.PI * (((S.jd - Eph.J2000) / 25.38) % 1);

  for (const n in bodies){
    const b = bodies[n], d = b.data;
    if (n === 'Earth') Eph.earth(jdTT, b.au, moonGeoAU); else Eph.planet(d.key, jdTT, b.au);
    toScene(b.au, b.holder.position);
    if (b.orbitJD === null || Math.abs(jdTT - b.orbitJD) > 1800) rebuildOrbit(b, jdTT);
    // Spin: true sidereal rate when slow enough to read, otherwise a calm stand-in
    const rotPerSec = dps * 24 / Math.abs(d.rotH);
    if (rotPerSec < .6) b.spinner.rotation.y = n === 'Earth' ? ((280.46061837 + 360.98564736629 * (S.jd - 2451545)) % 360) * DEG   // Greenwich sidereal time
      : 2 * Math.PI * ((((S.jd - Eph.J2000) * 24 / d.rotH) % 1) + 1);
    else b.spinner.rotation.y += Math.sign(d.rotH) * S.dir * realDt * 1.2;
    for (const m of b.moons){
      const show = S.moons && dps / m.P < 1.2; m.mesh.visible = show;
      if (show){ const a = Eph.satLong(m.L0, m.P, jdTT) * DEG; m.mesh.position.set(Math.cos(a) * m.d, 0, -Math.sin(a) * m.d); m.mesh.rotation.y = a + Math.PI; }   // tidally locked
    }
  }
  // Earth's Moon: true direction, enlarged distance
  moonMesh.visible = S.moons && dps / 27.32 < 1.2;
  ecl(moonGeoAU, moonMesh.position).normalize().multiplyScalar(bodies.Earth.data.r * SC.size * 2.4);

  // Voyager 1
  const vp = Eph.voyager(S.jd, voyAU); voyVisible = !!vp; voyager.visible = voyVisible;
  if (vp){ toScene(voyAU, voyager.position).add(sunPos); voyager.lookAt(sunPos); voyager.userData.beacon.material.opacity = .55 + Math.sin(performance.now() * .004) * .35; }
  const pre = S.jd < Eph.VOY_EVENTS.launch, idx = Math.max(0, Math.min(VOY_N - 1, Math.floor((S.jd - Eph.VOY_EVENTS.launch) / VOY_STEP)));
  voyPathGeo.setDrawRange(0, pre ? 0 : idx + 1);
  voyFutureGeo.setDrawRange(pre ? 0 : idx, pre ? VOY_N : VOY_N - idx);

  // Heliotail
  if (helio.visible){
    const hp = helio.userData.hp, len = hp * 3.2, spd = S.playing ? realDt : 0;
    for (let i = 0; i < TAIL; i++){
      const p = tailSeed[i]; p.u += p.v * spd * .25; if (p.u > 1) p.u -= 1;
      const x = -p.u * len, rr = hp * p.rf * (.92 + p.u * .45);
      tailPos[i*3] = x; tailPos[i*3+1] = Math.cos(p.a + p.u * 1.4) * rr; tailPos[i*3+2] = Math.sin(p.a + p.u * 1.4) * rr;
      const f = (1 - p.u) * Math.min(1, p.u * 14) * .5; tailCol[i*3] = .35*f; tailCol[i*3+1] = .7*f; tailCol[i*3+2] = f;
    }
    tailGeo.attributes.position.needsUpdate = tailGeo.attributes.color.needsUpdate = true;
  }

  // Dust wraps around the Sun in every direction
  if (dust.visible){ const h = dustSpan / 2; for (let i = 0; i < DUST; i++){ for (let a = 0; a < 3; a++){ const j = i*3 + a, c = a === 0 ? sunPos.x : a === 1 ? sunPos.y : sunPos.z; let v = dustPos[j] - c; if (v < -h || v > h){ v = ((v + h) % dustSpan + dustSpan) % dustSpan - h; dustPos[j] = c + v; } } } dustGeo.attributes.position.needsUpdate = true; }
  if (grid.visible){ grid.position.copy(sunPos).addScaledVector(NGP, -SC.f(20)); }
}

/* ================= CINEMATIC DIRECTOR ================= */
const CINE = { user:{ yaw:0, pitch:0, zoom:1, dragging:false, idle:9, x:0, y:0, sx:0, sy:0, t0:0 }, paused:false, sh:null, on:false, i:-1, t:0, blend:1, cut:0, fromPos:V(), fromLook:V(), look:V(), cp:V(), lp:V(), saved:null, shown:false };
const smoother = x => x * x * x * (x * (x * 6 - 15) + 10);
const sphv = (az, el, out) => out.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
const UP = new THREE.Vector3(0, 1, 0), cP = V(), cT = V(), cO = V(), cS = V();
const len3 = p => Math.hypot(p.x, p.y, p.z);
function bodyR(n){ return n === 'Sun' ? SC.sun : n === 'Voyager 1' ? 2 : bodies[n].data.r * SC.size; }
function moonReach(n){ const b = bodies[n]; if (!b) return 0; let m = 0; for (const x of b.moons) m = Math.max(m, x.d); if (b.data.rings) m = Math.max(m, b.data.rings[1]); return m * SC.size; }
function planetSub(n){ const p = bodies[n].au, E = bodies.Earth.au; return `${fmtAU(len3(p))} from the Sun · ${fmtLT(dist3(p, E))} from Earth`; }
const SHOTS = [
  { type:'establish', target:'Sun', dur:13, rate:5, fov:46, eb:'Positions from NASA JPL', title:'The Solar System', sub:() => 'Eight planets, each where JPL places it on this date' },
  { type:'orbit', target:'Earth', dur:11, rate:3, fov:36, sub:() => `${fmtAU(len3(bodies.Earth.au))} from the Sun · the Moon ${Math.round(len3(moonGeoAU) * Eph.AU_KM).toLocaleString('en-GB')} km away` },
  { type:'reveal', target:'Venus', dur:10, rate:3, fov:34 },
  { type:'flyby', target:'Mars', dur:9, rate:3, fov:40 },
  { type:'orbit', target:'Jupiter', dur:12, rate:3, fov:38, sub:() => `${planetSub('Jupiter')} · Galilean moons at JPL phases` },
  { type:'reveal', target:'Saturn', dur:11, rate:3, fov:36 },
  { type:'flyby', target:'Uranus', dur:9, rate:3, fov:40, sub:() => `${planetSub('Uranus')} · spinning on its side` },
  { type:'orbit', target:'Neptune', dur:10, rate:3, fov:38 },
  { type:'voyager', target:'Voyager 1', dur:13, rate:4, fov:42, eb:'Looking home', sub:() => `${fmtAU(len3(voyAU))} from the Sun · its signal takes ${fmtLT(dist3(voyAU, bodies.Earth.au))}` },
  { type:'galactic', target:'Sun', dur:16, rate:7, fov:52, eb:'Galactic frame', title:'Through the Milky Way', sub:() => 'The Sun carries every planet at 251.9 km/s, 60° from their orbital plane' }
];
function computeShot(sh, e, cp, lp){
  focusPos(sh.target, cP); const R = bodyR(sh.target), D = SC.f(32);
  cS.subVectors(sunPos, cP); if (cS.lengthSq() < 1e-6) cS.copy(APEX); cS.normalize();
  const sAz = Math.atan2(cS.z, cS.x);
  switch (sh.type){
    case 'establish': sphv(sAz + .9 + e * .65, .46 - .14 * e, cp).multiplyScalar(D * (2.75 - .8 * e)).add(cP); lp.copy(cP); break;
    case 'orbit': { const d = Math.max(R * 5.5, moonReach(sh.target) * 1.25) * (1.18 - .22 * e); sphv(sAz + .55 + e * 1.1, .16 + .14 * e, cp).multiplyScalar(d).add(cP); lp.copy(cP); break; }
    case 'reveal': { const d = Math.max(R * (4.5 + 3.8 * e), moonReach(sh.target) * (1 + .5 * e)); sphv(sAz + Math.PI - .32 - .95 * e, .05 + .2 * e, cp).multiplyScalar(d).add(cP); lp.copy(cP); break; }
    case 'flyby': { const k = 2 * e - 1, d = R * (4.4 + 3.4 * k * k); sphv(sAz - 1.3 * k, .1 + .06 * (1 - k * k), cp).multiplyScalar(d).add(cP); lp.copy(cP); break; }
    case 'voyager': { cO.subVectors(cP, sunPos).normalize(); cT.crossVectors(cO, UP).normalize();
      cp.copy(cP).addScaledVector(cO, 9 + 34 * e).addScaledVector(UP, 3 + 9 * e).addScaledVector(cT, 5 + 7 * e); lp.copy(cP).lerp(sunPos, .5 * e); break; }
    case 'galactic': { cO.copy(APEX).multiplyScalar(-.9).addScaledVector(NGP, .55).addScaledVector(GROT, .3).normalize();
      cp.copy(cP).addScaledVector(cO, D * (1.3 + 3.1 * e)); lp.copy(cP).addScaledVector(APEX, D * .7 * e); break; }
  }
}
function nextShot(forced){
  if (!forced){ do { CINE.i = (CINE.i + 1) % SHOTS.length; } while (SHOTS[CINE.i].target === 'Voyager 1' && !voyVisible); }
  const sh = CINE.sh = forced || SHOTS[CINE.i]; CINE.t = 0; CINE.shown = false; $('#l3').classList.remove('show');
  setRate(sh.rate); focus = sh.target;
  CINE.fromPos.copy(camera.position); CINE.fromLook.copy(CINE.look); CINE.blend = 0;
  computeShot(sh, 0, CINE.cp, CINE.lp);
  // Long moves get a dip to black instead of a fly-through
  const gap = camera.position.distanceTo(CINE.cp);
  CINE.blendDur = Math.min(5.5, 2.6 + Math.log10(1 + gap / 20) * 1.3); CINE.hop = gap * .28;
  if (reduceMotion && gap > SC.f(32) * 1.1){ CINE.cut = .5; $('#cine-fade').classList.add('on'); }
  $('#cine-n').textContent = `${String(CINE.i + 1).padStart(2, '0')} / ${String(SHOTS.length).padStart(2, '0')}`;
}
function fillL3(sh){
  const n = sh.target, d = n === 'Sun' || n === 'Voyager 1' ? null : bodies[n].data;
  $('#l3-eb').textContent = sh.eb || (d ? `Planet ${PLANETS.indexOf(d) + 1} · ${d.tilt} tilt · ${d.day} day` : n);
  $('#l3-t').textContent = sh.title || n;
  $('#l3-s').textContent = sh.sub ? sh.sub() : planetSub(n);
}
function updateCine(dt){
  const sh = CINE.sh;
  if (CINE.cut > 0){ CINE.cut -= dt; if (CINE.cut <= 0){ CINE.blend = 1; $('#cine-fade').classList.remove('on'); } }
  else if (!CINE.paused) CINE.t += dt;
  computeShot(sh, smoother(Math.min(1, CINE.t / sh.dur)), CINE.cp, CINE.lp);
  if (CINE.cut > 0){ /* hold under black */ }
  else if (CINE.blend < 1){ CINE.blend = Math.min(1, CINE.blend + dt / (CINE.blendDur || 2.6)); const b = smoother(CINE.blend);
    camera.position.lerpVectors(CINE.fromPos, CINE.cp, b).addScaledVector(UP, (CINE.hop || 0) * Math.sin(Math.PI * b));
    CINE.look.lerpVectors(CINE.fromLook, CINE.lp, smoother(Math.min(1, CINE.blend * 1.25))); }
  else { camera.position.copy(CINE.cp); CINE.look.copy(CINE.lp); }
  // Viewer's own look-around, layered on top of the director's camera; eases back after a few idle seconds
  const U = CINE.user;
  if (!U.dragging){ U.idle += dt; if (U.idle > 2.5){ const k = Math.exp(-dt * .9); U.yaw *= k; U.pitch *= k; U.zoom = Math.exp(Math.log(U.zoom) * k); } }
  if (Math.abs(U.yaw) > 1e-4 || Math.abs(U.pitch) > 1e-4 || Math.abs(U.zoom - 1) > 1e-4){
    tmp.subVectors(camera.position, CINE.look).applyAxisAngle(UP, U.yaw);
    tmp2.crossVectors(tmp, UP).normalize(); tmp.applyAxisAngle(tmp2, U.pitch).multiplyScalar(U.zoom);
    camera.position.copy(CINE.look).add(tmp);
  }
  camera.lookAt(CINE.look);
  const f = camera.fov + (sh.fov - camera.fov) * Math.min(1, dt * 1.2); if (Math.abs(f - camera.fov) > .001){ camera.fov = f; camera.updateProjectionMatrix(); }
  if (!CINE.shown && CINE.t > 1.1){ CINE.shown = true; fillL3(sh); $('#l3').classList.add('show'); }
  if (CINE.shown && CINE.t > sh.dur - 1.4) $('#l3').classList.remove('show');
  $('#cine-prog').style.transform = `scaleX(${Math.min(1, CINE.t / sh.dur).toFixed(4)})`;
  if (CINE.t >= sh.dur) nextShot();
}
function startCine(){
  if (CINE.on) return;
  CINE.saved = { rate:S.rate, dir:S.dir, frame:S.frame, playing:S.playing, guides:guides.visible }; guides.visible = false;
  CINE.on = true; document.body.classList.add('cine-on');
  const el = $('#cine'); el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  setPanel(false); setPop(false);
  controls.enabled = false; controls.autoRotate = false; CINE.look.copy(controls.target);
  if (S.frame !== 'galactic') setFrame('galactic');
  if (S.dir < 0) setDir(1); setPlaying(true);
  CINE.paused = false; setCinePauseIcon(); Object.assign(CINE.user, { yaw:0, pitch:0, zoom:1, idle:9 });
  CINE.i = -1; nextShot(); CINE.cut = 0; $('#cine-fade').classList.remove('on');
}
function setCinePauseIcon(){ $('#i-cine-pause').innerHTML = CINE.paused ? '<path d="M4 2.5v11l9-5.5z"/>' : '<rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/>'; $('#cine-pause').setAttribute('aria-label', CINE.paused ? 'Resume tour' : 'Pause tour'); }
function cinePause(){ CINE.paused = !CINE.paused; setPlaying(!CINE.paused); setCinePauseIcon(); }
function cineStep(dir){ if (dir < 0) CINE.i = (CINE.i - 2 + SHOTS.length * 2) % SHOTS.length; nextShot(); }
// Tapping a body during the tour: the director cuts to it, then carries on with the tour from there
function cineVisit(name){
  const i = SHOTS.findIndex(x => x.target === name && x.type !== 'galactic');
  if (i >= 0){ CINE.i = i; nextShot(SHOTS[i]); }
  else nextShot({ type: name === 'Voyager 1' ? 'voyager' : 'orbit', target:name, dur:12, rate:3, fov:38 });
}
$('#cine-prev').addEventListener('click', () => cineStep(-1));
$('#cine-next').addEventListener('click', () => cineStep(1));
$('#cine-pause').addEventListener('click', cinePause);
function stopCine(){
  if (!CINE.on) return;
  CINE.on = false; document.body.classList.remove('cine-on');
  const el = $('#cine'); el.classList.remove('on'); $('#l3').classList.remove('show'); $('#cine-fade').classList.remove('on');
  setTimeout(() => { if (!CINE.on) el.hidden = true; }, 1000);
  controls.enabled = true; controls.target.copy(CINE.look);
  const sv = CINE.saved; guides.visible = sv.guides; setRate(sv.rate); if (sv.dir !== S.dir) setDir(sv.dir); if (sv.frame !== S.frame) setFrame(sv.frame); setPlaying(sv.playing);
  const tgt = CINE.sh.target; setFocus(voyVisible || tgt !== 'Voyager 1' ? tgt : 'Sun', { dist: camera.position.distanceTo(controls.target) });
  document.querySelectorAll('.view').forEach(b => b.setAttribute('aria-pressed', 'false'));
}
$('#cine-exit').addEventListener('click', stopCine);
$('#b-cine').addEventListener('click', startCine);

/* ================= COSMIC SCALES =================
   Frame: Sun-centred galactic coordinates in kpc. Scene axes: x → Galactic Centre, y → North Galactic Pole, −z → l = 90°.
   Sources: GRAVITY 2021 (R0 = 8.275 kpc), Bennett & Bovy 2019 (Sun 20.8 pc above plane), McConnachie 2012 (Local Group dwarfs),
   Pietrzyński 2019 (LMC), Graczyk 2020 (SMC), Li et al. 2021 (M31), Mei 2007 (Virgo), Blakeslee 2009 (Fornax), Tully et al. 2014 (Laniakea).
   Cluster distances beyond 40 Mpc are redshift distances with H0 = 70 km/s/Mpc. Spiral arms are a log-spiral model, not a map. */
S.level = 'solar';
const KPC_LY = 3261.56, R0 = 8.275, ZSUN = .0208;
const cosmic = new THREE.Scene(); cosmic.background = new THREE.Color(0x020308);
const ccam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .001, 1e6);
const galV = (l, b, d, out) => out.set(d * Math.cos(b * DEG) * Math.cos(l * DEG), d * Math.sin(b * DEG), -d * Math.cos(b * DEG) * Math.sin(l * DEG));
// Galactocentric (R, φ measured from the GC→Sun line toward −l, height z) → scene
const gcV = (R, phi, z, out) => out.set(R0 - R * Math.cos(phi), z - ZSUN, R * Math.sin(phi));
const GCP = new THREE.Vector3(R0, -ZSUN, 0);
const gauss = R => (R() + R() + R() + R() - 2) * 1.732;

/* ---- Rendering: shader-drawn galaxies, fine stars, nebulae ---- */
const GLSL_NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 6; i++){ v += a * noise(p); p = m * p + 17.1; a *= 0.5; } return v; }`;
const PLANE_VS = `varying vec2 vUv; varying float vFace;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFace = abs(dot(normalize(normalMatrix * vec3(0.0, 0.0, 1.0)), normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`;
// Spiral galaxy: log-spiral arms with clumpy star formation, dust lanes on the inner edge, bar and bulge
const GALAXY_FS = `
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
function galaxyDisk(o){
  const g = o.gal, arms = g.arms || 0, base = Math.log(g.r0 || o.r * .4), per = 2 * Math.PI * Math.tan(g.pitch * DEG);
  const ln = g.armLn || [0, 1, 2, 3].map(k => base + k * per / Math.max(1, arms));
  const mat = new THREE.ShaderMaterial({
    uniforms:{ uR:{ value:o.r }, uTanP:{ value:Math.tan(g.pitch * DEG) }, uNArms:{ value:arms }, uArmW:{ value:g.armW || .1 }, uBulge:{ value:g.bulge },
      uBarLen:{ value:g.bar || 0 }, uBarAng:{ value:g.barAng || 0 }, uRs:{ value:g.rs }, uSpur:{ value:g.spur || 0 }, uSeed:{ value:g.seed || 1 },
      uOpacity:{ value:1 }, uIrr:{ value:g.irr || 0 }, uRingR:{ value:g.ringR || 0 }, uRingS:{ value:g.ringS || 0 }, uDust:{ value:g.dust ?? .8 }, uBright:{ value:g.bright || 1 },
      uArmLn:{ value:new THREE.Vector4(...ln) }, uCoreCol:{ value:new THREE.Color(g.core || '#ffd9a0') }, uArmCol:{ value:new THREE.Color(g.arm || '#a9c4ff') }, uDiskCol:{ value:new THREE.Color(g.disk || '#c9b9a0') } },
    vertexShader:PLANE_VS, fragmentShader:GALAXY_FS, transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(o.r * 2, o.r * 2, 1, 1), mat);
}
// Stars: world-sized points that never grow past a few pixels, so zooming reveals finer stars rather than bigger dots
const STAR_VS = `attribute float size; attribute vec3 acol; uniform float uScale, uOpacity, uMaxPx; varying vec3 vC; varying float vA;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float s = size * uScale / max(-mv.z, 1e-6);
  vA = clamp(s / 1.4, 0.04, 1.0) * uOpacity; gl_PointSize = clamp(s, 1.0, uMaxPx); vC = acol; gl_Position = projectionMatrix * mv; }`;
const STAR_FS = `varying vec3 vC; varying float vA;
void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0; float a = exp(-r2 * 3.5) + 0.35 * exp(-r2 * 0.9) * step(r2, 1.0);
  gl_FragColor = vec4(vC * a * vA, 1.0); }`;
const starMats = [];
function starCloud(n, fill, maxPx = 3.2, opacity = 1){
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n), p = V(), c = new THREE.Color(), o = { size:.01 };
  for (let i = 0; i < n; i++){ fill(i, p, c, o); pos.set([p.x, p.y, p.z], i * 3); col.set([c.r, c.g, c.b], i * 3); siz[i] = o.size; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('acol', new THREE.BufferAttribute(col, 3)); g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const m = new THREE.ShaderMaterial({ uniforms:{ uScale:{ value:1 }, uOpacity:{ value:opacity }, uMaxPx:{ value:maxPx * renderer.getPixelRatio() } }, vertexShader:STAR_VS, fragmentShader:STAR_FS,
    transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending });
  starMats.push(m); const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}

// Distant galaxies: each point is drawn as a small tilted ellipse with a bright core
const GALPT_VS = `attribute float size; attribute vec3 acol; attribute vec2 shape; uniform float uScale, uOpacity, uMaxPx; varying vec3 vC; varying float vA; varying vec2 vS;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float s = size * uScale / max(-mv.z, 1e-6);
  vA = clamp(s / 1.6, 0.05, 1.0) * uOpacity; gl_PointSize = clamp(s, 1.0, uMaxPx); vC = acol; vS = shape; gl_Position = projectionMatrix * mv; }`;
const GALPT_FS = `varying vec3 vC; varying float vA; varying vec2 vS;
void main(){ vec2 d = gl_PointCoord - 0.5; float c = cos(vS.x), s = sin(vS.x); d = vec2(c * d.x + s * d.y, -s * d.x + c * d.y); d.y /= vS.y;
  float r2 = dot(d, d) * 4.0; if (r2 > 1.0) discard; float a = exp(-r2 * 14.0) * 1.3 + 0.45 * exp(-r2 * 3.2);
  gl_FragColor = vec4(vC * a * vA, 1.0); }`;
function galaxyCloud(n, fill, maxPx = 14){
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n), shp = new Float32Array(n * 2), p = V(), c = new THREE.Color(), o = { size:1, ang:0, ratio:1 };
  for (let i = 0; i < n; i++){ fill(i, p, c, o); pos.set([p.x, p.y, p.z], i * 3); col.set([c.r, c.g, c.b], i * 3); siz[i] = o.size; shp[i * 2] = o.ang; shp[i * 2 + 1] = o.ratio; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('acol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(siz, 1)); g.setAttribute('shape', new THREE.BufferAttribute(shp, 2));
  const m = new THREE.ShaderMaterial({ uniforms:{ uScale:{ value:1 }, uOpacity:{ value:1 }, uMaxPx:{ value:maxPx * renderer.getPixelRatio() } }, vertexShader:GALPT_VS, fragmentShader:GALPT_FS,
    transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending });
  starMats.push(m); const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
function updateStarScale(){ const s = renderer.domElement.height / (2 * Math.tan(ccam.fov * DEG / 2)); starMats.forEach(m => m.uniforms.uScale.value = s); }
// Nebulae and diffuse objects: billboarded noise clouds
const NEB_FS = `uniform vec3 uC1, uC2, uC3; uniform float uSeed, uOpacity, uStars, uType, uTime; varying vec2 vUv; varying float vFace;
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
const billboards = [];
function nebula(size, type, c1, c2, c3, seed, stars = 0, opacity = 1){
  const m = new THREE.ShaderMaterial({ uniforms:{ uC1:{ value:new THREE.Color(c1) }, uC2:{ value:new THREE.Color(c2) }, uC3:{ value:new THREE.Color(c3) }, uSeed:{ value:seed }, uOpacity:{ value:opacity }, uStars:{ value:stars }, uType:{ value:type }, uTime:{ value:0 } },
    vertexShader:PLANE_VS, fragmentShader:NEB_FS, transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); billboards.push(mesh); return mesh;
}
const softTex = glowTex('rgba(255,255,255,.9)', 'rgba(255,255,255,.25)'), V0 = new THREE.Vector3();
function glowSprite(color, scale, opacity){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:softTex, color:new THREE.Color(color), transparent:true, opacity, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending })); s.scale.setScalar(scale); return s; }

/* ---- The Milky Way ---- */
const MW = new THREE.Group(), mwPivot = new THREE.Group(); mwPivot.add(MW); cosmic.add(mwPivot);
const PITCH = Math.tan(12.5 * DEG);
const ARMS = [ { name:'Scutum–Centaurus Arm', R:5.0 }, { name:'Sagittarius–Carina Arm', R:6.6 }, { name:'Perseus Arm', R:10.2 }, { name:'Norma–Outer Arm', R:13.8 } ];
const BAR = 27 * DEG;
const mwDisk = galaxyDisk({ r:19, gal:{ arms:4, pitch:12.5, armLn:ARMS.map(a => Math.log(a.R)), armW:.075, bulge:1.25, bar:1.6, barAng:Math.atan2(Math.sin(BAR), -Math.cos(BAR)), rs:3.4, spur:.55, seed:3.7, dust:.85, bright:1.05,
  core:'#ffd49a', arm:'#a7c2ff', disk:'#d6c3a2' } });
mwDisk.rotation.x = -Math.PI / 2; mwDisk.position.copy(GCP); MW.add(mwDisk);
{
  const R = rng(2026), N = innerWidth < 720 ? 38000 : 65000, bx = -Math.cos(BAR), by = Math.sin(BAR);
  MW.add(starCloud(N, (i, p, c, o) => {
    const r = R();
    if (r < .14){ const u = Math.max(-4.5, Math.min(4.5, gauss(R) * 1.5)), v = gauss(R) * .6, w = gauss(R) * .38;
      p.set(R0 + u * bx + v * -by, w - ZSUN, -(u * by + v * bx)); c.setHSL(.09 + R() * .03, .6, .55 + R() * .2); o.size = .012 + R() * .01; }
    else if (r < .6){ const a = ARMS[Math.floor(R() * 4)], Rt = 3.2 + Math.pow(R(), .85) * 13.5, sc = .28 * Math.max(.6, Rt / 8);
      gcV(Rt + gauss(R) * sc, Math.log(Rt / a.R) / PITCH + gauss(R) * sc / Rt, gauss(R) * .09, p);
      const t = R(); c.setHSL(t < .05 ? .95 : .6, t < .05 ? .7 : .35, .65 + R() * .25); o.size = .008 + Math.pow(R(), 3) * .03; }
    else if (r < .64){ const ph = (R() - .5) * .75; gcV(8.34 + ph * .55 + gauss(R) * .12, ph, gauss(R) * .06, p); c.setHSL(.6, .3, .75); o.size = .008 + Math.pow(R(), 3) * .02; }
    else { gcV(Math.min(18, 1.4 - 2.6 * Math.log(1 - R() * .97)), R() * Math.PI * 2, gauss(R) * .2, p); c.setHSL(.1 + R() * .05, .25, .55 + R() * .25); o.size = .006 + R() * .008; }
  }, 2.6, .9));
  // Globular clusters in the halo (about 160 known)
  MW.add(starCloud(160, (i, p, c, o) => { const rr = 1 + Math.pow(R(), 2.2) * 40, u = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set(GCP.x + rr * s * Math.cos(t), GCP.y + rr * u, GCP.z + rr * s * Math.sin(t)); c.setHSL(.13, .45, .8); o.size = .06; }, 3.5, 1));
  // A neighbourhood of nearby stars around the Sun, so zooming in shows a real-looking star field
  MW.add(starCloud(9000, (i, p, c, o) => { const rr = Math.pow(R(), .5) * .6, u = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set(rr * s * Math.cos(t), rr * u * .35, rr * s * Math.sin(t)); const k = R(); c.setHSL(k < .1 ? .6 : k < .75 ? .1 : .03, k < .1 ? .5 : .45, .7 + R() * .25); o.size = .0006 + Math.pow(R(), 4) * .004; }, 2.6, 1));
}
mwPivot.position.copy(GCP); MW.position.copy(GCP).negate();
const spinners = []; let mwAngle = 0, gSpin = true;
const rotMW = (v, out) => out.copy(v).sub(GCP).applyAxisAngle(UP, mwAngle).add(GCP);
const sgrA = glowSprite('#fff2c8', .6, 1); sgrA.position.copy(GCP); cosmic.add(sgrA);
const youMark = glowSprite('#7fd4ff', 1, 1); cosmic.add(youMark);

/* ---- Telescope photographs (Webb and Hubble), brought to life in a shader ---- */
const IMG_FS = `uniform sampler2D uMap; uniform float uTime, uOpacity, uLayer, uSeed; varying vec2 vUv; varying float vFace;
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
function photoCard(o){
  const g = new THREE.Group(), mk = layer => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms:{ uMap:{ value:null }, uTime:{ value:0 }, uOpacity:{ value:0 }, uLayer:{ value:layer }, uSeed:{ value:o.d % 17 } },
    vertexShader:PLANE_VS, fragmentShader:IMG_FS, transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }));
  // A soft glow in the object's colour, so the photograph sits inside its own light
  const halo = nebula(o.size * 2.6, 1, o.color, o.color, o.color, o.d % 11, 0, .28); g.add(halo);
  const gas = mk(0), stars = mk(1); g.add(gas, stars); billboards.push(gas, stars);
  // Depth layers along the line of sight from Earth give the picture parallax as you orbit it
  const los = o.pos ? o.pos.clone().negate().normalize() : new THREE.Vector3(0, 0, 1);
  gas.position.copy(los).multiplyScalar(-o.size * .06); stars.position.copy(los).multiplyScalar(o.size * .14);
  g.userData = { gas, stars, halo }; g.visible = false; g.material = gas.material; return g;
}
const photoCache = {};
function ensurePhoto(o, tel){
  const key = `${tel}_${o.photo}`;
  const apply = t => { if (o.tel !== tel) return; const im = t.image, u = o.card.userData;
    [u.gas, u.stars].forEach(m => { m.material.uniforms.uMap.value = t; m.scale.set(o.size, o.size * im.height / im.width, 1); }); o.card.visible = true; };
  o.tel = tel;
  if (photoCache[key]){ if (photoCache[key].image) apply(photoCache[key]); return; }
  photoCache[key] = texLoader.load(`tex/photo/${key}.jpg`, t => { t.generateMipmaps = true; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); apply(t); }, undefined, () => {});
}
document.querySelectorAll('#in-tel button').forEach(b => b.addEventListener('click', () => { const o = COS_BY[cosFocus]; if (!o || !o.photo) return; ensurePhoto(o, b.dataset.tel); renderCosInfo(); }));

/* ---- Inside a cluster: real-looking galaxies replace the distant points as you fly in ---- */
const ELL_FS = `uniform float uRatio, uAng, uOpacity, uTime; uniform vec3 uCol; varying vec2 vUv; varying float vFace;
void main(){ vec2 p = (vUv - 0.5) * 2.0; float c = cos(uAng), s = sin(uAng); p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y); p.y /= uRatio;
  float r = length(p); if (r > 1.0) discard; float a = exp(-pow(r * 7.0, 0.5) * 2.2) * 1.6 + 0.25 * exp(-r * r * 5.0);
  gl_FragColor = vec4(uCol * a * uOpacity * smoothstep(1.0, 0.7, r), 1.0); }`;
function ellipticalCard(radius, ratio, ang, col){
  const m = new THREE.ShaderMaterial({ uniforms:{ uRatio:{ value:ratio }, uAng:{ value:ang }, uOpacity:{ value:0 }, uTime:{ value:0 }, uCol:{ value:new THREE.Color(col) } }, vertexShader:PLANE_VS, fragmentShader:ELL_FS,
    transparent:true, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), m); billboards.push(mesh); return mesh;
}
let detailFor = null, detailGroup = null;
function buildDetail(o){
  if (detailGroup){ detailGroup.parent && detailGroup.parent.remove(detailGroup);
    detailGroup.traverse(m => { if (m.isMesh){ m.geometry.dispose(); m.material.dispose(); const i = billboards.indexOf(m); if (i >= 0) billboards.splice(i, 1); } }); }
  detailFor = o; detailGroup = new THREE.Group(); o.obj.add(detailGroup);
  const R = rng(Math.round(o.d) + 3), cols = ['#ffe2bf', '#ffd6a8', '#f6e6d0'], arms = ['#a9c4ff', '#b8ccff', '#c3d2ff'];
  o.members.forEach((m, i) => {
    const radius = i === 0 && o.cluster ? 70 : Math.max(5, Math.min(45, m.size * .22));
    let mesh;
    if (m.ell){ mesh = ellipticalCard(radius * 1.4, m.ratio, m.ang, cols[i % 3]); }
    else { mesh = galaxyDisk({ r:radius, gal:{ arms:2, pitch:10 + R() * 18, r0:radius * .16, armW:.1 + R() * .08, bulge:radius * .09, bar:R() < .35 ? 1.3 : 0, barAng:R() * 3, rs:radius * .3,
        dust:.45 + R() * .4, seed:R() * 30, bright:1.25, arm:arms[i % 3] } });
      mesh.quaternion.setFromEuler(new THREE.Euler(R() * Math.PI * 2, R() * Math.PI * 2, 0)); }
    mesh.position.copy(m.p); detailGroup.add(mesh);
  });
}
function updateDetail(){
  let best = null, bd = Infinity;
  COS.forEach(o => { if (!o.members) return; const d = ccam.position.distanceTo(o.pos) / o.r; if (d < bd){ bd = d; best = o; } });
  if (best && bd < 14){ if (detailFor !== best) buildDetail(best); }
  if (!detailGroup) return;
  const k = detailFor === best ? Math.max(0, Math.min(1, (14 - bd) / 6)) : 0;
  detailGroup.visible = k > 0;
  detailGroup.children.forEach(m => { m.material.uniforms.uOpacity.value = k; });
}

/* ---- Catalogue: position on the sky (l, b), distance d (kpc), radius r (kpc) ---- */
const KPC = { ncp:galV(122.93192, 27.12825, 1, V()).normalize() };
function diskBasis(pos, inc, pa){
  const n = pos.clone().normalize(), north = KPC.ncp.clone().addScaledVector(n, -KPC.ncp.dot(n)).normalize(), east = V().crossVectors(north, n).normalize();
  const major = north.clone().multiplyScalar(Math.cos(pa * DEG)).addScaledVector(east, Math.sin(pa * DEG));
  const minor = V().crossVectors(n, major).normalize(), normal = n.clone().multiplyScalar(Math.cos(inc * DEG)).addScaledVector(minor, Math.sin(inc * DEG)).normalize();
  return { u:major, v:V().crossVectors(normal, major).normalize(), w:normal };
}
const COS = [
  { id:'mw', name:'Milky Way', kind:'Barred spiral · home', tier:'home', color:'#cfd8ff', pos:GCP.clone(), view:62,
    stats:[['Sun to centre','8.275 kpc · 26,990 ly'],['Stellar disk','≈ 100,000 ly across'],['Stars','100–400 billion'],['Mass with dark matter','≈ 1–1.5 trillion Suns']],
    note:'Our galaxy, seen from outside. Arms follow a log-spiral model; their exact shape on the far side is still uncertain.' },
  { id:'sun', name:'Sun', kind:'You are here', tier:'sun', color:'#7fd4ff', pos:V(), view:3,
    stats:[['From galactic centre','8.275 kpc'],['Above the plane','20.8 pc'],['Orbital speed','≈ 251.9 km/s'],['One orbit','≈ 210–230 Myr']],
    note:'The Sun sits in the Orion Spur, a minor arm between the Sagittarius–Carina and Perseus arms.' },
  { id:'sgra', name:'Sagittarius A*', kind:'Supermassive black hole', tier:'core', color:'#fff2c8', pos:GCP.clone(), view:2,
    stats:[['Distance','8.275 kpc'],['Mass','4.3 million Suns']], note:'Weighed from the orbits of stars around it; imaged by the Event Horizon Telescope in 2022.' },
  { id:'lmc', name:'Large Magellanic Cloud', kind:'Barred dwarf spiral', tier:'sat', l:280.47, b:-32.89, d:49.59, r:4.5, inc:25, pa:150, color:'#bcd2ff', n:2500, view:16,
    gal:{ arms:1, pitch:28, r0:1.2, armW:.25, bulge:.45, bar:2.4, barAng:.4, rs:1.4, irr:.7, dust:.4, seed:8.8, core:'#ece6d6', arm:'#b3c9ff', disk:'#c8c8d8', bright:1.4 },
    note:'The largest Milky Way satellite, visible to the naked eye from the southern hemisphere. Distance from eclipsing binaries, 1% precision.', src:'Pietrzyński et al. 2019' },
  { id:'smc', name:'Small Magellanic Cloud', kind:'Dwarf irregular', tier:'sat', l:302.80, b:-44.30, d:62.44, r:2.5, inc:65, pa:45, color:'#c9d6ff', n:1200, view:10,
    gal:{ arms:0, pitch:20, bulge:.7, bar:1.6, rs:.9, irr:1, dust:.2, seed:2.4, core:'#dfe3f0', arm:'#b8c8ff', disk:'#c4cbe0', bright:1.4 }, src:'Graczyk et al. 2020' },
  { id:'sgr', name:'Sagittarius Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:5.57, b:-14.17, d:26, r:1.5, color:'#ffe0b0', n:500, stars:7000, elong:3.2, view:8, note:'Being torn apart by the Milky Way; its stars stream around the galaxy.', src:'McConnachie 2012' },
  { id:'dra', name:'Draco Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:86.37, b:34.72, d:76, r:.4, color:'#ffe9c8', n:150, view:3, src:'McConnachie 2012' },
  { id:'umi', name:'Ursa Minor Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:104.97, b:44.80, d:76, r:.4, color:'#ffe9c8', n:150, view:3, src:'McConnachie 2012' },
  { id:'scl', name:'Sculptor Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:287.53, b:-83.16, d:86, r:.4, color:'#ffe9c8', n:150, view:3, src:'McConnachie 2012' },
  { id:'sex', name:'Sextans Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:243.50, b:42.27, d:86, r:.5, color:'#ffe9c8', n:150, view:3, src:'McConnachie 2012' },
  { id:'car', name:'Carina Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:260.11, b:-22.22, d:105, r:.3, color:'#ffe9c8', n:120, view:3, src:'McConnachie 2012' },
  { id:'fnx', name:'Fornax Dwarf', kind:'Dwarf spheroidal', tier:'sat', l:237.10, b:-65.65, d:147, r:.8, color:'#ffe9c8', n:220, stars:5000, view:4, src:'McConnachie 2012' },
  { id:'leo2', name:'Leo II', kind:'Dwarf spheroidal', tier:'sat', l:220.17, b:67.23, d:233, r:.2, color:'#ffe9c8', n:100, view:3, src:'McConnachie 2012' },
  { id:'leo1', name:'Leo I', kind:'Dwarf spheroidal', tier:'sat', l:225.99, b:49.11, d:254, r:.3, color:'#ffe9c8', n:120, view:3, src:'McConnachie 2012' },
  { id:'m42', name:'Orion Nebula', alt:'M42', kind:'Emission nebula · star nursery', tier:'neb', l:209.01, b:-19.38, d:.414, size:.0074, color:'#ff8fa8', view:.022,
    neb:{ type:0, c1:'#ff5f86', c2:'#5fd2c4', c3:'#ffd3a0', stars:.9, cluster:40 }, stats:[['Diameter','≈ 24 ly']], note:'The nearest large star-forming region, visible to the naked eye in Orion\'s sword. The Trapezium cluster at its heart lights the gas.', src:'Menten et al. 2007' },
  { id:'m45', name:'Pleiades', alt:'M45', kind:'Young open cluster', tier:'neb', l:166.57, b:-23.52, d:.136, size:.009, color:'#8fb6ff', view:.025,
    neb:{ type:1, c1:'#6fa4ff', c2:'#6fa4ff', stars:.5, cluster:70, op:.8 }, stats:[['Age','≈ 100 million years']], note:'The Seven Sisters: hot blue stars drifting through a dust cloud that reflects their light.', src:'Gaia' },
  { id:'carina', name:'Carina Nebula', kind:'Emission nebula', tier:'neb', l:287.6, b:-0.63, d:2.3, size:.09, color:'#ffa070', view:.25,
    neb:{ type:0, c1:'#ff7a4f', c2:'#e65a9a', c3:'#ffe0a8', stars:.7, cluster:80 }, stats:[['Diameter','≈ 300 ly']], note:'One of the largest star-forming regions in the galaxy, home to the unstable giant Eta Carinae.' },
  { id:'m16', name:'Eagle Nebula', alt:'M16', kind:'Emission nebula', tier:'neb', l:16.95, b:.79, d:1.74, size:.022, color:'#7fd8b8', view:.06,
    neb:{ type:0, c1:'#3fbf9e', c2:'#d8b36a', c3:'#fff0c0', stars:.6, cluster:30 }, note:'Home of the Pillars of Creation, columns of gas and dust where new stars are forming.' },
  { id:'m8', name:'Lagoon Nebula', alt:'M8', kind:'Emission nebula', tier:'neb', l:6.06, b:-1.20, d:1.25, size:.033, color:'#ff8fb8', view:.09,
    neb:{ type:0, c1:'#ff5f8f', c2:'#ffb0cc', c3:'#ffe7c8', stars:.6, cluster:40 }, note:'A giant cloud toward the galactic centre, bright enough to see with binoculars.' },
  { id:'m1', name:'Crab Nebula', alt:'M1', kind:'Supernova remnant', tier:'neb', l:184.56, b:-5.78, d:2.0, size:.0034, color:'#8fb8ff', view:.01,
    neb:{ type:2, c1:'#7fb6ff', c2:'#ff9a5c', stars:.9 }, stats:[['Diameter','≈ 11 ly']], note:'The wreck of a star whose explosion was recorded by astronomers in 1054. A pulsar spins 30 times a second at its centre.' },
  { id:'cliffs', name:'Cosmic Cliffs', alt:'NGC 3324', kind:'Star-forming region · Carina Nebula', tier:'neb', l:286.22, b:-.18, d:2.3, size:.0045, photo:'carina', color:'#ffb27a', view:.0058,
    stats:[['Tallest peaks','≈ 7 light-years']], note:'Webb\'s infrared view of the edge of a giant cavity in the Carina Nebula. The "mountains" are walls of gas and dust eroded by hot young stars above them, with newborn stars shining through.' },
  { id:'ring', name:'Southern Ring Nebula', alt:'NGC 3132', kind:'Planetary nebula · a dying star', tier:'neb', l:272.11, b:12.40, d:.77, size:.0003, photo:'southern_nebula', color:'#ff9a70', view:.00042,
    stats:[['Nebula','≈ 0.5 light-years across']], note:'Shells of gas thrown off by a dying Sun-like star. Webb revealed the faint second star at its centre that shaped them.' },
  { id:'tarantula', name:'Tarantula Nebula', alt:'30 Doradus', kind:'Star-forming region · in the LMC', tier:'sat', l:279.47, b:-31.67, d:49.59, size:.104, photo:'tarantula', color:'#8fd0ff', view:.135,
    stats:[['Shown','≈ 340 light-years across']], note:'The largest and brightest star-forming region in the Local Group, inside the Large Magellanic Cloud. Webb found thousands of young stars hidden in its dust.' },
  { id:'m31', name:'Andromeda', alt:'M31', kind:'Spiral · largest in the Local Group', tier:'lg', l:121.17, b:-21.57, d:761, r:23, inc:77, pa:38, color:'#ffe2b8', n:9000, view:90,
    gal:{ arms:2, pitch:8, r0:3.2, armW:.12, bulge:1.9, rs:5.8, ringR:10, ringS:1.1, dust:.55, seed:11, core:'#ffd8a8', arm:'#b5c8ff', disk:'#d9c6a8', bright:1.15 },
    stats:[['Diameter','≈ 150,000 ly'],['Approach speed','≈ 110 km/s']],
    note:'Heading toward us. A 2025 study (Sawala et al.) puts the chance of a merger with the Milky Way within 10 billion years at about 50%.', src:'Li et al. 2021' },
  { id:'m32', name:'M32', kind:'Compact elliptical', tier:'sat2', l:121.15, b:-21.98, d:785, r:.6, color:'#ffe9c8', n:200, stars:5000, elong:1.15, view:8, src:'McConnachie 2012' },
  { id:'m110', name:'M110', kind:'Dwarf elliptical', tier:'sat2', l:120.72, b:-21.14, d:824, r:1.5, color:'#ffe9c8', n:300, stars:5000, elong:1.8, view:10, src:'McConnachie 2012' },
  { id:'m33', name:'Triangulum', alt:'M33', kind:'Spiral', tier:'lg', l:133.61, b:-31.33, d:809, r:9, inc:55, pa:23, color:'#cfe0ff', n:4000, view:40,
    gal:{ arms:2, pitch:24, r0:1.1, armW:.17, bulge:.35, rs:1.8, irr:.3, dust:.6, seed:5.2, core:'#ffe1b8', arm:'#a8c6ff', disk:'#b9c4d8', bright:1.3 },
    stats:[['Diameter','≈ 60,000 ly']], note:'Third-largest Local Group galaxy, probably bound to Andromeda.', src:'McConnachie 2012' },
  { id:'n6822', name:'NGC 6822', alt:'Barnard\'s Galaxy', kind:'Dwarf irregular', tier:'lg', l:25.34, b:-18.40, d:459, r:1.5, inc:50, pa:10, color:'#d6e2ff', n:400, view:10, gal:{ arms:0, pitch:20, bulge:.3, bar:1.2, rs:.5, irr:1, dust:.2, seed:4.1, core:'#e3e6f2', arm:'#b8c8ff', disk:'#c4cbe0', bright:1.4 }, src:'McConnachie 2012' },
  { id:'ic1613', name:'IC 1613', kind:'Dwarf irregular', tier:'lg', l:129.73, b:-60.58, d:755, r:1.5, inc:40, pa:60, color:'#d6e2ff', n:350, view:10, gal:{ arms:0, pitch:20, bulge:.3, rs:.55, irr:1, dust:.15, seed:6.3, core:'#e3e6f2', arm:'#b8c8ff', disk:'#c4cbe0', bright:1.3 }, src:'McConnachie 2012' },
  { id:'wlm', name:'WLM', kind:'Dwarf irregular', tier:'lg', l:75.86, b:-73.62, d:933, r:1.2, inc:70, pa:0, color:'#d6e2ff', n:300, view:10, gal:{ arms:0, pitch:20, bulge:.25, rs:.45, irr:1, dust:.15, seed:7.7, core:'#e3e6f2', arm:'#b8c8ff', disk:'#c4cbe0', bright:1.3 }, src:'McConnachie 2012' },
  { id:'scg', name:'Sculptor Group', alt:'NGC 253', kind:'Galaxy group', tier:'grp', l:97.37, b:-87.96, d:3500, r:350, color:'#d8e2ff', n:70, group:true, view:2500, src:'Karachentsev et al.' },
  { id:'m81', name:'M81 Group', kind:'Galaxy group', tier:'grp', l:142.09, b:40.90, d:3630, r:300, color:'#d8e2ff', n:60, group:true, view:2500, src:'Karachentsev et al.' },
  { id:'cena', name:'Centaurus A Group', kind:'Galaxy group', tier:'grp', l:309.52, b:19.42, d:3800, r:350, color:'#ffe2c0', n:70, group:true, view:2500, src:'Karachentsev et al.' },
  { id:'virgo', name:'Virgo Cluster', kind:'Galaxy cluster · 1,300+ galaxies', tier:'lu', l:283.78, b:74.49, d:16500, r:2200, color:'#ffe6c6', n:900, cluster:true, view:7000,
    note:'The nearest large cluster and the heart of our Local Supercluster. Its pull slows the Local Group\'s cosmic expansion.', src:'Mei et al. 2007' },
  { id:'fornax', name:'Fornax Cluster', kind:'Galaxy cluster', tier:'lu', l:236.72, b:-53.64, d:20000, r:700, color:'#ffe6c6', n:300, cluster:true, view:2600, src:'Blakeslee et al. 2009' },
  { id:'cent', name:'Centaurus Cluster', kind:'Galaxy cluster', tier:'lu', l:302.4, b:21.6, d:48900, r:1500, color:'#ffe6c6', n:500, cluster:true, view:5200, src:'redshift, H₀ = 70' },
  { id:'hydra', name:'Hydra Cluster', kind:'Galaxy cluster', tier:'lu', l:269.6, b:26.5, d:54000, r:1500, color:'#ffe6c6', n:450, cluster:true, view:5200, src:'redshift, H₀ = 70' },
  { id:'norma', name:'Norma Cluster', kind:'Galaxy cluster · Great Attractor', tier:'lu', l:325.3, b:-7.3, d:67300, r:2000, color:'#ffd9b0', n:650, cluster:true, view:7000,
    note:'Sits near the centre of the Great Attractor, the mass concentration our part of the universe is flowing toward. Hidden behind the Milky Way\'s disk.', src:'redshift, H₀ = 70' },
  { id:'perseus', name:'Perseus Cluster', kind:'Galaxy cluster', tier:'lu', l:150.57, b:-13.26, d:76700, r:2000, color:'#ffe6c6', n:700, cluster:true, view:7000, note:'Part of the Perseus–Pisces Supercluster, outside Laniakea.', src:'redshift, H₀ = 70' },
  { id:'coma', name:'Coma Cluster', kind:'Galaxy cluster · 1,000+ galaxies', tier:'lu', l:58.08, b:87.96, d:99000, r:3000, color:'#ffe6c6', n:1000, cluster:true, view:10000,
    note:'Where Fritz Zwicky first found evidence for dark matter in 1933. Lies just outside Laniakea.', src:'redshift, H₀ = 70' },
  { id:'sq', name:'Stephan\'s Quintet', kind:'Compact galaxy group · colliding', tier:'grp2', l:93.25, b:-20.99, d:89000, size:150, photo:'stephans_quintet', color:'#ffd9a8', view:195,
    note:'Four of its galaxies are locked in a slow collision 290 million light-years away; the fifth, NGC 7320, is much closer and only lines up by chance. Webb sees shock waves rippling between them.' },
  { id:'cartwheel', name:'Cartwheel Galaxy', kind:'Ring galaxy · after a collision', tier:'grp2', l:326.31, b:-82.78, d:153000, size:100, photo:'cartwheel', color:'#a8c8ff', view:130,
    note:'A smaller galaxy punched through it about 400 million years ago, sending a ring of star formation rippling outward like a stone dropped in a pond.' },
  { id:'smacs', name:'Webb\'s First Deep Field', alt:'SMACS 0723', kind:'Galaxy cluster · gravitational lens', tier:'top', l:284.99, b:-23.7, d:1530000, size:800, photo:'deep_field', color:'#ffe6c6', view:1050, noAuto:true,
    stats:[['Redshift','z = 0.39'],['Light left it','≈ 4.6 billion years ago'],['Comoving distance','≈ 1.5 Gpc'],['Released','12 July 2022']],
    note:'The cluster\'s gravity bends and magnifies light from galaxies far behind it; some of those arcs left their galaxies more than 13 billion years ago. A patch of sky the size of a grain of sand held at arm\'s length.' }
];
const COS_BY = {}; COS.forEach(o => COS_BY[o.id] = o);
{
  COS.forEach((o, k) => {
    if (o.l === undefined) return;
    o.pos = galV(o.l, o.b, o.d, V());
    const toSun = o.pos.clone().negate().normalize(); o.viewDir = toSun.clone().add(new THREE.Vector3(0, .25, 0)).normalize();
    const R = rng(k * 71 + 5), g = new THREE.Group(); g.position.copy(o.pos); cosmic.add(g); o.obj = g;
    if (o.gal){
      const B = diskBasis(o.pos, o.inc ?? 50, o.pa ?? 0), spin = new THREE.Group();
      spin.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(B.u, B.v, B.w)); g.add(spin); spin.add(galaxyDisk(o)); o.spin = spin; spinners.push(o);
      o.viewDir = B.w.clone().multiplyScalar(B.w.dot(toSun) >= 0 ? .5 : -.5).add(toSun.clone().multiplyScalar(.9)).normalize();   // close to how we see it from Earth
      const rs = o.gal.rs;
      g.add(starCloud(o.n, (i, p, c, s) => {
        const rr = Math.min(o.r, -rs * Math.log(1 - R() * .99)), th = R() * Math.PI * 2, z = gauss(R) * rs * .05;
        p.set(rr * Math.cos(th), rr * Math.sin(th), z);
        const blue = R() < .6; c.setHSL(blue ? .6 : .1, blue ? .35 : .45, .7 + R() * .2); s.size = o.r / 900 + Math.pow(R(), 4) * o.r / 200;
      }, 2.2, .55).translateZ(0)); spin.add(g.children.pop());
    } else if (o.cluster || o.group){
      g.add(galaxyCloud(o.n, (i, p, c, s) => {
        const rr = o.r * .25 * Math.sqrt(1 / Math.pow(1 - R() * .96, 2 / 3) - 1), u = R() * 2 - 1, t = R() * Math.PI * 2, sq = Math.sqrt(1 - u * u);
        p.set(rr * sq * Math.cos(t), rr * u, rr * sq * Math.sin(t));
        const ell = R() < (o.cluster ? .65 : .35); c.setHSL(ell ? .09 : .6, ell ? .5 : .35, .68 + R() * .2);
        s.size = (i === 0 && o.cluster ? 280 : 30 + Math.pow(R(), 3) * 140) * (o.group ? .35 : 1); s.ang = R() * Math.PI; s.ratio = ell ? .55 + R() * .45 : .18 + R() * .5;
        if (i === 0){ p.set(0, 0, 0); s.ratio = .9; }
        if (i < (o.group ? 40 : 90)) (o.members = o.members || []).push({ p:p.clone(), size:s.size, ell, ang:s.ang, ratio:s.ratio });
      }, 16));
      g.add(glowSprite(o.color, o.r * 1.5, o.cluster ? .2 : .12));
    } else if (o.photo){ o.card = photoCard(o); g.add(o.card); o.tel = 'webb';
    } else if (o.neb){
      const nb = o.neb; g.add(nebula(o.size, nb.type, nb.c1, nb.c2, nb.c3 || nb.c1, k * 1.37 + 2, nb.stars || 0, nb.op || 1));
      if (nb.cluster) g.add(starCloud(nb.cluster, (i, p, c, s) => { const rr = Math.abs(gauss(R)) * o.size * .18, u = R() * 2 - 1, t = R() * Math.PI * 2, sq = Math.sqrt(1 - u * u);
        p.set(rr * sq * Math.cos(t), rr * u, rr * sq * Math.sin(t)); c.setHSL(.6, .5, .85); s.size = o.size * (.01 + Math.pow(R(), 3) * .05); }, 4, 1));
    } else { // dwarf spheroidal or elliptical: thousands of resolved old stars in a Plummer profile, plus unresolved glow
      const ell = o.elong || 1.4, n = o.stars || 3000, compact = o.kind.includes('elliptical');
      g.add(nebula(o.r * (compact ? 2 : 1.7), 3, o.color, o.color, o.color, k * 1.3, 0, compact ? .7 : .3));
      const ax = V().randomDirection ? V().randomDirection() : new THREE.Vector3(1, 0, 0);
      g.add(starCloud(n, (i, p, c, s) => {
        const rr = o.r * .55 * Math.sqrt(1 / Math.pow(1 - R() * .985, 2 / 3) - 1), u = R() * 2 - 1, t = R() * Math.PI * 2, sq = Math.sqrt(1 - u * u);
        p.set(rr * sq * Math.cos(t) * ell, rr * u / ell, rr * sq * Math.sin(t)).applyAxisAngle(UP, k);
        const tpe = R(); c.setHSL(tpe < .08 ? .6 : tpe < .55 ? .1 : .06, tpe < .08 ? .5 : .55, .62 + R() * .3);   // a few blue horizontal-branch stars among red giants
        s.size = o.r / 140 * (.5 + Math.pow(R(), 5) * 3); }, 2.4, 1));
    }
  });
}
// The Local Group, and Laniakea (outline is schematic: centred on the Great Attractor, about 160 Mpc across)
const LG_CENTRE = GCP.clone().lerp(COS_BY.m31.pos, .42);
COS.push({ id:'lg', name:'Local Group', kind:'Our galaxy group · 80+ galaxies', tier:'lu', color:'#bcd2ff', pos:LG_CENTRE, view:2000,
  stats:[['Diameter','≈ 3 Mpc · 10 million ly'],['Largest members','Andromeda, Milky Way, Triangulum']],
  note:'Bound together by gravity while the rest of the universe expands away. Its mass is dominated by Andromeda and the Milky Way.' });
const LAN_C = COS_BY.norma.pos.clone(), LAN_R = 80000;
const lanShell = new THREE.Mesh(new THREE.SphereGeometry(LAN_R, 64, 40), (() => { const m = fresnelMat('#5f8dff', 3.5, .22); m.depthTest = false; return m; })());
lanShell.position.copy(LAN_C); cosmic.add(lanShell);
COS.push({ id:'lan', name:'Laniakea Supercluster', kind:'Our home supercluster', tier:'top', color:'#8fb0ff', pos:LAN_C.clone(), labelPos:LAN_C.clone().add(new THREE.Vector3(0, LAN_R * .98, 0)), view:320000,
  stats:[['Diameter','≈ 160 Mpc · 520 million ly'],['Mass','≈ 10¹⁷ Suns'],['Galaxies','≈ 100,000']],
  note:'Defined in 2014 by the flow of galaxies toward the Great Attractor. The outline here is a schematic sphere, not the true irregular boundary.', src:'Tully et al. 2014' });
COS_BY.lg = COS[COS.length - 2]; COS_BY.lan = COS[COS.length - 1];


/* ---- Levels, labels, chips ---- */
const LEVELS = {
  mw:{ focus:'mw', chips:['mw','sun','cliffs','ring','m42','m45','m16','m8','m1','carina','tarantula','sgra','lmc','smc','sgr'], dir:new THREE.Vector3(-.42, .72, .55) },
  lg:{ focus:'lg', chips:['lg','mw','m31','m33','lmc','tarantula','n6822','ic1613','wlm'], dir:new THREE.Vector3(.25, .78, .58) },
  lu:{ focus:'lan', chips:['lan','lg','virgo','norma','coma','sq','cartwheel','smacs','fornax','cena','m81','scg','cent','hydra','perseus'], dir:new THREE.Vector3(.35, .72, .6) }
};
LEVELS.lu.view = 300000;
const TIER_RANGE = { grp2:[4000, 1e9], neb:[0, 3], core:[0, 25], home:[0, 60000], sun:[0, 400], sat:[0, 1400], sat2:[0, 60], lg:[120, 12000], grp:[4000, 110000], lu:[4000, 1e9], top:[60000, 1e9] };
const cosLabels = COS.map(o => { const el = document.createElement('div'); el.className = 'lbl cos'; el.hidden = true; el.innerHTML = `<i style="background:${o.color}"></i>${o.name}`; el.addEventListener('click', () => focusCosmic(o.id)); labelsLayer.appendChild(el); return { o, el }; });
const armLabels = [...ARMS.map(a => ({ name:a.name, pos:gcV(Math.min(15, a.R * 1.18), Math.log(Math.min(15, a.R * 1.18) / a.R) / PITCH, 0, V()) })), { name:'Orion Spur', pos:gcV(8.5, .3, 0, V()) }]
  .map(a => { const el = document.createElement('div'); el.className = 'lbl guide'; el.style.color = '#8fb0ff'; el.textContent = a.name; el.hidden = true; labelsLayer.appendChild(el); return { ...a, el }; });
const cbar = $('#cbar');
function buildCosmicChips(level){
  cbar.innerHTML = '';
  LEVELS[level].chips.forEach(id => { const o = COS_BY[id], b = document.createElement('button'); b.className = 'chip'; b.dataset.cid = id;
    b.innerHTML = `<i style="background:${o.color};box-shadow:0 0 8px ${o.color}"></i>${o.name}`; b.addEventListener('click', () => focusCosmic(id)); cbar.appendChild(b); });
}

/* ---- Info card ---- */
const fmtKpc = k => k < 1 ? `${Math.round(k * 1000)} pc` : k < 1000 ? `${k < 10 ? k.toFixed(2) : k.toFixed(k < 100 ? 1 : 0)} kpc` : `${(k / 1000).toFixed(k < 10000 ? 2 : 1)} Mpc`;
function fmtLy(ly){ if (ly < 1e6) return `${Math.round(ly).toLocaleString('en-GB')} ly`; if (ly < 1e9) return `${(ly / 1e6).toFixed(ly < 1e7 ? 2 : 1)} million ly`; return `${(ly / 1e9).toFixed(2)} billion ly`; }
let cosFocus = 'mw';
function renderCosInfo(){
  const o = COS_BY[cosFocus];
  $('#in-name').textContent = o.name + (o.alt ? ` · ${o.alt}` : ''); $('#in-kind').textContent = o.kind;
  $('#in-sw').style.background = o.color; $('#in-sw').style.color = o.color;
  let stats = [];
  if (o.d !== undefined && !o.noAuto){ const ly = o.d * KPC_LY; stats.push(['Distance', fmtKpc(o.d)], ['In light-years', fmtLy(ly)], ['Light left it', `${fmtLy(ly).replace(' ly', '')} years ago`]); }
  (o.stats || []).forEach(s => { if (s[1]) stats.push(s); });
  if (o.src) stats.push(['Distance source', o.src]);
  if (o.photo){ stats.push(['Image', o.tel === 'hubble' ? 'NASA, ESA, STScI · Hubble' : 'NASA, ESA, CSA, STScI · Webb']); ensurePhoto(o, o.tel); }
  $('#in-tel').hidden = !o.photo; document.querySelectorAll('#in-tel button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tel === o.tel)));
  $('#in-stats').innerHTML = stats.map(([k, v]) => stat(k, v)).join('');
  $('#in-note').textContent = o.note || (o.l !== undefined ? `Galactic longitude ${o.l.toFixed(1)}°, latitude ${o.b >= 0 ? '+' : ''}${o.b.toFixed(1)}°.` : '');
  $('#in-status').hidden = true;
  cbar.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cid === cosFocus)));
  cosLabels.forEach(L => L.el.classList.toggle('on', L.o.id === cosFocus));
}

/* ---- Flight: log-distance zoom ---- */
const FLY = { on:false, t:0, dur:2.8, fT:V(), tT:V(), fD:1, tD:1, fDir:V(), tDir:V() };
function flyTo(target, dist, dir, dur){
  FLY.fT.copy(controls.target); FLY.tT.copy(target); FLY.fD = Math.max(1e-4, ccam.position.distanceTo(controls.target)); FLY.tD = dist;
  FLY.fDir.subVectors(ccam.position, controls.target).normalize(); FLY.tDir.copy(dir ? dir.clone().normalize() : FLY.fDir);
  FLY.t = 0; FLY.dur = reduceMotion ? .01 : (dur || Math.min(4.2, 1.6 + Math.abs(Math.log10(FLY.tD / FLY.fD)) * .6)); FLY.on = true;
}
controls.addEventListener('start', () => { FLY.on = false; });
function focusCosmic(id, dir){
  const o = COS_BY[id]; cosFocus = id; renderCosInfo();
  flyTo(o.pos, o.view, dir || o.viewDir);
}

/* ---- Switching scales ---- */
const solarCam = { pos:V(), target:V(), min:2, max:6000 };
const LEVEL_HASH = { solar:'solar-system', mw:'milky-way', lg:'local-group', lu:'local-universe' };
function setLevel(lv){
  try { history.replaceState(null, '', '#' + LEVEL_HASH[lv]); } catch (e) {}
  if (lv === S.level) { if (lv !== 'solar') focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir); return; }
  const from = S.level;
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === lv)));
  if (CINE.on) stopCine();
  if (from === 'solar' || lv === 'solar'){
    $('#fade').classList.add('on');
    setTimeout(() => {
      if (lv === 'solar'){ // back home
        S.level = 'solar'; controls.object = camera; controls.minDistance = solarCam.min; controls.maxDistance = solarCam.max;
        camera.position.copy(solarCam.pos); controls.target.copy(solarCam.target); FLY.on = false;
        $('#hud').classList.remove('cosmic'); setCosmicLabels(false); renderInfo(); setFocus(focus, { dist: camera.position.distanceTo(controls.target) });
      } else {
        solarCam.pos.copy(camera.position); solarCam.target.copy(controls.target);
        S.level = lv; controls.object = ccam; controls.minDistance = .0001; controls.maxDistance = 700000;
        controls.target.set(0, 0, 0); ccam.position.copy(LEVELS[lv].dir).normalize().multiplyScalar(.004);   // start at the Sun
        $('#hud').classList.add('cosmic'); setCosmicLabels(true); setPanel(false);
        buildCosmicChips(lv); focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir);
        FLY.dur = reduceMotion ? .01 : 4.2;
      }
      setTimeout(() => $('#fade').classList.remove('on'), 60);
    }, reduceMotion ? 0 : 420);
  } else {
    S.level = lv; buildCosmicChips(lv); focusCosmic(LEVELS[lv].focus, LEVELS[lv].dir);
  }
}
function setCosmicLabels(on){
  for (const k in labelEls) labelEls[k].el.hidden = on;
  subLabels.forEach(s => s.el.hidden = on); guideObjs.forEach(g => g.el.hidden = on); heliLabels.forEach(h => h.el.hidden = on);
  if (!on){ cosLabels.forEach(L => L.el.hidden = true); armLabels.forEach(a => a.el.hidden = true); }
}
document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));
$('#b-gspin').addEventListener('click', e => { gSpin = !gSpin; e.currentTarget.setAttribute('aria-pressed', String(gSpin)); e.currentTarget.textContent = gSpin ? 'Galaxies turning' : 'Galaxies still'; });

/* ---- Per-frame ---- */
let cosUi = 0;
function updateCosmic(realDt){
  controls.autoRotate = false;
  if (FLY.on){
    FLY.t = Math.min(1, FLY.t + realDt / FLY.dur); const e = smoother(FLY.t);
    controls.target.lerpVectors(FLY.fT, FLY.tT, e);
    const D = Math.exp(Math.log(FLY.fD) + (Math.log(FLY.tD) - Math.log(FLY.fD)) * e);
    tmp.copy(FLY.fDir).lerp(FLY.tDir, e).normalize();
    ccam.position.copy(controls.target).addScaledVector(tmp, D);
    if (FLY.t >= 1) FLY.on = false;
  }
  controls.update();
  const D = ccam.position.distanceTo(controls.target);
  ccam.near = Math.max(1e-5, D / 2000); ccam.far = Math.max(D * 60, 2000); ccam.updateProjectionMatrix();
  // Fade detail in and out with zoom
  lanShell.visible = D > 30000; lanShell.material.uniforms.uStr.value = Math.min(.22, (D - 30000) / 300000);
  billboards.forEach(b => { b.quaternion.copy(ccam.quaternion); b.material.uniforms.uTime.value += realDt; }); updateStarScale();
  updateDetail();
  COS.forEach(o => { if (o.photo && o.card){ if (!o.card.userData.gas.material.uniforms.uMap.value && ccam.position.distanceTo(o.pos) < o.size * 600) ensurePhoto(o, o.tel);
    const ud = o.card.userData; if (o.card.visible && ud.gas.material.uniforms.uOpacity.value < 1){ const v = Math.min(1, ud.gas.material.uniforms.uOpacity.value + realDt * .8); ud.gas.material.uniforms.uOpacity.value = ud.stars.material.uniforms.uOpacity.value = v; } } });
  // Galaxy rotation, sped up about 30 trillion times. The Milky Way only turns when seen from outside, and settles back to today's orientation as you fly in.
  const w = .03 * realDt;
  if (gSpin) spinners.forEach(o => o.spin.rotateZ(-w * Math.min(2, 8 / o.r)));
  if (gSpin && D > 120) mwAngle -= w; else if (D < 70) mwAngle *= 1 - Math.min(1, realDt * 1.2);
  mwPivot.rotation.y = mwAngle; rotMW(V0, youMark.position); COS_BY.sun.pos.copy(youMark.position);
  const pulse = 1 + Math.sin(performance.now() * .004) * .15;
  youMark.scale.setScalar(D * .018 * pulse); youMark.material.opacity = D > 5000 || D < .05 ? 0 : .9;
  sgrA.scale.setScalar(Math.max(.05, D * .006));
  // Labels
  if (S.labels){
    const W = innerWidth, H = innerHeight;
    const place = (el, pos, show) => { if (!show){ el.hidden = true; return; } proj.copy(pos).project(ccam); const vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05; el.hidden = !vis; if (vis) el.style.transform = `translate(${((proj.x * .5 + .5) * W + 10).toFixed(1)}px,${((-proj.y * .5 + .5) * H - 10).toFixed(1)}px)`; };
    cosLabels.forEach(L => { const r = TIER_RANGE[L.o.tier], far = ccam.position.distanceTo(L.o.pos) > Math.max(D * 60, 40);
      place(L.el, L.o.labelPos || L.o.pos, L.o.id === cosFocus || (D >= r[0] && D <= r[1] && !far)); });
    armLabels.forEach(a => place(a.el, rotMW(a.pos, sv), D > 8 && D < 160));
  }
  cosUi += realDt;
  if (cosUi > .15){ cosUi = 0; const w = 2 * D * Math.tan(ccam.fov * DEG / 2) * ccam.aspect; $('#cos-scale').textContent = `View ≈ ${fmtLy(w * KPC_LY)} across`; }
}

/* ================= FRAME LOOP ================= */
const clock = new THREE.Clock(); let uiAcc = 0, audioAcc = 0; const proj = V();
let lastTable = 0;
function frame(){
  requestAnimationFrame(frame);
  const rawDt = clock.getDelta(), realDt = Math.min(rawDt, .05);
  watchPerf(rawDt);

  // Advance time
  if (S.travel){
    const tr = S.travel; tr.t = Math.min(1, tr.t + Math.min(rawDt, .25) / tr.dur);
    const e = tr.t < .5 ? 4 * tr.t ** 3 : 1 - Math.pow(-2 * tr.t + 2, 3) / 2;
    S.jd = tr.from + (tr.to - tr.from) * e; S.anchorJD = S.jd;
    if (tr.t >= 1){ S.jd = tr.to; S.anchorJD = S.jd; S.travel = null; $('#warp').classList.remove('on'); clearTrails(); tr.after && tr.after(); }
  } else if (S.playing && !S.scrubbing){
    const tgt = RATES[S.rate].d; S.rateCur = Math.exp(Math.log(S.rateCur) + (Math.log(tgt) - Math.log(S.rateCur)) * (1 - Math.exp(-realDt * 5)));
    const next = S.jd + S.dir * S.rateCur * realDt;
    if (next > Eph.MAX_JD || next < Eph.MIN_JD){ S.jd = clampJD(next); setPlaying(false); toast('Edge of JPL\'s fitted range, 3000 BC to AD 3000'); }
    else S.jd = next;
  }

  if (S.level !== 'solar'){ updateCosmic(realDt); renderer.render(cosmic, ccam); return; }
  updateWorld(realDt);
  scene.updateMatrixWorld();

  // Wakes sample on simulated time
  if (!S.travel && !S.scrubbing){
    const minStep = Math.max(.05, RATES[S.rate].d / 90);
    if (S.lastSample === null || Math.abs(S.jd - S.lastSample) >= minStep){
      if (S.lastSample === null) clearTrails();
      S.lastSample = S.jd;
      for (const n in bodies) pushTrail(trails[n], bodies[n].mesh.getWorldPosition(tmp));
      pushTrail(trails.Sun, sunPos); if (voyVisible) pushTrail(trails['Voyager 1'], voyager.position);
      if (S.trails) drawAllTrails();
    }
  }

  // Floating origin for long galactic runs
  if (sunPos.length() > 4000){
    const s = sunPos.clone(); S.anchorJD = S.jd; sunPos.set(0, 0, 0); sunGroup.position.set(0, 0, 0);
    camera.position.sub(s); controls.target.sub(s); prevFocus.sub(s); voyager.position.sub(s);
    for (const k in trails){ const t = trails[k]; for (let i = 0; i < t.count; i++){ t.ring[i*3] -= s.x; t.ring[i*3+1] -= s.y; t.ring[i*3+2] -= s.z; } }
    for (let i = 0; i < DUST; i++){ dustPos[i*3] -= s.x; dustPos[i*3+1] -= s.y; dustPos[i*3+2] -= s.z; }
    if (CINE.on){ CINE.fromPos.sub(s); CINE.fromLook.sub(s); CINE.look.sub(s); }
    scene.updateMatrixWorld(); drawAllTrails();
  }


  // Camera: cinematic director, or ride with the focused body
  idleT += realDt; controls.autoRotate = !CINE.on && !FL.on && S.level === 'solar' && idleT > 20 && !reduceMotion; controls.autoRotateSpeed = .35;
  if (CINE.on){ updateCine(realDt); focusPos(focus, prevFocus); }
  else {
  if (Math.abs(camera.fov - 50) > .01){ camera.fov += (50 - camera.fov) * Math.min(1, realDt * 3); camera.updateProjectionMatrix(); }
  if (focus === 'Voyager 1' && !voyVisible) setFocus('Sun');
  focusPos(focus, fp);
  if (FL.on){
    FL.t = Math.min(1, FL.t + rawDt / FL.dur); const e = smoother(FL.t), arc = Math.sin(Math.PI * e);
    controls.target.lerpVectors(FL.fT, fp, e);
    const D = Math.exp(Math.log(FL.fD) + (Math.log(FL.tD) - Math.log(FL.fD)) * e) * (1 + FL.hop * arc);
    tmp.copy(FL.fDir); if (FL.tDir) tmp.lerp(FL.tDir, e); tmp.normalize().lerp(UP, .35 * arc * Math.min(1, FL.hop)).normalize();
    camera.position.copy(controls.target).addScaledVector(tmp, D); prevFocus.copy(fp);
    if (FL.t >= 1) FL.on = false;
  } else { tmp2.subVectors(fp, prevFocus); camera.position.add(tmp2); controls.target.add(tmp2); prevFocus.copy(fp); }
  if (transT < 1){
    transT = Math.min(1, transT + realDt / 1.6);
    const k = transT >= 1 ? 1 : 1 - Math.exp(-realDt * 4.5);
    controls.target.lerp(fp, k);
    tmp.subVectors(camera.position, controls.target); const len = tmp.length(); tmp.normalize();
    if (wantDir) tmp.lerp(wantDir, k).normalize();
    camera.position.copy(controls.target).addScaledVector(tmp, len + (wantDist - len) * k);
  }
  controls.update();
  }
  sky.position.copy(camera.position);

  // Labels
  if (S.labels && !labelsLayer.hidden && !CINE.on){
    const W = innerWidth, H = innerHeight;
    const place = (el, pos, extra) => {
      const d = pos.distanceTo(camera.position); proj.copy(pos).project(camera);
      const vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 && (extra === undefined || extra(d));
      el.hidden = !vis; if (vis) el.style.transform = `translate(${((proj.x * .5 + .5) * W + 10).toFixed(1)}px,${((-proj.y * .5 + .5) * H - 10).toFixed(1)}px)`;
    };
    for (const n in labelEls){
      if (n === 'Voyager 1' && !voyVisible){ labelEls[n].el.hidden = true; continue; }
      focusPos(n, sv); place(labelEls[n].el, sv);
    }
    subLabels.forEach(s => { if (!s.show()){ s.el.hidden = true; return; } s.get(sv); place(s.el, sv, d => d < 120); });
    guideObjs.forEach(g => { if (!guides.visible){ g.el.hidden = true; return; } sv.copy(g.dir).multiplyScalar(SC.f(60) * 1.04).add(sunPos); place(g.el, sv); });
    heliLabels.forEach(h => { if (!helio.visible){ h.el.hidden = true; return; } sv.copy(h.dir).multiplyScalar(h.r()).add(sunPos); place(h.el, sv); });
  }

  renderer.render(scene, camera);

  // Clock, timeline, precision, info (about 8 times a second)
  uiAcc += realDt;
  if (uiAcc > .12){
    uiAcc = 0;
    const f = fmtDate(S.jd), julian = S.jd < 2299160.5;
    $('#d-date').textContent = f.date; if (S.clean) $('#m-date').textContent = f.date;
    $('#d-time').innerHTML = `${f.time}${julian ? ' · <b>Julian calendar</b>' : ''}`;
    if (!S.scrubbing) tl.value = Math.round(jdToPos(S.jd) * 10000);
    $('#band-now').style.left = (jdToPos(Eph.nowJD()) * 100).toFixed(2) + '%';
    const t = Eph.tableFor(Eph.ttFromUT(S.jd));
    if (t !== lastTable){ lastTable = t; $('#d-prec').classList.toggle('t2', t === 2);
      $('#d-prec-t').textContent = t === 1 ? 'JPL TABLE 1 · PLANETS WITHIN 10′' : 'JPL TABLE 2 · PLANETS WITHIN 34′'; }
    updateInfoLive();
    if (CINE.on){ if (CINE.shown){ const sh = CINE.sh; $('#l3-s').textContent = sh.sub ? sh.sub() : planetSub(sh.target); } $('#cine-date').textContent = `${f.date} · ${f.time}`; $('#cine-rate').textContent = '· ' + RATES[S.rate].t; }
  }
  audioAcc += realDt; if (audio && S.sound && audioAcc > .25){ audioAcc = 0; audio.lp.frequency.setTargetAtTime(300 + Math.log10(1 + RATES[S.rate].d * 86400) * 70, audio.ctx.currentTime, .5); }
}

/* ================= START ================= */
let prefs = {}; try { prefs = JSON.parse(localStorage.getItem('hv-prefs') || '{}') || {}; } catch (e) {}
if (prefs.scale === 'linear'){ S.scale = 'linear'; document.querySelectorAll('[data-scale]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scale === 'linear'))); }
if (prefs.frame === 'helio'){ S.frame = 'helio'; document.querySelectorAll('[data-frame]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.frame === 'helio'))); }
if (Number.isInteger(prefs.rate) && prefs.rate >= 0 && prefs.rate < RATES.length) S.rate = prefs.rate;
S.rateCur = RATES[S.rate].d;
applyScale();
setPlaying(true); renderRate();
if (prefs.labels === false) setLabels(false);
try { if (localStorage.getItem('hv-clean') === '1') setClean(true); } catch (e) {}
setFocus('Sun', VIEWS.overview());
camera.position.copy(VIEWS.overview().dir).normalize().multiplyScalar(SC.f(32) * 2.6);

/* ================= WELCOME, ROUTES, HELP ================= */
const splash = $('#splash'); let seen = false, readyDone = false; document.body.classList.add('intro');
try { seen = localStorage.getItem('hv-seen') === '1'; } catch (e) {}
function ready(){
  if (readyDone) return; readyDone = true;
  $('#load-bar').style.width = '100%'; $('#load-t').textContent = 'Ready';
  $('#go-explore').disabled = $('#go-tour').disabled = false;
  if (seen) setTimeout(() => enter(false), 500); else $('#go-explore').focus();
}
THREE.DefaultLoadingManager.onLoad = ready;
setTimeout(ready, 9000);   // never hold people back if an image is slow or missing
function routeFromHash(){ const h = (location.hash || '').slice(1), lv = Object.keys(LEVEL_HASH).find(k => LEVEL_HASH[k] === h); if (lv && lv !== S.level) setLevel(lv); }
function enter(tour){
  if (splash.classList.contains('gone')) return;
  splash.classList.add('gone'); document.body.classList.remove('intro'); try { localStorage.setItem('hv-seen', '1'); } catch (e) {}
  if (tour) startCine(); else { routeFromHash(); if (!seen) setTimeout(() => toast('Drag to orbit · pinch to zoom · tap any object'), 700); }
}
$('#go-explore').addEventListener('click', () => enter(false));
$('#go-tour').addEventListener('click', () => enter(true));
addEventListener('hashchange', () => { if (splash.classList.contains('gone')) routeFromHash(); });
addEventListener('keydown', e => { if (!splash.classList.contains('gone') && e.key === 'Enter' && readyDone){ e.preventDefault(); enter(false); } }, true);

const help = $('#help'); let helpReturn = null;
function openHelp(){ helpReturn = document.activeElement; help.hidden = false; setPanel(false); setPop(false); $('#help-close').focus(); }
function closeHelp(){ help.hidden = true; helpReturn && helpReturn.focus && helpReturn.focus(); }
$('#b-help').addEventListener('click', openHelp); $('#help-close').addEventListener('click', closeHelp);
help.addEventListener('click', e => { if (e.target === help) closeHelp(); });
help.addEventListener('keydown', e => { if (e.key === 'Escape'){ e.stopPropagation(); closeHelp(); } });
help.querySelectorAll('[role=tab]').forEach(t => t.addEventListener('click', () => {
  help.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', String(x === t)));
  help.querySelectorAll('.tabpanel').forEach(pn => pn.hidden = pn.dataset.panel !== t.dataset.tab);
}));

/* Adaptive quality: drop the pixel ratio on devices that cannot hold a smooth frame rate */
const perf = { t:0, n:0, acc:0, lowered:false };
function watchPerf(dt){
  if (perf.lowered || document.hidden) return;
  perf.acc += dt; perf.n++; perf.t += dt;
  if (perf.t > 4){ const avg = perf.acc / perf.n; perf.t = perf.acc = perf.n = 0;
    if (avg > .034 && renderer.getPixelRatio() > 1){ perf.lowered = true; renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); } }
}
frame();
}
