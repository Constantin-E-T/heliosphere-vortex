export const $ = s => document.querySelector(s);

export const DEG = Math.PI / 180;

export let reduceMotion;

export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function showFatal(msg) {
  $('#splash-err').hidden = false;
  $('#splash-err').textContent = msg;
  $('#load-t').textContent = 'Unable to start';
  $('#load-bar').style.width = '0';
}

/** @returns {boolean} false when the device cannot run the 3D view. */
export function initUtil() {
  reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  {
    let ok = false;
    try {
      const c = document.createElement('canvas');
      ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {}
    if (!ok) {
      showFatal(
        'This device or browser has WebGL turned off, so the 3D view cannot run. Try a recent Chrome, Safari, Edge or Firefox.'
      );
      return false;
    }
  }
  return true;
}
