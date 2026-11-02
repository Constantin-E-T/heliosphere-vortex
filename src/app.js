import { initUtil, showFatal } from './core/util.js';
import { initSolarData } from './data/solar.js';
import { initRenderer } from './scene/renderer.js';
import { initTextures } from './scene/textures.js';
import { initSky } from './scene/sky.js';
import { initSun } from './scene/sun.js';
import { initPlanets } from './scene/planets.js';
import { initVoyager } from './scene/voyager.js';
import { initDust } from './scene/dust.js';
import { initWakes } from './scene/wakes.js';
import { initState } from './core/state.js';
import { initTime } from './core/time.js';
import { initCamera } from './camera/camera.js';
import { initLabels } from './ui/labels.js';
import { initInfoCard } from './ui/info-card.js';
import { initTimeMachine } from './ui/time-machine.js';
import { initCleanView } from './ui/clean-view.js';
import { initPanel } from './ui/panel.js';
import { initSound } from './ui/sound.js';
import { initKeyboard } from './ui/keyboard.js';
import { initPicking } from './ui/picking.js';
import { initCinematic } from './camera/cinematic.js';
import { initCosmicScales } from './cosmic/scales.js';
import { initCosmicRender } from './cosmic/render.js';
import { initMilkyWay } from './cosmic/milky-way.js';
import { initPhotos } from './cosmic/photos.js';
import { initCatalogue } from './cosmic/catalogue.js';
import { initCosmicLevels } from './cosmic/levels.js';
import { initCosmicInfo } from './cosmic/info.js';
import { initFlight } from './cosmic/flight.js';
import { initSwitching } from './cosmic/switching.js';
import { initLoop } from './core/loop.js';
import { initBoot } from './core/boot.js';
import { initWelcome, ready } from './ui/welcome.js';

// Order matters: each step uses what the steps before it created.
const STEPS = [
  initSolarData,
  initRenderer,
  initTextures,
  initSky,
  initSun,
  initPlanets,
  initVoyager,
  initDust,
  initWakes,
  initState,
  initTime,
  initCamera,
  initLabels,
  initInfoCard,
  initTimeMachine,
  initCleanView,
  initPanel,
  initSound,
  initKeyboard,
  initPicking,
  initCinematic,
  initCosmicScales,
  initCosmicRender,
  initMilkyWay,
  initPhotos,
  initCatalogue,
  initCosmicLevels,
  initCosmicInfo,
  initFlight,
  initSwitching,
  initLoop,
  initBoot,
  initWelcome
];

/** Builds the app in small steps, so the page stays responsive. */
export async function start() {
  if (!initUtil()) return;
  const bar = document.querySelector('#load-bar');
  try {
    for (const [i, step] of STEPS.entries()) {
      const begun = performance.now();
      step();
      performance.measure(step.name, { start: begun });
      bar.style.width = `${Math.round(((i + 1) / STEPS.length) * 80)}%`;
      await new Promise(resolve => setTimeout(resolve));
    }
  } catch (e) {
    console.error(e);
    showFatal(
      'The 3D view could not start on this device. Try a recent Chrome, Safari, Edge or Firefox.'
    );
    return;
  }
  ready(); // images keep streaming in; nobody waits for them
}
