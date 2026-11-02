import * as THREE from 'three';
import { $ } from '../core/util.js';
import { COS, COS_BY } from './catalogue.js';
import { focusCosmic } from './flight.js';
import { ARMS, PITCH } from './milky-way.js';
import { gcV } from './scales.js';
import { V } from '../scene/renderer.js';
import { labelsLayer } from '../ui/labels.js';

/* ---- Levels, labels, chips ---- */
export const LEVELS = {
  mw: {
    focus: 'mw',
    chips: [
      'mw',
      'sun',
      'cliffs',
      'ring',
      'm42',
      'm45',
      'm16',
      'm8',
      'm1',
      'carina',
      'tarantula',
      'sgra',
      'lmc',
      'smc',
      'sgr'
    ],
    dir: new THREE.Vector3(-0.42, 0.72, 0.55)
  },
  lg: {
    focus: 'lg',
    chips: ['lg', 'mw', 'm31', 'm33', 'lmc', 'tarantula', 'n6822', 'ic1613', 'wlm'],
    dir: new THREE.Vector3(0.25, 0.78, 0.58)
  },
  lu: {
    focus: 'lan',
    chips: [
      'lan',
      'lg',
      'virgo',
      'norma',
      'coma',
      'sq',
      'cartwheel',
      'smacs',
      'fornax',
      'cena',
      'm81',
      'scg',
      'cent',
      'hydra',
      'perseus'
    ],
    dir: new THREE.Vector3(0.35, 0.72, 0.6)
  }
};

export const TIER_RANGE = {
  grp2: [4000, 1e9],
  neb: [0, 3],
  core: [0, 25],
  home: [0, 60000],
  sun: [0, 400],
  sat: [0, 1400],
  sat2: [0, 60],
  lg: [120, 12000],
  grp: [4000, 110000],
  lu: [4000, 1e9],
  top: [60000, 1e9]
};

export let cosLabels;

export let armLabels;

export let cbar;

export function buildCosmicChips(level) {
  cbar.innerHTML = '';
  LEVELS[level].chips.forEach(id => {
    const o = COS_BY[id],
      b = document.createElement('button');
    b.className = 'chip';
    b.dataset.cid = id;
    b.innerHTML = `<i style="background:${o.color};box-shadow:0 0 8px ${o.color}"></i>${o.name}`;
    b.addEventListener('click', () => focusCosmic(id));
    cbar.appendChild(b);
  });
}

export function initCosmicLevels() {
  LEVELS.lu.view = 300000;
  cosLabels = COS.map(o => {
    const el = document.createElement('div');
    el.className = 'lbl cos';
    el.hidden = true;
    el.innerHTML = `<i style="background:${o.color}"></i>${o.name}`;
    el.addEventListener('click', () => focusCosmic(o.id));
    labelsLayer.appendChild(el);
    return { o, el };
  });
  armLabels = [
    ...ARMS.map(a => ({
      name: a.name,
      pos: gcV(Math.min(15, a.R * 1.18), Math.log(Math.min(15, a.R * 1.18) / a.R) / PITCH, 0, V())
    })),
    { name: 'Orion Spur', pos: gcV(8.5, 0.3, 0, V()) }
  ].map(a => {
    const el = document.createElement('div');
    el.className = 'lbl guide';
    el.style.color = '#8fb0ff';
    el.textContent = a.name;
    el.hidden = true;
    labelsLayer.appendChild(el);
    return { ...a, el };
  });
  cbar = $('#cbar');
}
