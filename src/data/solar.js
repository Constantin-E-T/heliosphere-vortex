import { Eph } from '../engine/ephemeris.js';

/* ================= DATA ================= */
export const PLANETS = [
  {
    name: 'Mercury',
    key: 'Mercury',
    r: 0.45,
    color: '#b4aca4',
    type: 'rock',
    tex: ['#8d8580', '#b5aea6', '#6f6a66'],
    pole: [281.0103, 61.4155],
    rotH: 1407.6,
    year: '88.0 days',
    day: '58.6 days',
    tilt: '0.03°',
    moonsN: '0',
    note: 'Smallest planet and the fastest, sweeping its orbit in 88 days. Its orbit is the most eccentric of the eight.'
  },
  {
    name: 'Venus',
    key: 'Venus',
    map: 'venus',
    r: 1.05,
    color: '#e8b37a',
    type: 'cloud',
    tex: ['#e9c48f', '#d9a066', '#f3dcb0'],
    pole: [272.76, 67.16],
    rotH: -5832.5,
    year: '224.7 days',
    day: '243 days, retrograde',
    tilt: '177.4°',
    moonsN: '0',
    note: 'Spins backwards, so slowly that its day is longer than its year. Hottest surface in the solar system.'
  },
  {
    name: 'Earth',
    key: 'EMB',
    map: 'earth',
    r: 1.1,
    color: '#4f8fe8',
    type: 'earth',
    pole: [0, 90],
    rotH: 23.934,
    atmo: '#5aa9ff',
    year: '365.26 days',
    day: '23.9 hours',
    tilt: '23.4°',
    moonsN: '1',
    note: 'Its 23.4° tilt gives the seasons. The Moon is placed from the Astronomical Almanac series; its distance is drawn enlarged.'
  },
  {
    name: 'Mars',
    key: 'Mars',
    map: 'mars',
    r: 0.62,
    color: '#d0603a',
    type: 'rock',
    tex: ['#b5502f', '#d97a4f', '#8a3a22'],
    pole: [317.269, 54.433],
    rotH: 24.6,
    year: '687.0 days',
    day: '24.6 hours',
    tilt: '25.2°',
    moonsN: '2',
    note: 'Home to Olympus Mons. Phobos circles faster than Mars spins and is slowly spiralling inward.',
    moons: [
      { name: 'Phobos', map: 'phobos', r: 0.12, d: 1.3, P: 0.3187, L0: 215.2, color: '#9b8b7c' },
      { name: 'Deimos', map: 'deimos', r: 0.1, d: 1.9, P: 1.2625, L0: 259.3, color: '#a89a8c' }
    ]
  },
  {
    name: 'Jupiter',
    key: 'Jupiter',
    map: 'jupiter',
    r: 4.2,
    color: '#d8a46c',
    type: 'gas',
    tex: ['#e3c39b', '#b9845a', '#f1e0c5', '#9c6a45'],
    pole: [268.057, 64.495],
    rotH: 9.9,
    year: '11.86 years',
    day: '9.9 hours',
    tilt: '3.1°',
    moonsN: '101 (IAU, Mar 2026)',
    note: 'More than twice the mass of all other planets combined. Shown with Io, Europa, Ganymede and Callisto at their JPL phases.',
    moons: [
      { name: 'Io', map: 'io', r: 0.3, d: 6.0, P: 1.762732, L0: 20.0, color: '#e6d46a' },
      { name: 'Europa', map: 'europa', r: 0.26, d: 7.3, P: 3.525463, L0: 214.4, color: '#d8cbb4' },
      {
        name: 'Ganymede',
        map: 'ganymede',
        r: 0.42,
        d: 9.0,
        P: 7.155588,
        L0: 221.6,
        color: '#a9a196'
      },
      {
        name: 'Callisto',
        map: 'callisto',
        r: 0.38,
        d: 10.9,
        P: 16.69044,
        L0: 80.3,
        color: '#7d7468'
      }
    ]
  },
  {
    name: 'Saturn',
    key: 'Saturn',
    map: 'saturn',
    r: 3.6,
    color: '#e6cf94',
    type: 'gas',
    tex: ['#efdcae', '#d2b67a', '#f6ebcc', '#b89c62'],
    pole: [40.589, 83.537],
    rotH: 10.7,
    rings: [4.6, 8.6],
    year: '29.4 years',
    day: '10.7 hours',
    tilt: '26.7°',
    moonsN: '285 (IAU, Mar 2026)',
    note: 'Its rings are mostly water ice. Titan, shown here, has a thick nitrogen atmosphere.',
    moons: [{ name: 'Titan', map: 'titan', r: 0.5, d: 11, P: 15.945, L0: 0, color: '#e0a64a' }]
  },
  {
    name: 'Uranus',
    key: 'Uranus',
    r: 2.2,
    color: '#9fdde4',
    type: 'ice',
    tex: ['#a9e3ea', '#94d4dc', '#b8eaef'],
    pole: [257.311, -15.175],
    rotH: -17.2,
    rings: [3.0, 4.0],
    ringFaint: true,
    year: '83.7 years',
    day: '17.2 hours, retrograde',
    tilt: '97.8°',
    moonsN: '28',
    note: 'Rolls around the Sun on its side. Watch its pole swing toward and away from the Sun over 84 years.'
  },
  {
    name: 'Neptune',
    key: 'Neptune',
    map: 'neptune',
    r: 2.1,
    color: '#4f6fe0',
    type: 'ice',
    tex: ['#5476e6', '#3f5bc4', '#6a8af0'],
    pole: [299.36, 43.46],
    rotH: 16.1,
    year: '163.7 years',
    day: '16.1 hours',
    tilt: '28.3°',
    moonsN: '16',
    note: 'Found in 1846 from its pull on Uranus. It has completed only one orbit since then, in 2011.'
  }
];

export let ORDER;

export const COLORS = { Sun: '#ffb547', 'Voyager 1': '#ff6fa8' };

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export const RATES = [
  { d: 1 / 86400, t: 'Live (1 s/s)' },
  { d: 1 / 1440, t: '1 min / s' },
  { d: 1 / 24, t: '1 hour / s' },
  { d: 0.25, t: '6 hours / s' },
  { d: 1, t: '1 day / s' },
  { d: 7, t: '1 week / s' },
  { d: 30.4375, t: '1 month / s' },
  { d: 91.3125, t: '3 months / s' },
  { d: 365.25, t: '1 year / s' },
  { d: 3652.5, t: '10 years / s' },
  { d: 36525, t: '100 years / s' }
];

export const ev = (y, m, d, h, mi) => Eph.calToJD(y, m, d + ((h || 0) + (mi || 0) / 60) / 24);

export let EVENTS;

export function initSolarData() {
  ORDER = ['Sun', ...PLANETS.map(p => p.name), 'Voyager 1'];
  PLANETS.forEach(p => (COLORS[p.name] = p.color));
  EVENTS = [
    {
      jd: ev(-43, 3, 15, 12),
      name: 'Ides of March',
      sub: 'The sky on the day Julius Caesar died',
      focus: 'Earth'
    },
    {
      jd: ev(1610, 1, 7, 18),
      name: "Galileo sees Jupiter's moons",
      sub: 'First telescopic view of Io, Europa, Ganymede, Callisto',
      focus: 'Jupiter'
    },
    {
      jd: ev(1781, 3, 13, 22),
      name: 'Herschel discovers Uranus',
      sub: 'First planet found with a telescope',
      focus: 'Uranus'
    },
    {
      jd: ev(1846, 9, 23, 23),
      name: 'Neptune found',
      sub: "Located by Galle from Le Verrier's prediction",
      focus: 'Neptune'
    },
    {
      jd: ev(1969, 7, 20, 20, 17),
      name: 'Apollo 11 lands',
      sub: 'Eagle touches down in the Sea of Tranquility',
      focus: 'Earth'
    },
    {
      jd: ev(1977, 9, 5, 12, 56),
      name: 'Voyager 1 launches',
      sub: 'Titan IIIE–Centaur, Cape Canaveral',
      focus: 'Voyager 1'
    },
    {
      jd: ev(1979, 3, 5, 12, 4),
      name: 'Voyager 1 at Jupiter',
      sub: 'Closest approach 348,890 km from centre',
      focus: 'Voyager 1'
    },
    {
      jd: ev(1980, 11, 12, 23, 46),
      name: 'Voyager 1 at Saturn',
      sub: 'Hours after a 6,490 km pass of Titan',
      focus: 'Voyager 1'
    },
    {
      jd: ev(1990, 2, 14, 5, 22),
      name: 'Pale Blue Dot',
      sub: 'Earth photographed from 40.4 AU',
      focus: 'Voyager 1'
    },
    {
      jd: ev(1998, 2, 17),
      name: 'Most distant human object',
      sub: 'Voyager 1 passes Pioneer 10 at 69.4 AU',
      focus: 'Voyager 1'
    },
    {
      jd: ev(2004, 12, 16),
      name: 'Termination shock',
      sub: 'Solar wind drops below sound speed, 94 AU',
      focus: 'Voyager 1'
    },
    {
      jd: ev(2012, 8, 25),
      name: 'Interstellar space',
      sub: 'Voyager 1 crosses the heliopause at 121.6 AU',
      focus: 'Voyager 1'
    },
    {
      jd: ev(2020, 12, 21, 18, 20),
      name: 'Great Conjunction',
      sub: 'Jupiter and Saturn 0.1° apart from Earth',
      focus: 'Jupiter'
    },
    {
      jd: ev(2026, 11, 18, 10, 16),
      name: 'One light-day',
      sub: 'Voyager 1 is 24 light-hours from Earth (time approximate)',
      focus: 'Voyager 1'
    },
    {
      jd: ev(2032, 11, 13, 8, 54),
      name: 'Transit of Mercury',
      sub: 'Mercury crosses the face of the Sun',
      focus: 'Mercury'
    },
    {
      jd: ev(2040, 10, 31, 12),
      name: 'Next Great Conjunction',
      sub: 'Jupiter and Saturn meet again',
      focus: 'Saturn'
    },
    { jd: ev(3000, 6, 21, 12), name: 'AD 3000', sub: "Edge of JPL's fitted range", focus: 'Sun' }
  ];
}
