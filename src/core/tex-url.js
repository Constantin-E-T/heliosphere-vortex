const size = Math.min(screen.width, screen.height) * devicePixelRatio <= 1200 ? 'phone' : 'desktop';

/** @param {string} name Image name without extension, such as `earth` or `photo/carina`. */
export const texUrl = name => `tex/${size}/${name}.webp`;
