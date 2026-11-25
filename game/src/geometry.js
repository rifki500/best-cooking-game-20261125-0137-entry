// Every clickable rectangle, computed from the fixed layout, so the renderer
// and the input handler always agree about where things are.
import { FIELD, LAYOUT } from './config.js';

export function hudButtonRects() {
  return {
    pause: { x: FIELD.width - 148, y: 10, w: 62, h: 38 },
    mute: { x: FIELD.width - 78, y: 10, w: 62, h: 38 },
  };
}

export function ticketRect(index) {
  const b = LAYOUT.board;
  const w = 392;
  const gap = 16;
  return { x: b.x + 14 + index * (w + gap), y: b.y + 14, w, h: b.h - 28 };
}

export function stoveRect() { return LAYOUT.stove; }
export function plateAreaRect() { return LAYOUT.plateArea; }
export function serveRect() { return LAYOUT.serve; }

export function wokRect() {
  const s = LAYOUT.stove;
  return { x: s.x + 55, y: s.y + 78, w: 220, h: 96 };
}

export function cookButtonRect() {
  const s = LAYOUT.stove;
  return { x: s.x + 55, y: s.y + 196, w: 220, h: 52 };
}

export function plateRect() {
  const p = LAYOUT.plateArea;
  return { x: p.x + 132, y: p.y + 62, w: 260, h: 170 };
}

export function plateSlotRect(index) {
  const pr = plateRect();
  const slot = 52;
  const gap = 10;
  const total = 4 * slot + 3 * gap;
  const x0 = pr.x + (pr.w - total) / 2;
  return { x: x0 + index * (slot + gap), y: pr.y + pr.h - 66, w: slot, h: slot };
}

export function serveButtonRect() {
  const s = LAYOUT.serve;
  return { x: s.x + 55, y: s.y + 196, w: 220, h: 52 };
}

export function bellRect() {
  const s = LAYOUT.serve;
  return { x: s.x + 125, y: s.y + 96, w: 80, h: 62 };
}

export function binRect(index) {
  const c = LAYOUT.counter;
  const w = 118;
  const gap = 8;
  const x0 = c.x + 16;
  return { x: x0 + index * (w + gap), y: c.y + 46, w, h: 150 };
}

export function trashRect() {
  const c = LAYOUT.counter;
  return { x: c.x + 16 + 8 * (118 + 8) + 8, y: c.y + 46, w: 118, h: 150 };
}

export function titleStartRect() {
  return { x: FIELD.width / 2 - 170, y: 472, w: 340, h: 56 };
}

export function overRestartRect() {
  return { x: FIELD.width / 2 - 170, y: 556, w: 340, h: 56 };
}

export function pointIn(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
