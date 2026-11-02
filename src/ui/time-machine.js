import { Eph } from '../engine/ephemeris.js';
import { setFocus } from '../camera/camera.js';
import { CINE } from '../camera/cinematic.js';
import { S } from '../core/state.js';
import { clampJD, fmtDate, fmtShort, posToJD, travelTo } from '../core/time.js';
import { $ } from '../core/util.js';
import { EVENTS, RATES } from '../data/solar.js';
import { clearTrails } from '../scene/wakes.js';
import { toast } from './info-card.js';

/* ================= TIME UI ================= */
export const PLAY_ICON = '<path d="M4 2.5v11l9-5.5z"/>';

export const PAUSE_ICON =
  '<rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/>';

export function setPlaying(p) {
  S.playing = p;
  $('#i-play').innerHTML = $('#i-play2').innerHTML = p ? PAUSE_ICON : PLAY_ICON;
  $('#m-play').setAttribute('aria-label', p ? 'Pause' : 'Play');
  $('#b-play').setAttribute('aria-label', p ? 'Pause' : 'Play');
}

export function setRate(i) {
  S.rate = Math.max(0, Math.min(RATES.length - 1, i));
  renderRate();
  if (!CINE_ON()) savePrefs();
}

export const CINE_ON = () => typeof CINE !== 'undefined' && CINE.on;

export function savePrefs() {
  try {
    localStorage.setItem(
      'hv-prefs',
      JSON.stringify({ rate: S.rate, frame: S.frame, scale: S.scale, labels: S.labels })
    );
  } catch (e) {}
}

export function renderRate() {
  $('#o-rate').textContent = $('#m-rate').textContent = (S.dir < 0 ? '−' : '') + RATES[S.rate].t;
  $('#b-rev').setAttribute('aria-pressed', String(S.dir < 0));
}

export function setDir(d) {
  S.dir = d;
  renderRate();
  clearTrails();
}

export function step(days) {
  S.jd = clampJD(S.jd + days);
  S.lastSample = null;
}

export const stepSize = () => Math.max(1 / 24, Math.min(365.25, RATES[S.rate].d));

export function goNow() {
  travelTo(Eph.nowJD(), () => {
    setRate(0);
    setDir(1);
    setPlaying(true);
    toast('Back to the present, running in real time');
  });
}

export let tl;

export const endScrub = () => {
  S.scrubbing = false;
};

export let pop;

export function setPop(open) {
  pop.hidden = !open;
  $('#b-jump').setAttribute('aria-expanded', String(open));
  if (open) {
    renderEvents();
    if (innerWidth > 720) setTimeout(() => $('#i-date').focus(), 0);
  }
}

export function renderEvents() {
  const now = Eph.nowJD(),
    up = EVENTS.find(e => e.jd > now);
  let html = '';
  if (up) {
    const d = up.jd - now,
      when =
        d < 1
          ? 'today'
          : d < 60
            ? `in ${Math.ceil(d)} days`
            : d < 730
              ? `in ${Math.round(d / 30.44)} months`
              : `in ${Math.round(d / 365.25)} years`;
    html += `<div class="evh">Coming up ${when}</div><button class="ev future" data-i="${EVENTS.indexOf(up)}"><time>${fmtShort(up.jd)}</time><span>${up.name}<small>${up.sub}</small></span></button>`;
  }
  html += '<div class="evh">Past</div>';
  let inFuture = false;
  EVENTS.forEach((e, i) => {
    if (!inFuture && e.jd > now) {
      inFuture = true;
      html += '<div class="evh">Ahead</div>';
    }
    html += `<button class="ev${e.jd > now ? ' future' : ''}" data-i="${i}"><time>${fmtShort(e.jd)}</time><span>${e.name}<small>${e.sub}</small></span></button>`;
  });
  $('#evs').innerHTML = html;
  $('#evs')
    .querySelectorAll('.ev')
    .forEach(b =>
      b.addEventListener('click', () => {
        const e = EVENTS[+b.dataset.i];
        setPop(false);
        setPlaying(false);
        travelTo(e.jd, () => {
          if (e.focus) setFocus(e.focus);
          toast(`${e.name} · ${fmtDate(e.jd).date}`);
        });
      })
    );
}

export function parseDate(s) {
  const m = s
    .trim()
    .match(
      /^(-?\d{1,4})\s*(BC|BCE|AD|CE)?(?:[-/. ](\d{1,2}))?(?:[-/. ](\d{1,2}))?(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*(UTC|Z)?$/i
    );
  if (!m) return null;
  let y = parseInt(m[1], 10);
  const era = (m[2] || '').toUpperCase();
  if (era === 'BC' || era === 'BCE') {
    if (y < 1) return null;
    y = 1 - y;
  }
  const mo = m[3] ? +m[3] : 1,
    d = m[4] ? +m[4] : 1,
    h = m[5] ? +m[5] : 0,
    mi = m[6] ? +m[6] : 0,
    sec = m[7] ? +m[7] : 0;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return Eph.calToJD(y, mo, d + (h + mi / 60 + sec / 3600) / 24);
}

export function initTimeMachine() {
  $('#b-play').addEventListener('click', () => setPlaying(!S.playing));
  $('#b-slower').addEventListener('click', () => setRate(S.rate - 1));
  $('#b-faster').addEventListener('click', () => setRate(S.rate + 1));
  $('#b-rev').addEventListener('click', () => setDir(-S.dir));
  $('#b-back').addEventListener('click', () => step(-stepSize()));
  $('#b-fwd').addEventListener('click', () => step(stepSize()));
  $('#b-now').addEventListener('click', goNow);
  tl = $('#tl');
  tl.addEventListener('pointerdown', () => {
    S.scrubbing = true;
    clearTrails();
  });
  tl.addEventListener('input', () => {
    S.travel = null;
    S.jd = clampJD(posToJD(tl.value / 10000));
    S.anchorJD = S.jd;
    clearTrails();
  });
  tl.addEventListener('pointerup', endScrub);
  tl.addEventListener('change', endScrub);
  tl.addEventListener('blur', endScrub);
  // Jump popover
  pop = $('#pop');
  $('#b-jump').addEventListener('click', e => {
    e.stopPropagation();
    setPop(pop.hidden);
  });
  document.addEventListener('pointerdown', e => {
    if (!pop.hidden && !pop.contains(e.target) && !$('#b-jump').contains(e.target)) setPop(false);
  });
  $('#f-go').addEventListener('submit', e => {
    e.preventDefault();
    const jd = parseDate($('#i-date').value),
      hint = $('#go-hint');
    if (jd === null) {
      hint.textContent =
        'Use year-month-day, for example 1969-07-20 20:17, -43-03-15 or 44 BC-03-15.';
      hint.classList.add('err');
      return;
    }
    if (jd < Eph.MIN_JD || jd > Eph.MAX_JD) {
      hint.textContent =
        "JPL's elements are fitted for 3000 BC to AD 3000. Pick a date inside that range.";
      hint.classList.add('err');
      return;
    }
    hint.classList.remove('err');
    hint.textContent =
      'Any date from 3000 BC to AD 3000, in UTC. Dates before 15 Oct 1582 use the Julian calendar.';
    setPop(false);
    setPlaying(false);
    travelTo(jd, () => toast(fmtDate(jd).date));
  });
}
