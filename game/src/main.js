// Dapur Kilat — boot, fixed-step loop, screenshot staging and a self-test.
// Open game/index.html to play. Add ?shot=start|play|serve|end&seed=1 for a
// staged screenshot scene, or ?test=1 to run the autopilot and log the result.
import { FIELD, STEP } from './config.js';
import { Sfx } from './audio.js';
import { attachInput } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { World, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : (Date.now() % 2147483647);
const shotName = params.get('shot');
const testMode = params.get('test') === '1';

const sfx = new Sfx();
const world = new World(seed);
world.sfxMuted = false;
world.paused = false;

let displayScreen = SCREEN_TITLE;
let lastStatus = '';

function setDisplayScreen(screen) {
  displayScreen = screen;
}

function announce() {
  if (!statusEl) return;
  const msg = world.screen === SCREEN_PLAY
    ? `Skor ${world.score}, ${world.served} hidangan disajikan, ${world.orders.length} pesanan menunggu, sisa shift ${Math.ceil(world.shiftLeft)} detik.`
    : world.screen === SCREEN_OVER
      ? `Shift selesai. Skor akhir ${world.score}, ${world.served} hidangan disajikan.`
      : 'Dapur Kilat. Tekan Enter untuk mulai memasak.';
  if (msg !== lastStatus) {
    lastStatus = msg;
    statusEl.textContent = msg;
  }
}

/** Play the queued sound for each world event, then clear the queue. */
function drainEvents() {
  for (const event of world.events) {
    if (event === 'add') sfx.add();
    else if (event === 'remove') sfx.remove();
    else if (event === 'sizzle') sfx.sizzle();
    else if (event === 'ding') sfx.ding();
    else if (event === 'serve') sfx.serve();
    else if (event === 'levelup') sfx.levelUp();
    else if (event === 'wrong') sfx.wrong();
    else if (event === 'expire') sfx.expire();
    else if (event === 'gameover') sfx.gameOver();
  }
  world.events.length = 0;
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

attachInput(canvas, {
  sfx,
  getWorld: () => world,
  onStart: () => {
    world.start();
    setDisplayScreen(SCREEN_PLAY);
    sfx.unlock();
    sfx.click();
  },
});

window.addEventListener('resize', fitCanvas);
fitCanvas();

// Exposed for debugging and for the self-test harness below.
window.__world = world;
window.__stageShot = (name) => stageShot(name, world);

if (shotName) {
  // Staged screenshot: run the real rules forward, draw one frame, stop.
  const staged = stageShot(shotName, world);
  setDisplayScreen(staged.screen);
  const frozen = { ...world, screen: staged.screen };
  draw(ctx, frozen, world.time);
  announce();
} else if (testMode) {
  // Self-test: play the game with the autopilot and report what happened.
  world.start();
  const { autopilot } = await import('./shots.js');
  const steps = Math.floor(45 / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen === SCREEN_OVER) break;
    autopilot(world);
    world.step(STEP);
  }
  drainEvents();
  const checks = {
    scoreAboveZero: world.score > 0,
    servedAtLeastTwo: world.served >= 2,
    ordersSpawned: world.served + world.missed + world.orders.length >= 2,
    noNegativeHearts: world.hearts >= 0,
    shiftTicks: world.shiftLeft < 150,
  };
  const passed = Object.values(checks).every(Boolean);
  console.log(`TEST ${passed ? 'PASS' : 'FAIL'} score=${world.score} served=${world.served} missed=${world.missed} hearts=${world.hearts} level=${world.level} combo=${world.combo} checks=${JSON.stringify(checks)}`);
  draw(ctx, world, world.time);
  ctx.fillStyle = passed ? '#2f9e44' : '#c1272d';
  ctx.font = '900 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(passed ? 'SELF-TEST PASS' : 'SELF-TEST FAIL', 28, 790);
} else {
  // Normal play: fixed-step updates, render every animation frame.
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!world.paused && world.screen === SCREEN_PLAY) {
      acc += elapsed;
      while (acc >= STEP) {
        world.step(STEP);
        acc -= STEP;
      }
    }
    drainEvents();
    setDisplayScreen(world.screen);
    const drawWorld = { ...world, screen: displayScreen };
    draw(ctx, drawWorld, world.time);
    announce();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
