import { Eph } from '../engine/ephemeris.js';
import { live } from '../core/live.js';
import { S } from '../core/state.js';
import { $, DEG } from '../core/util.js';
import { COLORS, PLANETS } from '../data/solar.js';
import { bodies, moonGeoAU } from '../scene/planets.js';
import { voyAU } from '../scene/voyager.js';

/* ================= INFO CARD ================= */
export const AU_LT_S = 499.004784;

export const fmtAU = au =>
  au < 0.1 ? `${((au * Eph.AU_KM) / 1e6).toFixed(2)} M km` : `${au.toFixed(au < 10 ? 3 : 2)} AU`;

export function fmtLT(au) {
  const s = au * AU_LT_S;
  if (s < 3600) return `${(s / 60).toFixed(1)} light-min`;
  return `${(s / 3600).toFixed(2)} light-hours`;
}

export function lonLat(p) {
  const r = Math.hypot(p.x, p.y, p.z);
  return `${((Math.atan2(p.y, p.x) / DEG + 360) % 360).toFixed(2)}°, ${Math.asin(p.z / r) / DEG >= 0 ? '+' : ''}${(Math.asin(p.z / r) / DEG).toFixed(2)}°`;
}

export const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export let infoStatic = '';

export function renderInfo() {
  $('#in-tel').hidden = true;
  const name = live.focus,
    color = COLORS[name];
  $('#in-name').textContent = name;
  $('#in-sw').style.background = color;
  $('#in-sw').style.color = color;
  let kind, note;
  if (name === 'Sun') {
    kind = 'G2V star';
    note =
      'Carries every planet around the Milky Way at about 251.9 km/s. In the galactic frame the wakes show the true direction of that motion, 60° from the ecliptic.';
  } else if (name === 'Voyager 1') {
    kind = 'Probe';
    note =
      'Position from JPL Horizons. Before 1981 JPL rates the trajectory as rough; after 2030 it continues in a straight line at 16.9 km/s.';
  } else {
    const d = bodies[name].data;
    kind = 'Planet ' + (PLANETS.indexOf(d) + 1);
    note = d.note;
  }
  $('#in-kind').textContent = kind;
  $('#in-note').textContent = note;
  infoStatic = name;
  updateInfoLive(true);
}

export function stat(k, v, live) {
  return `<div><dt>${k}</dt><dd${live ? ' class="live"' : ''}>${v}</dd></div>`;
}

export function updateInfoLive() {
  const name = live.focus,
    E = bodies.Earth.au;
  let html,
    status = '';
  if (name === 'Sun') {
    const r = Math.hypot(E.x, E.y, E.z);
    html =
      stat('From Earth', fmtAU(r), 1) +
      stat('Light time', fmtLT(r), 1) +
      stat('Galactic speed', '251.9 km/s') +
      stat('Heading (ecliptic)', '341.5°, +60.9°') +
      stat('To galactic centre', '8.275 kpc') +
      stat('Above galactic plane', '20.8 pc');
  } else if (name === 'Voyager 1') {
    const L = Eph.VOY_EVENTS;
    if (!live.voyVisible) {
      const days = L.launch - S.jd;
      status = `● LAUNCHES 5 SEP 1977 · ${days > 365.25 ? (days / 365.25).toFixed(1) + ' YEARS' : days.toFixed(0) + ' DAYS'} AWAY`;
      html = stat('Launch', '1977-09-05 12:56 UTC') + stat('Asymptotic speed', '16.9 km/s');
    } else {
      const r = Math.hypot(voyAU.x, voyAU.y, voyAU.z),
        re = dist3(voyAU, E);
      status =
        S.jd < L.jupiter
          ? '● CRUISE TO JUPITER'
          : S.jd < L.saturn
            ? '● CRUISE TO SATURN'
            : S.jd < L.ts
              ? '● OUTBOUND IN THE SOLAR WIND'
              : S.jd < L.hp
                ? '● HELIOSHEATH, PAST THE TERMINATION SHOCK'
                : '● INTERSTELLAR SPACE';
      if (S.jd > L.extrap) status += ' · EXTRAPOLATED';
      html =
        stat('From Sun', fmtAU(r), 1) +
        stat('From Earth', fmtAU(re), 1) +
        stat('Signal time', fmtLT(re), 1) +
        stat('Helio λ, β', lonLat(voyAU), 1) +
        stat('Mission time', `${((S.jd - L.launch) / 365.25).toFixed(2)} yr`, 1) +
        stat('Launched', '5 Sep 1977');
    }
  } else {
    const b = bodies[name],
      d = b.data,
      p = b.au,
      r = Math.hypot(p.x, p.y, p.z);
    const first =
      name === 'Earth'
        ? stat('From Sun', fmtAU(r), 1) +
          stat(
            'Moon distance',
            `${Math.round(Math.hypot(moonGeoAU.x, moonGeoAU.y, moonGeoAU.z) * Eph.AU_KM).toLocaleString('en-GB')} km`,
            1
          )
        : stat('From Sun', fmtAU(r), 1) +
          stat('From Earth', `${fmtAU(dist3(p, E))} · ${fmtLT(dist3(p, E))}`, 1);
    html =
      first +
      stat('Helio λ, β (J2000)', lonLat(p), 1) +
      stat('Year', d.year) +
      stat('Day', d.day) +
      stat('Axial tilt', d.tilt) +
      (d.moonsN !== '0' ? stat('Known moons', d.moonsN) : stat('Known moons', 'None'));
  }
  $('#in-stats').innerHTML = html;
  $('#in-status').hidden = !status;
  $('#in-status').textContent = status;
}

export let toastEl;

export let toastTimer;

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

export function initInfoCard() {
  $('#in-min').addEventListener('click', e => {
    const min = $('#info').classList.toggle('min');
    e.currentTarget.textContent = min ? '+' : '–';
    e.currentTarget.setAttribute('aria-label', min ? 'Expand details' : 'Collapse details');
  });
  if (innerWidth < 720) {
    $('#info').classList.add('min');
    $('#in-min').textContent = '+';
  }
  toastEl = $('#toast');
}
