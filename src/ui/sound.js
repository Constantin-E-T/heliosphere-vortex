import { S } from '../core/state.js';
import { $ } from '../core/util.js';
import { toast } from './info-card.js';

/* ================= SOUND ================= */
export let audio = null;

export function setSound(on) {
  S.sound = on;
  $('#b-sound').setAttribute('aria-pressed', String(on));
  try {
    if (on) {
      if (!audio) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 380;
        lp.Q.value = 5;
        lp.connect(master);
        master.connect(ctx.destination);
        [
          [55, 0.22, 'sine'],
          [55.35, 0.2, 'sine'],
          [82.4, 0.08, 'triangle'],
          [110.2, 0.05, 'triangle'],
          [164.8, 0.025, 'sine']
        ].forEach(([f, gv, type]) => {
          const o = ctx.createOscillator(),
            g = ctx.createGain();
          o.type = type;
          o.frequency.value = f;
          g.gain.value = gv;
          o.connect(g);
          g.connect(lp);
          o.start();
        });
        const lfo = ctx.createOscillator(),
          lg = ctx.createGain();
        lfo.frequency.value = 0.06;
        lg.gain.value = 180;
        lfo.connect(lg);
        lg.connect(lp.frequency);
        lfo.start();
        audio = { ctx, master, lp };
      }
      audio.ctx.resume();
      audio.master.gain.setTargetAtTime(0.18, audio.ctx.currentTime, 0.8);
    } else if (audio) {
      audio.master.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.25);
      setTimeout(() => {
        if (!S.sound) audio.ctx.suspend();
      }, 1500);
    }
  } catch (e) {
    toast('Sound is not available in this browser');
    S.sound = false;
    $('#b-sound').setAttribute('aria-pressed', 'false');
  }
}

export function initSound() {
  $('#b-sound').addEventListener('click', () => setSound(!S.sound));
}
