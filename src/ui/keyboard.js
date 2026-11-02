import { live } from '../core/live.js';
import { VIEW_ORDER, setFocus, setView } from '../camera/camera.js';
import { CINE, cinePause, cineStep, startCine, stopCine } from '../camera/cinematic.js';
import { S } from '../core/state.js';
import { $ } from '../core/util.js';
import { ORDER } from '../data/solar.js';
import { setClean } from './clean-view.js';
import { setFrame, setLabels, setPanel } from './panel.js';
import { goNow, pop, setDir, setPlaying, setPop, setRate, step } from './time-machine.js';
import { openHelp } from './welcome.js';

export function initKeyboard() {
  /* ================= KEYBOARD ================= */
  addEventListener('keydown', e => {
    live.idleT = 0;
    if (e.target.matches('input[type=text]')) {
      if (e.key === 'Escape') setPop(false);
      return;
    }
    if (!$('#splash').classList.contains('gone') || !$('#help').hidden) return;
    if (CINE.on) {
      const kk = e.key;
      if (kk === ' ') {
        e.preventDefault();
        cinePause();
      } else if (kk === 'ArrowRight') {
        e.preventDefault();
        cineStep(1);
      } else if (kk === 'ArrowLeft') {
        e.preventDefault();
        cineStep(-1);
      } else if (kk === 'Escape' || kk.toLowerCase() === 'c') stopCine();
      return;
    }
    if (S.level !== 'solar' && !['l', 'h', 'escape'].includes(e.key.toLowerCase())) return;
    if (e.key.toLowerCase() === 'c') {
      startCine();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === ' ') {
      e.preventDefault();
      setPlaying(!S.playing);
    } else if (k === 'arrowright') {
      e.preventDefault();
      step(e.shiftKey ? 365.25 : 1);
    } else if (k === 'arrowleft') {
      e.preventDefault();
      step(e.shiftKey ? -365.25 : -1);
    } else if (k === ']' || k === '=' || k === '+') setRate(S.rate + 1);
    else if (k === '[' || k === '-') setRate(S.rate - 1);
    else if (k === 'r') setDir(-S.dir);
    else if (k === 'n') goNow();
    else if (k === 'e') {
      e.preventDefault();
      setPop(pop.hidden);
    } else if (/^[0-9]$/.test(k)) setFocus(ORDER[+k]);
    else if (k === 'g') setFrame(S.frame === 'galactic' ? 'helio' : 'galactic');
    else if (k === 'v') setView(VIEW_ORDER[(VIEW_ORDER.indexOf(S.view) + 1) % VIEW_ORDER.length]);
    else if (k === 'l') setLabels(!S.labels);
    else if (k === 't') {
      const t = $('#t-trails');
      t.checked = !t.checked;
      t.dispatchEvent(new Event('change'));
    } else if (k === 'o') {
      const t = $('#t-orbits');
      t.checked = !t.checked;
      t.dispatchEvent(new Event('change'));
    } else if (k === 'h') setClean(!S.clean);
    else if (k === 'escape') {
      setPanel(false);
      setPop(false);
    } else if (k === '?' || k === '/') {
      e.preventDefault();
      openHelp();
    }
  });
}
