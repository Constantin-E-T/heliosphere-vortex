import { setFocus } from '../camera/camera.js';
import { $ } from '../core/util.js';
import { COLORS, ORDER } from '../data/solar.js';
import { moonMesh } from '../scene/planets.js';
import { NOSE } from '../scene/renderer.js';
import { guideObjs, helio } from '../scene/sun.js';

export let bar;

export let labelsLayer;

export const labelEls = {};

export let subLabels;

export let heliLabels;

export function initLabels() {
  /* ================= UI: chips, labels ================= */
  bar = $('#bar');
  labelsLayer = $('#labels');
  ORDER.forEach((name, i) => {
    const color = COLORS[name];
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.body = name;
    chip.setAttribute('aria-pressed', String(i === 0));
    chip.innerHTML = `<i style="background:${color};box-shadow:0 0 8px ${color}"></i>${name}<kbd>${i}</kbd>`;
    chip.addEventListener('click', () => setFocus(name));
    bar.appendChild(chip);
    const el = document.createElement('div');
    el.className = 'lbl' + (i === 0 ? ' on' : '');
    el.innerHTML = `<i style="background:${color}"></i>${name}`;
    el.addEventListener('click', () => setFocus(name));
    labelsLayer.appendChild(el);
    labelEls[name] = { el };
  });
  subLabels = [
    { name: 'Moon', get: o => moonMesh.getWorldPosition(o), show: () => moonMesh.visible }
  ];
  subLabels.forEach(s => {
    s.el = document.createElement('div');
    s.el.className = 'lbl sub';
    s.el.textContent = s.name;
    labelsLayer.appendChild(s.el);
  });
  guideObjs.forEach(g => {
    g.el = document.createElement('div');
    g.el.className = 'lbl guide';
    g.el.style.color = '#' + g.color.toString(16).padStart(6, '0');
    g.el.textContent = g.text;
    labelsLayer.appendChild(g.el);
  });
  heliLabels = [{ text: 'Heliopause · 121.6 AU', r: () => helio.userData.hp, dir: NOSE }];
  heliLabels.forEach(h => {
    h.el = document.createElement('div');
    h.el.className = 'lbl guide';
    h.el.style.color = '#5fc4ff';
    h.el.textContent = h.text;
    labelsLayer.appendChild(h.el);
  });
}
