import { S } from '../core/state.js';
import { $ } from '../core/util.js';
import { setPanel } from './panel.js';
import { setPlaying, setPop } from './time-machine.js';

/* ================= CLEAN VIEW ================= */
export const EYE =
  '<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>';

export let EYE_OFF;

export function setClean(on) {
  S.clean = on;
  $('#hud').classList.toggle('clean', on);
  $('#mini').hidden = !on;
  $('#b-ui').setAttribute('aria-pressed', String(on));
  $('#t-ui').textContent = on ? 'Show UI' : 'Hide UI';
  $('#i-ui').innerHTML = on ? EYE_OFF : EYE;
  if (on) {
    setPanel(false);
    setPop(false);
    $('#m-date').textContent = $('#d-date').textContent;
  }
  try {
    localStorage.setItem('hv-clean', on ? '1' : '0');
  } catch (e) {}
}

export function initCleanView() {
  EYE_OFF = EYE + '<path d="M2.5 2.5l11 11"/>';
  $('#b-ui').addEventListener('click', () => setClean(!S.clean));
  $('#m-show').addEventListener('click', () => setClean(false));
  $('#m-play').addEventListener('click', () => setPlaying(!S.playing));
}
