// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by
// a simple autopilot (cook the oldest order's dish, serve it), so the frame is
// what a real game looks like and the same seed always gives the same frame.
import { COOK_SECONDS, MAX_ORDERS, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

/** Popups, sparkles and banners are mid-flight effects; a still frame reads better without them. */
function clearTransients(world) {
  world.serveAnim = null;
  world.popups = [];
  world.particles = [];
  world.banner = null;
}

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const END_SECONDS = 400;

/**
 * One autopilot decision per step: if the plate is ready, serve it to the
 * matching order; if it is cooking, wait; else add the next missing
 * ingredient of the oldest order's recipe.
 */
export function autopilot(world) {
  if (world.screen !== SCREEN_PLAY) return;
  const plate = world.plate;
  if (plate.ready) {
    world.serveBest();
    return;
  }
  if (plate.cooking >= 0) return;
  const order = world.orders[0];
  if (!order) return;
  const recipe = order.dish.recipe;
  const missing = recipe.filter((ing) => !plate.items.includes(ing));
  // The plate holds only this order's ingredients: drop anything extra first.
  const extra = plate.items.find((ing) => !recipe.includes(ing));
  if (extra !== undefined) {
    world.removePlateIndex(plate.items.indexOf(extra));
    return;
  }
  if (missing.length === 0) {
    world.cook();
    return;
  }
  world.addIngredient(missing[0]);
}

function runFor(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen === SCREEN_OVER) break;
    if (pilot) pilot(world);
    world.step(STEP);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: title over a kitchen that already has orders coming in.
 * play: mid-rush, a dish half-assembled on the plate.
 * serve: a cooked plate, ready to serve, bell glowing.
 * end: the shift is over after a lazy cook let orders expire.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'serve') {
    world.start();
    // Play until a plate is cooked and ready, then freeze that frame.
    for (let i = 0; i < Math.floor(120 / STEP); i += 1) {
      if (world.screen === SCREEN_OVER) break;
      autopilot(world);
      world.step(STEP);
      if (world.plate.ready) {
        // Let the sparkles settle for a beat so the SIAP banner reads.
        for (let j = 0; j < Math.floor(0.6 / STEP); j += 1) world.step(STEP);
        break;
      }
    }
    while (world.orders.length < MAX_ORDERS) world.spawnOrder();
    clearTransients(world);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'play') {
    world.start();
    runFor(world, PLAY_SECONDS, autopilot);
    if (world.screen === SCREEN_OVER) {
      // The autopilot should not lose a shift this fast; replay shorter.
      world.start();
      runFor(world, 12, autopilot);
    }
    // A rich mid-rush frame: a full order board and a dish half-assembled.
    // These are ordinary reachable states, set here so the frame does not
    // depend on where the spawn timer happened to land.
    while (world.orders.length < MAX_ORDERS) world.spawnOrder();
    for (const order of world.orders) {
      order.timeLeft = Math.min(order.timeLeft, order.timeMax * 0.75);
    }
    world.plate.items = [];
    world.plate.cooking = -1;
    world.plate.ready = false;
    world.plate.cooked = null;
    const recipe = world.orders[0].dish.recipe;
    world.addIngredient(recipe[0]);
    if (recipe[1]) world.addIngredient(recipe[1]);
    clearTransients(world);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    world.start();
    // A cook who never lifts a finger: orders expire, hearts run out.
    runFor(world, END_SECONDS, null);
    return { screen: world.screen === SCREEN_OVER ? SCREEN_OVER : SCREEN_PLAY };
  }
  // start (default): a fresh kitchen with the title card over it.
  world.start();
  runFor(world, START_SECONDS, autopilot);
  return { screen: SCREEN_TITLE };
}

export { COOK_SECONDS };
