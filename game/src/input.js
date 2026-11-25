// Mouse and keyboard for Dapur Kilat. Clicks are hit-tested against the same
// rectangles the renderer draws; keys mirror the same actions.
import { INGREDIENTS } from './config.js';
import {
  bellRect, binRect, cookButtonRect, hudButtonRects, overRestartRect,
  plateRect, plateSlotRect, pointIn, serveButtonRect, ticketRect,
  titleStartRect, trashRect,
} from './geometry.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

/**
 * Wire up the canvas. `hooks` supplies: onStart, onSfx (sfx instance) and a
 * `getWorld()` that always returns the current world. Returns a detach fn.
 */
export function attachInput(canvas, hooks) {
  const { sfx } = hooks;

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function handleClick(x, y) {
    const world = hooks.getWorld();
    if (sfx) sfx.unlock();
    const btns = hudButtonRects();
    if (pointIn(btns.pause, x, y)) {
      if (world.screen === SCREEN_PLAY) {
        world.paused = !world.paused;
        if (sfx) sfx.click();
      }
      return;
    }
    if (pointIn(btns.mute, x, y)) {
      if (sfx) {
        world.sfxMuted = sfx.toggleMute();
        sfx.click();
      }
      return;
    }
    if (world.screen === SCREEN_TITLE) {
      if (pointIn(titleStartRect(), x, y)) hooks.onStart();
      return;
    }
    if (world.screen === SCREEN_OVER) {
      if (pointIn(overRestartRect(), x, y)) hooks.onStart();
      return;
    }
    if (world.screen !== SCREEN_PLAY || world.paused) return;

    // Order tickets: serve the ready plate to that customer.
    for (let i = 0; i < world.orders.length; i += 1) {
      if (pointIn(ticketRect(i), x, y)) {
        const result = world.serve(world.orders[i].id);
        if (result && sfx) {
          if (result === 'ok' || result === 'mystery') sfx.serve();
          else sfx.wrong();
        }
        return;
      }
    }
    // Ingredient bins.
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (pointIn(binRect(i), x, y)) {
        if (world.addIngredient(INGREDIENTS[i].id) && sfx) sfx.add();
        return;
      }
    }
    // The stove's MASAK button (or the wok itself).
    if (pointIn(cookButtonRect(), x, y)) {
      if (world.cook() && sfx) sfx.sizzle();
      return;
    }
    // The serving bell / SAJIKAN button serves the best matching order.
    if (pointIn(serveButtonRect(), x, y) || pointIn(bellRect(), x, y)) {
      const result = world.serveBest();
      if (result && sfx) {
        if (result === 'ok' || result === 'mystery') sfx.serve();
        else sfx.wrong();
      }
      return;
    }
    // Trash: clear the plate.
    if (pointIn(trashRect(), x, y)) {
      if (world.clearPlate() && sfx) sfx.remove();
      return;
    }
    // Plate slots: tap an ingredient to take it back off the plate.
    for (let i = 0; i < 4; i += 1) {
      if (pointIn(plateSlotRect(i), x, y)) {
        if (world.removePlateIndex(i) && sfx) sfx.remove();
        return;
      }
    }
    void plateRect;
  }

  function handleKey(event) {
    const world = hooks.getWorld();
    const key = event.key.toLowerCase();
    if (key === 'm') {
      if (sfx) {
        world.sfxMuted = sfx.toggleMute();
        sfx.click();
      }
      return;
    }
    if (key === 'p' && world.screen === SCREEN_PLAY) {
      world.paused = !world.paused;
      if (sfx) sfx.click();
      return;
    }
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
      if (key === 'enter' || key === ' ') {
        event.preventDefault();
        hooks.onStart();
      }
      return;
    }
    if (world.screen !== SCREEN_PLAY || world.paused) return;
    if (sfx) sfx.unlock();
    const ingIndex = INGREDIENTS.findIndex((ing) => ing.key === key);
    if (ingIndex >= 0) {
      if (world.addIngredient(INGREDIENTS[ingIndex].id) && sfx) sfx.add();
      return;
    }
    if (key === 'c') {
      if (world.cook() && sfx) sfx.sizzle();
    } else if (key === 'v') {
      const result = world.serveBest();
      if (result && sfx) {
        if (result === 'ok' || result === 'mystery') sfx.serve();
        else sfx.wrong();
      }
    } else if (key === 't' || key === 'backspace' || key === 'delete') {
      if (world.clearPlate() && sfx) sfx.remove();
    }
  }

  function onMouseDown(event) {
    const pos = canvasPos(event);
    handleClick(pos.x, pos.y);
  }

  function onKeyDown(event) {
    // Ignore keys typed into form fields (there are none, but be safe).
    if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) return;
    handleKey(event);
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('keydown', onKeyDown);
  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('keydown', onKeyDown);
  };
}
