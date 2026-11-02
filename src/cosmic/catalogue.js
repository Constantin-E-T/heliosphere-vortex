import * as THREE from 'three';
import { UP } from '../camera/cinematic.js';
import { DEG, rng } from '../core/util.js';
import { spinners } from './milky-way.js';
import { photoCard } from './photos.js';
import { galaxyCloud, galaxyDisk, glowSprite, nebula, starCloud } from './render.js';
import { GCP, cosmic, galV, gauss } from './scales.js';
import { V } from '../scene/renderer.js';
import { fresnelMat } from '../scene/textures.js';

export let KPC;

export function diskBasis(pos, inc, pa) {
  const n = pos.clone().normalize(),
    north = KPC.ncp.clone().addScaledVector(n, -KPC.ncp.dot(n)).normalize(),
    east = V().crossVectors(north, n).normalize();
  const major = north
    .clone()
    .multiplyScalar(Math.cos(pa * DEG))
    .addScaledVector(east, Math.sin(pa * DEG));
  const minor = V().crossVectors(n, major).normalize(),
    normal = n
      .clone()
      .multiplyScalar(Math.cos(inc * DEG))
      .addScaledVector(minor, Math.sin(inc * DEG))
      .normalize();
  return { u: major, v: V().crossVectors(normal, major).normalize(), w: normal };
}

export let COS;

export const COS_BY = {};

export let LG_CENTRE;

export let LAN_C;

export const LAN_R = 80000;

export let lanShell;

export function initCatalogue() {
  /* ---- Catalogue: position on the sky (l, b), distance d (kpc), radius r (kpc) ---- */
  KPC = { ncp: galV(122.93192, 27.12825, 1, V()).normalize() };
  COS = [
    {
      id: 'mw',
      name: 'Milky Way',
      kind: 'Barred spiral · home',
      tier: 'home',
      color: '#cfd8ff',
      pos: GCP.clone(),
      view: 62,
      stats: [
        ['Sun to centre', '8.275 kpc · 26,990 ly'],
        ['Stellar disk', '≈ 100,000 ly across'],
        ['Stars', '100–400 billion'],
        ['Mass with dark matter', '≈ 1–1.5 trillion Suns']
      ],
      note: 'Our galaxy, seen from outside. Arms follow a log-spiral model; their exact shape on the far side is still uncertain.'
    },
    {
      id: 'sun',
      name: 'Sun',
      kind: 'You are here',
      tier: 'sun',
      color: '#7fd4ff',
      pos: V(),
      view: 3,
      stats: [
        ['From galactic centre', '8.275 kpc'],
        ['Above the plane', '20.8 pc'],
        ['Orbital speed', '≈ 251.9 km/s'],
        ['One orbit', '≈ 210–230 Myr']
      ],
      note: 'The Sun sits in the Orion Spur, a minor arm between the Sagittarius–Carina and Perseus arms.'
    },
    {
      id: 'sgra',
      name: 'Sagittarius A*',
      kind: 'Supermassive black hole',
      tier: 'core',
      color: '#fff2c8',
      pos: GCP.clone(),
      view: 2,
      stats: [
        ['Distance', '8.275 kpc'],
        ['Mass', '4.3 million Suns']
      ],
      note: 'Weighed from the orbits of stars around it; imaged by the Event Horizon Telescope in 2022.'
    },
    {
      id: 'lmc',
      name: 'Large Magellanic Cloud',
      kind: 'Barred dwarf spiral',
      tier: 'sat',
      l: 280.47,
      b: -32.89,
      d: 49.59,
      r: 4.5,
      inc: 25,
      pa: 150,
      color: '#bcd2ff',
      n: 2500,
      view: 16,
      gal: {
        arms: 1,
        pitch: 28,
        r0: 1.2,
        armW: 0.25,
        bulge: 0.45,
        bar: 2.4,
        barAng: 0.4,
        rs: 1.4,
        irr: 0.7,
        dust: 0.4,
        seed: 8.8,
        core: '#ece6d6',
        arm: '#b3c9ff',
        disk: '#c8c8d8',
        bright: 1.4
      },
      note: 'The largest Milky Way satellite, visible to the naked eye from the southern hemisphere. Distance from eclipsing binaries, 1% precision.',
      src: 'Pietrzyński et al. 2019'
    },
    {
      id: 'smc',
      name: 'Small Magellanic Cloud',
      kind: 'Dwarf irregular',
      tier: 'sat',
      l: 302.8,
      b: -44.3,
      d: 62.44,
      r: 2.5,
      inc: 65,
      pa: 45,
      color: '#c9d6ff',
      n: 1200,
      view: 10,
      gal: {
        arms: 0,
        pitch: 20,
        bulge: 0.7,
        bar: 1.6,
        rs: 0.9,
        irr: 1,
        dust: 0.2,
        seed: 2.4,
        core: '#dfe3f0',
        arm: '#b8c8ff',
        disk: '#c4cbe0',
        bright: 1.4
      },
      src: 'Graczyk et al. 2020'
    },
    {
      id: 'sgr',
      name: 'Sagittarius Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 5.57,
      b: -14.17,
      d: 26,
      r: 1.5,
      color: '#ffe0b0',
      n: 500,
      stars: 7000,
      elong: 3.2,
      view: 8,
      note: 'Being torn apart by the Milky Way; its stars stream around the galaxy.',
      src: 'McConnachie 2012'
    },
    {
      id: 'dra',
      name: 'Draco Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 86.37,
      b: 34.72,
      d: 76,
      r: 0.4,
      color: '#ffe9c8',
      n: 150,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'umi',
      name: 'Ursa Minor Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 104.97,
      b: 44.8,
      d: 76,
      r: 0.4,
      color: '#ffe9c8',
      n: 150,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'scl',
      name: 'Sculptor Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 287.53,
      b: -83.16,
      d: 86,
      r: 0.4,
      color: '#ffe9c8',
      n: 150,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'sex',
      name: 'Sextans Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 243.5,
      b: 42.27,
      d: 86,
      r: 0.5,
      color: '#ffe9c8',
      n: 150,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'car',
      name: 'Carina Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 260.11,
      b: -22.22,
      d: 105,
      r: 0.3,
      color: '#ffe9c8',
      n: 120,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'fnx',
      name: 'Fornax Dwarf',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 237.1,
      b: -65.65,
      d: 147,
      r: 0.8,
      color: '#ffe9c8',
      n: 220,
      stars: 5000,
      view: 4,
      src: 'McConnachie 2012'
    },
    {
      id: 'leo2',
      name: 'Leo II',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 220.17,
      b: 67.23,
      d: 233,
      r: 0.2,
      color: '#ffe9c8',
      n: 100,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'leo1',
      name: 'Leo I',
      kind: 'Dwarf spheroidal',
      tier: 'sat',
      l: 225.99,
      b: 49.11,
      d: 254,
      r: 0.3,
      color: '#ffe9c8',
      n: 120,
      view: 3,
      src: 'McConnachie 2012'
    },
    {
      id: 'm42',
      name: 'Orion Nebula',
      alt: 'M42',
      kind: 'Emission nebula · star nursery',
      tier: 'neb',
      l: 209.01,
      b: -19.38,
      d: 0.414,
      size: 0.0074,
      color: '#ff8fa8',
      view: 0.022,
      neb: { type: 0, c1: '#ff5f86', c2: '#5fd2c4', c3: '#ffd3a0', stars: 0.9, cluster: 40 },
      stats: [['Diameter', '≈ 24 ly']],
      note: "The nearest large star-forming region, visible to the naked eye in Orion's sword. The Trapezium cluster at its heart lights the gas.",
      src: 'Menten et al. 2007'
    },
    {
      id: 'm45',
      name: 'Pleiades',
      alt: 'M45',
      kind: 'Young open cluster',
      tier: 'neb',
      l: 166.57,
      b: -23.52,
      d: 0.136,
      size: 0.009,
      color: '#8fb6ff',
      view: 0.025,
      neb: { type: 1, c1: '#6fa4ff', c2: '#6fa4ff', stars: 0.5, cluster: 70, op: 0.8 },
      stats: [['Age', '≈ 100 million years']],
      note: 'The Seven Sisters: hot blue stars drifting through a dust cloud that reflects their light.',
      src: 'Gaia'
    },
    {
      id: 'carina',
      name: 'Carina Nebula',
      kind: 'Emission nebula',
      tier: 'neb',
      l: 287.6,
      b: -0.63,
      d: 2.3,
      size: 0.09,
      color: '#ffa070',
      view: 0.25,
      neb: { type: 0, c1: '#ff7a4f', c2: '#e65a9a', c3: '#ffe0a8', stars: 0.7, cluster: 80 },
      stats: [['Diameter', '≈ 300 ly']],
      note: 'One of the largest star-forming regions in the galaxy, home to the unstable giant Eta Carinae.'
    },
    {
      id: 'm16',
      name: 'Eagle Nebula',
      alt: 'M16',
      kind: 'Emission nebula',
      tier: 'neb',
      l: 16.95,
      b: 0.79,
      d: 1.74,
      size: 0.022,
      color: '#7fd8b8',
      view: 0.06,
      neb: { type: 0, c1: '#3fbf9e', c2: '#d8b36a', c3: '#fff0c0', stars: 0.6, cluster: 30 },
      note: 'Home of the Pillars of Creation, columns of gas and dust where new stars are forming.'
    },
    {
      id: 'm8',
      name: 'Lagoon Nebula',
      alt: 'M8',
      kind: 'Emission nebula',
      tier: 'neb',
      l: 6.06,
      b: -1.2,
      d: 1.25,
      size: 0.033,
      color: '#ff8fb8',
      view: 0.09,
      neb: { type: 0, c1: '#ff5f8f', c2: '#ffb0cc', c3: '#ffe7c8', stars: 0.6, cluster: 40 },
      note: 'A giant cloud toward the galactic centre, bright enough to see with binoculars.'
    },
    {
      id: 'm1',
      name: 'Crab Nebula',
      alt: 'M1',
      kind: 'Supernova remnant',
      tier: 'neb',
      l: 184.56,
      b: -5.78,
      d: 2.0,
      size: 0.0034,
      color: '#8fb8ff',
      view: 0.01,
      neb: { type: 2, c1: '#7fb6ff', c2: '#ff9a5c', stars: 0.9 },
      stats: [['Diameter', '≈ 11 ly']],
      note: 'The wreck of a star whose explosion was recorded by astronomers in 1054. A pulsar spins 30 times a second at its centre.'
    },
    {
      id: 'cliffs',
      name: 'Cosmic Cliffs',
      alt: 'NGC 3324',
      kind: 'Star-forming region · Carina Nebula',
      tier: 'neb',
      l: 286.22,
      b: -0.18,
      d: 2.3,
      size: 0.0045,
      photo: 'carina',
      color: '#ffb27a',
      view: 0.0058,
      stats: [['Tallest peaks', '≈ 7 light-years']],
      note: 'Webb\'s infrared view of the edge of a giant cavity in the Carina Nebula. The "mountains" are walls of gas and dust eroded by hot young stars above them, with newborn stars shining through.'
    },
    {
      id: 'ring',
      name: 'Southern Ring Nebula',
      alt: 'NGC 3132',
      kind: 'Planetary nebula · a dying star',
      tier: 'neb',
      l: 272.11,
      b: 12.4,
      d: 0.77,
      size: 0.0003,
      photo: 'southern_nebula',
      color: '#ff9a70',
      view: 0.00042,
      stats: [['Nebula', '≈ 0.5 light-years across']],
      note: 'Shells of gas thrown off by a dying Sun-like star. Webb revealed the faint second star at its centre that shaped them.'
    },
    {
      id: 'tarantula',
      name: 'Tarantula Nebula',
      alt: '30 Doradus',
      kind: 'Star-forming region · in the LMC',
      tier: 'sat',
      l: 279.47,
      b: -31.67,
      d: 49.59,
      size: 0.104,
      photo: 'tarantula',
      color: '#8fd0ff',
      view: 0.135,
      stats: [['Shown', '≈ 340 light-years across']],
      note: 'The largest and brightest star-forming region in the Local Group, inside the Large Magellanic Cloud. Webb found thousands of young stars hidden in its dust.'
    },
    {
      id: 'm31',
      name: 'Andromeda',
      alt: 'M31',
      kind: 'Spiral · largest in the Local Group',
      tier: 'lg',
      l: 121.17,
      b: -21.57,
      d: 761,
      r: 23,
      inc: 77,
      pa: 38,
      color: '#ffe2b8',
      n: 9000,
      view: 90,
      gal: {
        arms: 2,
        pitch: 8,
        r0: 3.2,
        armW: 0.12,
        bulge: 1.9,
        rs: 5.8,
        ringR: 10,
        ringS: 1.1,
        dust: 0.55,
        seed: 11,
        core: '#ffd8a8',
        arm: '#b5c8ff',
        disk: '#d9c6a8',
        bright: 1.15
      },
      stats: [
        ['Diameter', '≈ 150,000 ly'],
        ['Approach speed', '≈ 110 km/s']
      ],
      note: 'Heading toward us. A 2025 study (Sawala et al.) puts the chance of a merger with the Milky Way within 10 billion years at about 50%.',
      src: 'Li et al. 2021'
    },
    {
      id: 'm32',
      name: 'M32',
      kind: 'Compact elliptical',
      tier: 'sat2',
      l: 121.15,
      b: -21.98,
      d: 785,
      r: 0.6,
      color: '#ffe9c8',
      n: 200,
      stars: 5000,
      elong: 1.15,
      view: 8,
      src: 'McConnachie 2012'
    },
    {
      id: 'm110',
      name: 'M110',
      kind: 'Dwarf elliptical',
      tier: 'sat2',
      l: 120.72,
      b: -21.14,
      d: 824,
      r: 1.5,
      color: '#ffe9c8',
      n: 300,
      stars: 5000,
      elong: 1.8,
      view: 10,
      src: 'McConnachie 2012'
    },
    {
      id: 'm33',
      name: 'Triangulum',
      alt: 'M33',
      kind: 'Spiral',
      tier: 'lg',
      l: 133.61,
      b: -31.33,
      d: 809,
      r: 9,
      inc: 55,
      pa: 23,
      color: '#cfe0ff',
      n: 4000,
      view: 40,
      gal: {
        arms: 2,
        pitch: 24,
        r0: 1.1,
        armW: 0.17,
        bulge: 0.35,
        rs: 1.8,
        irr: 0.3,
        dust: 0.6,
        seed: 5.2,
        core: '#ffe1b8',
        arm: '#a8c6ff',
        disk: '#b9c4d8',
        bright: 1.3
      },
      stats: [['Diameter', '≈ 60,000 ly']],
      note: 'Third-largest Local Group galaxy, probably bound to Andromeda.',
      src: 'McConnachie 2012'
    },
    {
      id: 'n6822',
      name: 'NGC 6822',
      alt: "Barnard's Galaxy",
      kind: 'Dwarf irregular',
      tier: 'lg',
      l: 25.34,
      b: -18.4,
      d: 459,
      r: 1.5,
      inc: 50,
      pa: 10,
      color: '#d6e2ff',
      n: 400,
      view: 10,
      gal: {
        arms: 0,
        pitch: 20,
        bulge: 0.3,
        bar: 1.2,
        rs: 0.5,
        irr: 1,
        dust: 0.2,
        seed: 4.1,
        core: '#e3e6f2',
        arm: '#b8c8ff',
        disk: '#c4cbe0',
        bright: 1.4
      },
      src: 'McConnachie 2012'
    },
    {
      id: 'ic1613',
      name: 'IC 1613',
      kind: 'Dwarf irregular',
      tier: 'lg',
      l: 129.73,
      b: -60.58,
      d: 755,
      r: 1.5,
      inc: 40,
      pa: 60,
      color: '#d6e2ff',
      n: 350,
      view: 10,
      gal: {
        arms: 0,
        pitch: 20,
        bulge: 0.3,
        rs: 0.55,
        irr: 1,
        dust: 0.15,
        seed: 6.3,
        core: '#e3e6f2',
        arm: '#b8c8ff',
        disk: '#c4cbe0',
        bright: 1.3
      },
      src: 'McConnachie 2012'
    },
    {
      id: 'wlm',
      name: 'WLM',
      kind: 'Dwarf irregular',
      tier: 'lg',
      l: 75.86,
      b: -73.62,
      d: 933,
      r: 1.2,
      inc: 70,
      pa: 0,
      color: '#d6e2ff',
      n: 300,
      view: 10,
      gal: {
        arms: 0,
        pitch: 20,
        bulge: 0.25,
        rs: 0.45,
        irr: 1,
        dust: 0.15,
        seed: 7.7,
        core: '#e3e6f2',
        arm: '#b8c8ff',
        disk: '#c4cbe0',
        bright: 1.3
      },
      src: 'McConnachie 2012'
    },
    {
      id: 'scg',
      name: 'Sculptor Group',
      alt: 'NGC 253',
      kind: 'Galaxy group',
      tier: 'grp',
      l: 97.37,
      b: -87.96,
      d: 3500,
      r: 350,
      color: '#d8e2ff',
      n: 70,
      group: true,
      view: 2500,
      src: 'Karachentsev et al.'
    },
    {
      id: 'm81',
      name: 'M81 Group',
      kind: 'Galaxy group',
      tier: 'grp',
      l: 142.09,
      b: 40.9,
      d: 3630,
      r: 300,
      color: '#d8e2ff',
      n: 60,
      group: true,
      view: 2500,
      src: 'Karachentsev et al.'
    },
    {
      id: 'cena',
      name: 'Centaurus A Group',
      kind: 'Galaxy group',
      tier: 'grp',
      l: 309.52,
      b: 19.42,
      d: 3800,
      r: 350,
      color: '#ffe2c0',
      n: 70,
      group: true,
      view: 2500,
      src: 'Karachentsev et al.'
    },
    {
      id: 'virgo',
      name: 'Virgo Cluster',
      kind: 'Galaxy cluster · 1,300+ galaxies',
      tier: 'lu',
      l: 283.78,
      b: 74.49,
      d: 16500,
      r: 2200,
      color: '#ffe6c6',
      n: 900,
      cluster: true,
      view: 7000,
      note: "The nearest large cluster and the heart of our Local Supercluster. Its pull slows the Local Group's cosmic expansion.",
      src: 'Mei et al. 2007'
    },
    {
      id: 'fornax',
      name: 'Fornax Cluster',
      kind: 'Galaxy cluster',
      tier: 'lu',
      l: 236.72,
      b: -53.64,
      d: 20000,
      r: 700,
      color: '#ffe6c6',
      n: 300,
      cluster: true,
      view: 2600,
      src: 'Blakeslee et al. 2009'
    },
    {
      id: 'cent',
      name: 'Centaurus Cluster',
      kind: 'Galaxy cluster',
      tier: 'lu',
      l: 302.4,
      b: 21.6,
      d: 48900,
      r: 1500,
      color: '#ffe6c6',
      n: 500,
      cluster: true,
      view: 5200,
      src: 'redshift, H₀ = 70'
    },
    {
      id: 'hydra',
      name: 'Hydra Cluster',
      kind: 'Galaxy cluster',
      tier: 'lu',
      l: 269.6,
      b: 26.5,
      d: 54000,
      r: 1500,
      color: '#ffe6c6',
      n: 450,
      cluster: true,
      view: 5200,
      src: 'redshift, H₀ = 70'
    },
    {
      id: 'norma',
      name: 'Norma Cluster',
      kind: 'Galaxy cluster · Great Attractor',
      tier: 'lu',
      l: 325.3,
      b: -7.3,
      d: 67300,
      r: 2000,
      color: '#ffd9b0',
      n: 650,
      cluster: true,
      view: 7000,
      note: "Sits near the centre of the Great Attractor, the mass concentration our part of the universe is flowing toward. Hidden behind the Milky Way's disk.",
      src: 'redshift, H₀ = 70'
    },
    {
      id: 'perseus',
      name: 'Perseus Cluster',
      kind: 'Galaxy cluster',
      tier: 'lu',
      l: 150.57,
      b: -13.26,
      d: 76700,
      r: 2000,
      color: '#ffe6c6',
      n: 700,
      cluster: true,
      view: 7000,
      note: 'Part of the Perseus–Pisces Supercluster, outside Laniakea.',
      src: 'redshift, H₀ = 70'
    },
    {
      id: 'coma',
      name: 'Coma Cluster',
      kind: 'Galaxy cluster · 1,000+ galaxies',
      tier: 'lu',
      l: 58.08,
      b: 87.96,
      d: 99000,
      r: 3000,
      color: '#ffe6c6',
      n: 1000,
      cluster: true,
      view: 10000,
      note: 'Where Fritz Zwicky first found evidence for dark matter in 1933. Lies just outside Laniakea.',
      src: 'redshift, H₀ = 70'
    },
    {
      id: 'sq',
      name: "Stephan's Quintet",
      kind: 'Compact galaxy group · colliding',
      tier: 'grp2',
      l: 93.25,
      b: -20.99,
      d: 89000,
      size: 150,
      photo: 'stephans_quintet',
      color: '#ffd9a8',
      view: 195,
      note: 'Four of its galaxies are locked in a slow collision 290 million light-years away; the fifth, NGC 7320, is much closer and only lines up by chance. Webb sees shock waves rippling between them.'
    },
    {
      id: 'cartwheel',
      name: 'Cartwheel Galaxy',
      kind: 'Ring galaxy · after a collision',
      tier: 'grp2',
      l: 326.31,
      b: -82.78,
      d: 153000,
      size: 100,
      photo: 'cartwheel',
      color: '#a8c8ff',
      view: 130,
      note: 'A smaller galaxy punched through it about 400 million years ago, sending a ring of star formation rippling outward like a stone dropped in a pond.'
    },
    {
      id: 'smacs',
      name: "Webb's First Deep Field",
      alt: 'SMACS 0723',
      kind: 'Galaxy cluster · gravitational lens',
      tier: 'top',
      l: 284.99,
      b: -23.7,
      d: 1530000,
      size: 800,
      photo: 'deep_field',
      color: '#ffe6c6',
      view: 1050,
      noAuto: true,
      stats: [
        ['Redshift', 'z = 0.39'],
        ['Light left it', '≈ 4.6 billion years ago'],
        ['Comoving distance', '≈ 1.5 Gpc'],
        ['Released', '12 July 2022']
      ],
      note: "The cluster's gravity bends and magnifies light from galaxies far behind it; some of those arcs left their galaxies more than 13 billion years ago. A patch of sky the size of a grain of sand held at arm's length."
    }
  ];
  COS.forEach(o => (COS_BY[o.id] = o));
  {
    COS.forEach((o, k) => {
      if (o.l === undefined) return;
      o.pos = galV(o.l, o.b, o.d, V());
      const toSun = o.pos.clone().negate().normalize();
      o.viewDir = toSun
        .clone()
        .add(new THREE.Vector3(0, 0.25, 0))
        .normalize();
      const R = rng(k * 71 + 5),
        g = new THREE.Group();
      g.position.copy(o.pos);
      cosmic.add(g);
      o.obj = g;
      if (o.gal) {
        const B = diskBasis(o.pos, o.inc ?? 50, o.pa ?? 0),
          spin = new THREE.Group();
        spin.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(B.u, B.v, B.w));
        g.add(spin);
        spin.add(galaxyDisk(o));
        o.spin = spin;
        spinners.push(o);
        o.viewDir = B.w
          .clone()
          .multiplyScalar(B.w.dot(toSun) >= 0 ? 0.5 : -0.5)
          .add(toSun.clone().multiplyScalar(0.9))
          .normalize(); // close to how we see it from Earth
        const rs = o.gal.rs;
        g.add(
          starCloud(
            o.n,
            (i, p, c, s) => {
              const rr = Math.min(o.r, -rs * Math.log(1 - R() * 0.99)),
                th = R() * Math.PI * 2,
                z = gauss(R) * rs * 0.05;
              p.set(rr * Math.cos(th), rr * Math.sin(th), z);
              const blue = R() < 0.6;
              c.setHSL(blue ? 0.6 : 0.1, blue ? 0.35 : 0.45, 0.7 + R() * 0.2);
              s.size = o.r / 900 + (Math.pow(R(), 4) * o.r) / 200;
            },
            2.2,
            0.55
          ).translateZ(0)
        );
        spin.add(g.children.pop());
      } else if (o.cluster || o.group) {
        g.add(
          galaxyCloud(
            o.n,
            (i, p, c, s) => {
              const rr = o.r * 0.25 * Math.sqrt(1 / Math.pow(1 - R() * 0.96, 2 / 3) - 1),
                u = R() * 2 - 1,
                t = R() * Math.PI * 2,
                sq = Math.sqrt(1 - u * u);
              p.set(rr * sq * Math.cos(t), rr * u, rr * sq * Math.sin(t));
              const ell = R() < (o.cluster ? 0.65 : 0.35);
              c.setHSL(ell ? 0.09 : 0.6, ell ? 0.5 : 0.35, 0.68 + R() * 0.2);
              s.size =
                (i === 0 && o.cluster ? 280 : 30 + Math.pow(R(), 3) * 140) * (o.group ? 0.35 : 1);
              s.ang = R() * Math.PI;
              s.ratio = ell ? 0.55 + R() * 0.45 : 0.18 + R() * 0.5;
              if (i === 0) {
                p.set(0, 0, 0);
                s.ratio = 0.9;
              }
              if (i < (o.group ? 40 : 90))
                (o.members = o.members || []).push({
                  p: p.clone(),
                  size: s.size,
                  ell,
                  ang: s.ang,
                  ratio: s.ratio
                });
            },
            16
          )
        );
        g.add(glowSprite(o.color, o.r * 1.5, o.cluster ? 0.2 : 0.12));
      } else if (o.photo) {
        o.card = photoCard(o);
        g.add(o.card);
        o.tel = 'webb';
      } else if (o.neb) {
        const nb = o.neb;
        g.add(
          nebula(
            o.size,
            nb.type,
            nb.c1,
            nb.c2,
            nb.c3 || nb.c1,
            k * 1.37 + 2,
            nb.stars || 0,
            nb.op || 1
          )
        );
        if (nb.cluster)
          g.add(
            starCloud(
              nb.cluster,
              (i, p, c, s) => {
                const rr = Math.abs(gauss(R)) * o.size * 0.18,
                  u = R() * 2 - 1,
                  t = R() * Math.PI * 2,
                  sq = Math.sqrt(1 - u * u);
                p.set(rr * sq * Math.cos(t), rr * u, rr * sq * Math.sin(t));
                c.setHSL(0.6, 0.5, 0.85);
                s.size = o.size * (0.01 + Math.pow(R(), 3) * 0.05);
              },
              4,
              1
            )
          );
      } else {
        // dwarf spheroidal or elliptical: thousands of resolved old stars in a Plummer profile, plus unresolved glow
        const ell = o.elong || 1.4,
          n = o.stars || 3000,
          compact = o.kind.includes('elliptical');
        g.add(
          nebula(
            o.r * (compact ? 2 : 1.7),
            3,
            o.color,
            o.color,
            o.color,
            k * 1.3,
            0,
            compact ? 0.7 : 0.3
          )
        );
        g.add(
          starCloud(
            n,
            (i, p, c, s) => {
              const rr = o.r * 0.55 * Math.sqrt(1 / Math.pow(1 - R() * 0.985, 2 / 3) - 1),
                u = R() * 2 - 1,
                t = R() * Math.PI * 2,
                sq = Math.sqrt(1 - u * u);
              p.set(
                rr * sq * Math.cos(t) * ell,
                (rr * u) / ell,
                rr * sq * Math.sin(t)
              ).applyAxisAngle(UP, k);
              const tpe = R();
              c.setHSL(
                tpe < 0.08 ? 0.6 : tpe < 0.55 ? 0.1 : 0.06,
                tpe < 0.08 ? 0.5 : 0.55,
                0.62 + R() * 0.3
              ); // a few blue horizontal-branch stars among red giants
              s.size = (o.r / 140) * (0.5 + Math.pow(R(), 5) * 3);
            },
            2.4,
            1
          )
        );
      }
    });
  }
  // The Local Group, and Laniakea (outline is schematic: centred on the Great Attractor, about 160 Mpc across)
  LG_CENTRE = GCP.clone().lerp(COS_BY.m31.pos, 0.42);
  COS.push({
    id: 'lg',
    name: 'Local Group',
    kind: 'Our galaxy group · 80+ galaxies',
    tier: 'lu',
    color: '#bcd2ff',
    pos: LG_CENTRE,
    view: 2000,
    stats: [
      ['Diameter', '≈ 3 Mpc · 10 million ly'],
      ['Largest members', 'Andromeda, Milky Way, Triangulum']
    ],
    note: 'Bound together by gravity while the rest of the universe expands away. Its mass is dominated by Andromeda and the Milky Way.'
  });
  LAN_C = COS_BY.norma.pos.clone();
  lanShell = new THREE.Mesh(
    new THREE.SphereGeometry(LAN_R, 64, 40),
    (() => {
      const m = fresnelMat('#5f8dff', 3.5, 0.22);
      m.depthTest = false;
      return m;
    })()
  );
  lanShell.position.copy(LAN_C);
  cosmic.add(lanShell);
  COS.push({
    id: 'lan',
    name: 'Laniakea Supercluster',
    kind: 'Our home supercluster',
    tier: 'top',
    color: '#8fb0ff',
    pos: LAN_C.clone(),
    labelPos: LAN_C.clone().add(new THREE.Vector3(0, LAN_R * 0.98, 0)),
    view: 320000,
    stats: [
      ['Diameter', '≈ 160 Mpc · 520 million ly'],
      ['Mass', '≈ 10¹⁷ Suns'],
      ['Galaxies', '≈ 100,000']
    ],
    note: 'Defined in 2014 by the flow of galaxies toward the Great Attractor. The outline here is a schematic sphere, not the true irregular boundary.',
    src: 'Tully et al. 2014'
  });
  COS_BY.lg = COS[COS.length - 2];
  COS_BY.lan = COS[COS.length - 1];
}
