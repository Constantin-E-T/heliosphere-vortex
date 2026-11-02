import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/syne/latin-600.css';
import '@fontsource/syne/latin-700.css';
import '@fontsource/syne/latin-800.css';
import './styles/app.css';
import { initVoyagerHero } from './ui/voyager-hero.js';

const nextPaint = () =>
  new Promise(resolve => {
    const timer = setTimeout(resolve, 100); // animation frames stop in a hidden tab
    requestAnimationFrame(() => {
      clearTimeout(timer);
      setTimeout(resolve);
    });
  });

// The headline shows first. The 3D code loads afterwards, in its own file.
initVoyagerHero();
await nextPaint();
const { start } = await import('./app.js');
start();
