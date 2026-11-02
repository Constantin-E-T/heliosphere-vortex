import { live } from '../core/live.js';
import { $ } from '../core/util.js';
import { COS_BY } from './catalogue.js';
import { cbar, cosLabels } from './levels.js';
import { ensurePhoto } from './photos.js';
import { KPC_LY } from './scales.js';
import { stat } from '../ui/info-card.js';

/* ---- Info card ---- */
export const fmtKpc = k =>
  k < 1
    ? `${Math.round(k * 1000)} pc`
    : k < 1000
      ? `${k < 10 ? k.toFixed(2) : k.toFixed(k < 100 ? 1 : 0)} kpc`
      : `${(k / 1000).toFixed(k < 10000 ? 2 : 1)} Mpc`;

export function fmtLy(ly) {
  if (ly < 1e6) return `${Math.round(ly).toLocaleString('en-GB')} ly`;
  if (ly < 1e9) return `${(ly / 1e6).toFixed(ly < 1e7 ? 2 : 1)} million ly`;
  return `${(ly / 1e9).toFixed(2)} billion ly`;
}

export function renderCosInfo() {
  const o = COS_BY[live.cosFocus];
  $('#in-name').textContent = o.name + (o.alt ? ` · ${o.alt}` : '');
  $('#in-kind').textContent = o.kind;
  $('#in-sw').style.background = o.color;
  $('#in-sw').style.color = o.color;
  let stats = [];
  if (o.d !== undefined && !o.noAuto) {
    const ly = o.d * KPC_LY;
    stats.push(
      ['Distance', fmtKpc(o.d)],
      ['In light-years', fmtLy(ly)],
      ['Light left it', `${fmtLy(ly).replace(' ly', '')} years ago`]
    );
  }
  (o.stats || []).forEach(s => {
    if (s[1]) stats.push(s);
  });
  if (o.src) stats.push(['Distance source', o.src]);
  if (o.photo) {
    stats.push([
      'Image',
      o.tel === 'hubble' ? 'NASA, ESA, STScI · Hubble' : 'NASA, ESA, CSA, STScI · Webb'
    ]);
    ensurePhoto(o, o.tel);
  }
  $('#in-tel').hidden = !o.photo;
  document
    .querySelectorAll('#in-tel button')
    .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tel === o.tel)));
  $('#in-stats').innerHTML = stats.map(([k, v]) => stat(k, v)).join('');
  $('#in-note').textContent =
    o.note ||
    (o.l !== undefined
      ? `Galactic longitude ${o.l.toFixed(1)}°, latitude ${o.b >= 0 ? '+' : ''}${o.b.toFixed(1)}°.`
      : '');
  $('#in-status').hidden = true;
  cbar
    .querySelectorAll('.chip')
    .forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cid === live.cosFocus)));
  cosLabels.forEach(L => L.el.classList.toggle('on', L.o.id === live.cosFocus));
}

export function initCosmicInfo() {
  live.cosFocus = 'mw';
}
