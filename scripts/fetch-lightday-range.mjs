// Writes src/data/lightday-range.json: Earth-to-Voyager 1 distance from JPL Horizons, every 6 hours.
import { writeFileSync } from 'node:fs';

const params = new URLSearchParams({
  format: 'text', COMMAND: "'-31'", OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'", EPHEM_TYPE: "'VECTORS'",
  CENTER: "'500@399'", START_TIME: "'2026-10-01'", STOP_TIME: "'2027-02-01'", STEP_SIZE: "'6 h'",
  VEC_TABLE: "'3'", CSV_FORMAT: "'YES'", OUT_UNITS: "'KM-S'", TIME_TYPE: "'UT'"
});
const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`);
if (!res.ok) throw new Error(`Horizons returned ${res.status}`);
const text = await res.text();
if (!text.includes('$$SOE')) throw new Error(text.slice(-400));
const rows = text.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n').map(l => l.split(',').map(c => c.trim()));
const RANGE_COLUMN = 9;
const out = {
  source: 'JPL Horizons, target -31, centre 500@399, geometric range',
  queried: new Date().toISOString().slice(0, 10),
  startJd: Number(rows[0][0]),
  stepDays: 0.25,
  km: rows.map(r => Math.round(Number(r[RANGE_COLUMN])))
};
writeFileSync(new URL('../src/data/lightday-range.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`${out.km.length} rows, first ${out.km[0]} km`);
