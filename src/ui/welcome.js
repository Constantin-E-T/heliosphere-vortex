import * as THREE from 'three';
import { setFocus } from '../camera/camera.js';
import { VOYAGER_SHOTS, startCine } from '../camera/cinematic.js';
import { frame } from '../core/loop.js';
import { S } from '../core/state.js';
import { $ } from '../core/util.js';
import { LEVEL_HASH, setLevel } from '../cosmic/switching.js';
import { renderer } from '../scene/renderer.js';
import { toast } from './info-card.js';
import { setPanel } from './panel.js';
import { setPop } from './time-machine.js';

export let splash;

export let seen = false;

export let readyDone = false;

export function ready() {
  if (readyDone) return;
  readyDone = true;
  $('#load-bar').style.width = '100%';
  $('#load-t').textContent = 'Ready';
  $('#go-voyager').disabled = $('#go-explore').disabled = $('#go-tour').disabled = false;
  if (seen) setTimeout(() => enter(false), 500);
  else $('#go-voyager').focus();
}

export function routeFromHash() {
  const h = (location.hash || '').slice(1),
    lv = Object.keys(LEVEL_HASH).find(k => LEVEL_HASH[k] === h);
  if (h === 'voyager') {
    if (S.level !== 'solar') setLevel('solar');
    setFocus('Voyager 1');
  } else if (lv && lv !== S.level) setLevel(lv);
}

/** @param {boolean|Array} tour true for the full tour, or a list of shots. */
export function enter(tour) {
  if (splash.classList.contains('gone')) return;
  splash.classList.add('gone');
  document.body.classList.remove('intro');
  try {
    localStorage.setItem('hv-seen', '1');
  } catch (e) {}
  if (tour) startCine(tour === true ? undefined : tour);
  else {
    routeFromHash();
    if (!seen) setTimeout(() => toast('Drag to orbit · pinch to zoom · tap any object'), 700);
  }
}

export let help;

export let helpReturn = null;

export function openHelp() {
  helpReturn = document.activeElement;
  help.hidden = false;
  setPanel(false);
  setPop(false);
  $('#help-close').focus();
}

export function closeHelp() {
  help.hidden = true;
  helpReturn && helpReturn.focus && helpReturn.focus();
}

/* Adaptive quality: drop the pixel ratio on devices that cannot hold a smooth frame rate */
export const perf = { t: 0, n: 0, acc: 0, lowered: false };

export function watchPerf(dt) {
  if (perf.lowered || document.hidden) return;
  perf.acc += dt;
  perf.n++;
  perf.t += dt;
  if (perf.t > 4) {
    const avg = perf.acc / perf.n;
    perf.t = perf.acc = perf.n = 0;
    if (avg > 0.034 && renderer.getPixelRatio() > 1) {
      perf.lowered = true;
      renderer.setPixelRatio(1);
      renderer.setSize(innerWidth, innerHeight);
    }
  }
}

export function initWelcome() {
  /* ================= WELCOME, ROUTES, HELP ================= */
  splash = $('#splash');
  document.body.classList.add('intro');
  try {
    seen = localStorage.getItem('hv-seen') === '1';
  } catch (e) {}
  THREE.DefaultLoadingManager.onLoad = ready;
  setTimeout(ready, 9000); // never hold people back if an image is slow or missing
  $('#go-voyager').addEventListener('click', () => enter(VOYAGER_SHOTS));
  $('#go-explore').addEventListener('click', () => enter(false));
  $('#go-tour').addEventListener('click', () => enter(true));
  addEventListener('hashchange', () => {
    if (splash.classList.contains('gone')) routeFromHash();
  });
  addEventListener(
    'keydown',
    e => {
      const onControl = document.activeElement?.closest('a, button');
      if (!splash.classList.contains('gone') && e.key === 'Enter' && readyDone && !onControl) {
        e.preventDefault();
        enter(false);
      }
    },
    true
  );
  help = $('#help');
  $('#b-help').addEventListener('click', openHelp);
  $('#help-close').addEventListener('click', closeHelp);
  help.addEventListener('click', e => {
    if (e.target === help) closeHelp();
  });
  help.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeHelp();
    }
  });
  help.querySelectorAll('[role=tab]').forEach(t =>
    t.addEventListener('click', () => {
      help
        .querySelectorAll('[role=tab]')
        .forEach(x => x.setAttribute('aria-selected', String(x === t)));
      help
        .querySelectorAll('.tabpanel')
        .forEach(pn => (pn.hidden = pn.dataset.panel !== t.dataset.tab));
    })
  );
  frame();
}
