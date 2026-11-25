// Dapur Kilat — every pixel the player sees, drawn with plain canvas shapes.
// No images, no fonts over the network: the whole kitchen is vector art.
import {
  CUSTOMERS, DISHES, FIELD, FONT, FONT_DISPLAY, INGREDIENTS, ING_BY_ID, LAYOUT,
  MAX_HEARTS, MAX_ORDERS, PALETTE, SHIFT_SECONDS,
} from './config.js';
import {
  bellRect, binRect, cookButtonRect, hudButtonRects, overRestartRect, plateAreaRect,
  plateRect, plateSlotRect, serveButtonRect, serveRect, stoveRect, ticketRect,
  titleStartRect, trashRect, wokRect,
} from './geometry.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, s, x, y, size, color, font = FONT_DISPLAY, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/** A little face for a customer, with their hair style and a mood. */
export function drawCustomerFace(ctx, customer, cx, cy, r, mood = 'happy', t = 0) {
  const bob = mood === 'happy' ? Math.sin(t * 2 + cx) * 1.5 : 0;
  circle(ctx, cx, cy + bob, r);
  ctx.fillStyle = customer.skin;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(43,33,24,0.35)';
  ctx.stroke();
  // Hair / headwear by style.
  ctx.fillStyle = customer.hair;
  if (customer.style === 'bun') {
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.55, r * 0.85, Math.PI, 0);
    ctx.fill();
    circle(ctx, cx, cy + bob - r * 1.25, r * 0.32);
    ctx.fill();
  } else if (customer.style === 'cap') {
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.45, r * 0.9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r, cy + bob - r * 0.55, r * 2, r * 0.28);
    ctx.fillStyle = '#f2b705';
    ctx.fillRect(cx - r * 0.3, cy + bob - r * 0.55, r * 0.6, r * 0.12);
  } else if (customer.style === 'pigtails') {
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.5, r * 0.8, Math.PI, 0);
    ctx.fill();
    circle(ctx, cx - r * 0.95, cy + bob - r * 0.1, r * 0.3);
    ctx.fill();
    circle(ctx, cx + r * 0.95, cy + bob - r * 0.1, r * 0.3);
    ctx.fill();
  } else if (customer.style === 'spiky') {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = Math.PI + (i / 4) * Math.PI;
      const px = cx + Math.cos(a) * r * 0.95;
      const py = cy + bob - r * 0.4 + Math.sin(a) * r * 0.5 - (i % 2 === 0 ? r * 0.35 : 0);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (customer.style === 'scarf') {
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.5, r * 0.92, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = customer.shirt;
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.15, r * 0.95, 0, Math.PI);
    ctx.fill();
  } else { // hat
    ctx.beginPath();
    ctx.arc(cx, cy + bob - r * 0.5, r * 0.8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8b96f';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob - r * 0.55, r * 1.05, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Eyes.
  const eyeY = cy + bob - r * 0.05;
  ctx.fillStyle = '#2b2118';
  if (mood === 'angry') {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, eyeY - r * 0.18);
    ctx.lineTo(cx - r * 0.1, eyeY - r * 0.02);
    ctx.lineTo(cx - r * 0.45, eyeY + r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.45, eyeY - r * 0.18);
    ctx.lineTo(cx + r * 0.1, eyeY - r * 0.02);
    ctx.lineTo(cx + r * 0.45, eyeY + r * 0.12);
    ctx.closePath();
    ctx.fill();
  } else {
    circle(ctx, cx - r * 0.28, eyeY, r * 0.09);
    ctx.fill();
    circle(ctx, cx + r * 0.28, eyeY, r * 0.09);
    ctx.fill();
  }
  // Mouth.
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (mood === 'angry') {
    ctx.arc(cx, cy + bob + r * 0.62, r * 0.28, Math.PI * 1.15, Math.PI * 1.85);
  } else if (mood === 'worried') {
    ctx.arc(cx, cy + bob + r * 0.55, r * 0.2, Math.PI * 1.1, Math.PI * 1.9);
  } else {
    ctx.arc(cx, cy + bob + r * 0.28, r * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();
  // Shirt hint at the bottom.
  ctx.fillStyle = customer.shirt;
  ctx.beginPath();
  ctx.arc(cx, cy + bob + r * 0.95, r * 0.55, Math.PI, 0);
  ctx.fill();
}

/** One ingredient's icon, drawn as a little dish of food. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  const ing = ING_BY_ID[id];
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'nasi') {
    circle(ctx, 0, 2, r * 0.95);
    ctx.fillStyle = '#fdfbf3';
    ctx.fill();
    ctx.strokeStyle = '#d9cba6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f5efe0';
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      circle(ctx, Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.4 - r * 0.1, r * 0.16);
      ctx.fill();
    }
    ctx.fillStyle = '#58b368';
    circle(ctx, -r * 0.3, -r * 0.35, r * 0.14);
    ctx.fill();
    circle(ctx, r * 0.25, -r * 0.3, r * 0.12);
    ctx.fill();
  } else if (id === 'mie') {
    circle(ctx, 0, 0, r * 0.95);
    ctx.fillStyle = '#f7c948';
    ctx.fill();
    ctx.strokeStyle = '#d9a521';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, (i - 1) * r * 0.42, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.fillStyle = '#e07840';
    circle(ctx, r * 0.3, -r * 0.35, r * 0.16);
    ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#e07840';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.72, r * 0.58, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c65a2e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, r * 0.22, r * 0.5, r * 0.36, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdf6e3';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.45, -r * 0.35);
    ctx.lineTo(r * 0.85, -r * 0.8);
    ctx.stroke();
    circle(ctx, r * 0.85, -r * 0.8, r * 0.14);
    ctx.fillStyle = '#fdf6e3';
    ctx.fill();
    circle(ctx, r * 0.72, -r * 0.62, r * 0.12);
    ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0c98f';
    ctx.lineWidth = 2;
    ctx.stroke();
    circle(ctx, 0, 0, r * 0.42);
    ctx.fillStyle = '#f2a541';
    ctx.fill();
    circle(ctx, -r * 0.12, -r * 0.12, r * 0.14);
    ctx.fillStyle = '#ffd97a';
    ctx.fill();
  } else if (id === 'sawi') {
    ctx.fillStyle = '#58b368';
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate((i - 1) * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.34, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.7);
    ctx.lineTo(0, -r * 0.5);
    ctx.stroke();
  } else if (id === 'tomat') {
    circle(ctx, 0, r * 0.08, r * 0.82);
    ctx.fillStyle = '#e84a3f';
    ctx.fill();
    ctx.fillStyle = '#ff7a6e';
    circle(ctx, -r * 0.3, -r * 0.25, r * 0.28);
    ctx.fill();
    ctx.fillStyle = '#3d9b4f';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(-r * 0.3, -r * 0.95);
    ctx.lineTo(r * 0.05, -r * 0.8);
    ctx.lineTo(r * 0.32, -r * 0.95);
    ctx.lineTo(r * 0.05, -r * 0.68);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#fff6dd';
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c1272d';
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.62, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#e84a3f';
    circle(ctx, -r * 0.25, -r * 0.2, r * 0.18);
    ctx.fill();
    circle(ctx, r * 0.2, -r * 0.3, r * 0.14);
    ctx.fill();
    ctx.fillStyle = '#7d1420';
    circle(ctx, r * 0.05, -r * 0.1, r * 0.1);
    ctx.fill();
  } else if (id === 'kecap') {
    rr(ctx, -r * 0.34, -r * 0.55, r * 0.68, r * 1.3, r * 0.2);
    ctx.fillStyle = '#4a2c17';
    ctx.fill();
    rr(ctx, -r * 0.2, -r * 0.95, r * 0.4, r * 0.5, r * 0.12);
    ctx.fillStyle = '#2c1a0d';
    ctx.fill();
    rr(ctx, -r * 0.34, -r * 0.1, r * 0.68, r * 0.5, r * 0.08);
    ctx.fillStyle = '#f2b705';
    ctx.fill();
    text(ctx, 'KECAP', 0, r * 0.16, r * 0.34, '#2b2118', FONT, 'center', '800');
  }
  ctx.restore();
  return ing;
}

function drawBackground(ctx, t) {
  // Warm wall with tiles.
  const wall = ctx.createLinearGradient(0, 0, 0, 520);
  wall.addColorStop(0, PALETTE.wallTop);
  wall.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, FIELD.width, 524);
  // Tile band.
  ctx.fillStyle = PALETTE.tile;
  ctx.fillRect(0, 196, FIELD.width, 24);
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 1;
  for (let x = 0; x < FIELD.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 196);
    ctx.lineTo(x, 220);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 208);
  ctx.lineTo(FIELD.width, 208);
  ctx.stroke();
  // Window with a sunny street.
  rr(ctx, 470, 78, 340, 108, 10);
  ctx.fillStyle = '#bfe3f2';
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#ffd94d';
  circle(ctx, 540, 112, 16);
  ctx.fill();
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.moveTo(470, 186);
  ctx.lineTo(560, 140);
  ctx.lineTo(660, 186);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(620, 186);
  ctx.lineTo(730, 150);
  ctx.lineTo(810, 186);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(640, 78);
  ctx.lineTo(640, 186);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(470, 132);
  ctx.lineTo(810, 132);
  ctx.stroke();
  // Hanging pans on the left.
  ctx.strokeStyle = '#5d4a33';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, 78);
  ctx.lineTo(90, 108);
  ctx.moveTo(170, 78);
  ctx.lineTo(170, 108);
  ctx.stroke();
  circle(ctx, 90, 138, 30);
  ctx.fillStyle = '#3a3f4a';
  ctx.fill();
  circle(ctx, 90, 138, 20);
  ctx.fillStyle = '#565d6b';
  ctx.fill();
  circle(ctx, 170, 138, 30);
  ctx.fillStyle = '#8a5a33';
  ctx.fill();
  circle(ctx, 170, 138, 20);
  ctx.fillStyle = '#a06a35';
  ctx.fill();
  // Shelf with jars on the right.
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(1020, 108, 220, 10);
  const jarColors = ['#e84a3f', '#58b368', '#f2b705'];
  for (let i = 0; i < 3; i += 1) {
    const jx = 1046 + i * 62;
    rr(ctx, jx, 66, 40, 42, 6);
    ctx.fillStyle = jarColors[i];
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(jx + 6, 72, 8, 30);
  }
  // Menu chalkboard on the wall.
  rr(ctx, 880, 66, 120, 92, 8);
  ctx.fillStyle = '#2e4a3a';
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'MENU', 940, 84, 13, '#fff6dd', FONT, 'center', '800');
  text(ctx, 'Nasi Goreng', 940, 106, 11, '#ffe9a8', FONT, 'center');
  text(ctx, 'Mie Ayam', 940, 122, 11, '#ffe9a8', FONT, 'center');
  text(ctx, 'Soto Kilat', 940, 138, 11, '#ffe9a8', FONT, 'center');
  // Wooden floor.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 524, FIELD.width, 276);
  ctx.fillStyle = PALETTE.floorDark;
  for (let y = 560; y < 800; y += 46) ctx.fillRect(0, y, FIELD.width, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 120; x < FIELD.width; x += 240) ctx.fillRect(x, 524, 3, 276);
  void t;
}

function drawHud(ctx, world) {
  const h = LAYOUT.hud;
  const grad = ctx.createLinearGradient(0, 0, 0, h.h);
  grad.addColorStop(0, '#3a2a1a');
  grad.addColorStop(1, '#2b2118');
  ctx.fillStyle = grad;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  // Logo.
  drawIngredientIcon(ctx, 'ayam', 44, 29, 15);
  text(ctx, 'DAPUR KILAT', 68, 24, 26, '#ffd94d', FONT_DISPLAY, 'left', '900');
  text(ctx, 'WARUNG RUSH', 68, 45, 11, '#f2b705', FONT, 'left', '700');
  // Score.
  text(ctx, 'SKOR', 300, 20, 11, '#c9a06a', FONT, 'left', '800');
  text(ctx, String(world.score), 300, 42, 24, '#fff8e7', FONT_DISPLAY, 'left', '900');
  text(ctx, `TERBAIK ${world.best}`, 420, 42, 13, '#c9a06a', FONT, 'left');
  // Combo.
  const combo = world.combo;
  text(ctx, 'KOMBO', 560, 20, 11, '#c9a06a', FONT, 'left', '800');
  if (combo >= 2) {
    text(ctx, `x${Math.min(combo, 5)}`, 560, 42, 24, '#ff8c42', FONT_DISPLAY, 'left', '900');
    // A small flame drawn as a teardrop, no emoji font needed.
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(606, 30);
    ctx.quadraticCurveTo(620, 44, 606, 52);
    ctx.quadraticCurveTo(592, 44, 606, 30);
    ctx.fill();
  } else {
    text(ctx, '—', 560, 42, 24, '#8a7a63', FONT_DISPLAY, 'left', '900');
  }
  // Level + served.
  text(ctx, `LEVEL ${world.level}`, 700, 20, 11, '#c9a06a', FONT, 'left', '800');
  text(ctx, `${world.served} HIDANGAN`, 700, 42, 16, '#fff8e7', FONT_DISPLAY, 'left', '800');
  // Shift timer.
  const left = Math.max(0, world.shiftLeft);
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  const low = left <= 20 && world.screen === SCREEN_PLAY;
  text(ctx, 'SHIFT', 900, 20, 11, '#c9a06a', FONT, 'left', '800');
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 900, 42, 24, low ? '#ff6b5e' : '#fff8e7', FONT_DISPLAY, 'left', '900');
  // Hearts.
  for (let i = 0; i < MAX_HEARTS; i += 1) {
    const hx = 1030 + i * 34;
    ctx.fillStyle = i < world.hearts ? '#e84a3f' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(hx, 38);
    ctx.bezierCurveTo(hx - 13, 24, hx - 26, 34, hx, 50);
    ctx.bezierCurveTo(hx + 26, 34, hx + 13, 24, hx, 38);
    ctx.fill();
  }
  // Pause / mute buttons.
  const btns = hudButtonRects();
  for (const [key, r] of Object.entries(btns)) {
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fillStyle = '#4a3826';
    ctx.fill();
    ctx.strokeStyle = '#6b543a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const label = key === 'pause' ? (world.paused ? '▶' : 'II') : (world.sfxMuted ? '✕' : '♪');
    text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, 18, '#ffd94d', FONT, 'center', '800');
  }
}

function drawTicket(ctx, order, rect, t) {
  const urgent = order.timeLeft < 8;
  const frac = clamp(order.timeLeft / order.timeMax, 0, 1);
  ctx.save();
  if (urgent) {
    const dx = Math.sin(t * 14) * 2;
    ctx.translate(dx, 0);
  }
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = order.golden ? '#fff3c4' : PALETTE.boardPaper;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = order.golden ? '#b8860b' : '#d9cba6';
  ctx.stroke();
  if (order.golden) {
    rr(ctx, rect.x + rect.w - 108, rect.y + 6, 100, 20, 10);
    ctx.fillStyle = '#f2b705';
    ctx.fill();
    text(ctx, '★ EMAS x2', rect.x + rect.w - 58, rect.y + 17, 12, '#5d3a00', FONT, 'center', '800');
  }
  const mood = urgent ? 'worried' : 'happy';
  drawCustomerFace(ctx, order.customer, rect.x + 42, rect.y + 40, 30, mood, t);
  text(ctx, order.customer.name, rect.x + 82, rect.y + 20, 14, PALETTE.inkSoft, FONT, 'left', '700');
  text(ctx, order.dish.name, rect.x + 82, rect.y + 42, 19, PALETTE.ink, FONT_DISPLAY, 'left', '800');
  // Recipe icons.
  order.dish.recipe.forEach((ingId, i) => {
    drawIngredientIcon(ctx, ingId, rect.x + 96 + i * 34, rect.y + 74, 13);
  });
  text(ctx, `${order.dish.points} poin`, rect.x + 82 + order.dish.recipe.length * 34 + 8, rect.y + 74, 12, PALETTE.inkSoft, FONT, 'left', '700');
  // Timer bar.
  const bar = { x: rect.x + 82, y: rect.y + 88, w: rect.w - 96, h: 10 };
  rr(ctx, bar.x, bar.y, bar.w, bar.h, 5);
  ctx.fillStyle = '#e5d9bd';
  ctx.fill();
  rr(ctx, bar.x, bar.y, Math.max(10, bar.w * frac), bar.h, 5);
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : (frac > 0.25 ? '#f2a541' : PALETTE.danger);
  ctx.fill();
  text(ctx, `${Math.ceil(order.timeLeft)} dtk`, rect.x + rect.w - 14, rect.y + 74, 13, urgent ? PALETTE.danger : PALETTE.inkSoft, FONT, 'right', '800');
  ctx.restore();
}

function drawBoard(ctx, world, t) {
  const b = LAYOUT.board;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = PALETTE.board;
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < MAX_ORDERS; i += 1) {
    const rect = ticketRect(i);
    const order = world.orders[i];
    if (order) {
      drawTicket(ctx, order, rect, t);
    } else {
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fillStyle = 'rgba(255,246,221,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,246,221,0.35)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pelanggan…', rect.x + rect.w / 2, rect.y + rect.h / 2, 15, 'rgba(255,246,221,0.6)', FONT, 'center');
    }
  }
}

function drawStove(ctx, world, t) {
  const s = stoveRect();
  rr(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fillStyle = '#eceff3';
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'KOMPOR', s.x + s.w / 2, s.y + 24, 15, PALETTE.inkSoft, FONT, 'center', '800');
  // Burners.
  for (const bx of [s.x + 82, s.x + 248]) {
    circle(ctx, bx, s.y + 128, 52);
    ctx.fillStyle = '#3a3f4a';
    ctx.fill();
    circle(ctx, bx, s.y + 128, 38);
    ctx.fillStyle = '#565d6b';
    ctx.fill();
  }
  // The wok sits on the left burner with the plate's food while cooking.
  const wok = wokRect();
  const cooking = world.plate.cooking >= 0;
  const flame = cooking ? 0.75 + Math.sin(t * 9) * 0.25 : 0;
  if (cooking) {
    ctx.fillStyle = `rgba(255, ${Math.floor(120 + flame * 80)}, 40, ${0.55 + flame * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(wok.x + wok.w / 2, wok.y + wok.h - 6, 66, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wok bowl.
  ctx.beginPath();
  ctx.ellipse(wok.x + wok.w / 2, wok.y + wok.h / 2 + 8, 104, 46, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#2f333c';
  ctx.fill();
  ctx.strokeStyle = '#565d6b';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (world.plate.cooking >= 0) {
    // Food piled in the wok while it cooks; once cooked it is on the plate.
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.ellipse(wok.x + wok.w / 2, wok.y + wok.h / 2 + 2, 78, 26, 0, Math.PI, 0);
    ctx.fill();
    world.plate.items.slice(0, 4).forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, wok.x + 52 + i * 38, wok.y + wok.h / 2 - 6, 14);
    });
  }
  // Cooking progress ring.
  if (cooking) {
    const cx = wok.x + wok.w / 2;
    const cy = wok.y - 6;
    circle(ctx, cx, cy, 24);
    ctx.fillStyle = 'rgba(43,33,24,0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(world.plate.cooking, 0, 1));
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 6;
    ctx.stroke();
    text(ctx, `${Math.ceil((1 - world.plate.cooking) * 2.4)}`, cx, cy + 1, 16, '#fff8e7', FONT, 'center', '900');
  }
  // MASAK button.
  const btn = cookButtonRect();
  const canCook = world.plate.items.length > 0 && world.plate.cooking < 0 && !world.plate.ready;
  const shakeX = world.plate.shake > 0 ? Math.sin(t * 40) * 4 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fillStyle = canCook ? '#e4572e' : '#9aa1ad';
  ctx.fill();
  ctx.strokeStyle = canCook ? '#b23a1d' : '#7d838d';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, cooking ? 'SEDANG MASAK…' : 'MASAK', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 20, '#fff8e7', FONT_DISPLAY, 'center', '900');
  ctx.restore();
  text(ctx, 'Rakit di piring, lalu masak di sini', s.x + s.w / 2, s.y + 272, 12, PALETTE.inkSoft, FONT, 'center');
}

function drawPlateArea(ctx, world, t) {
  const p = plateAreaRect();
  rr(ctx, p.x, p.y, p.w, p.h, 14);
  const wood = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
  wood.addColorStop(0, PALETTE.woodLight);
  wood.addColorStop(1, PALETTE.wood);
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'PIRING RACIKAN', p.x + p.w / 2, p.y + 24, 15, '#fff3d6', FONT, 'center', '800');
  // The big plate.
  const pr = plateRect();
  const cx = pr.x + pr.w / 2;
  const cy = pr.y + pr.h / 2 - 8;
  ctx.save();
  if (world.plate.ready) {
    ctx.shadowColor = 'rgba(242,183,5,0.9)';
    ctx.shadowBlur = 26 + Math.sin(t * 4) * 8;
  }
  circle(ctx, cx, cy, 92);
  ctx.fillStyle = PALETTE.plate;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  circle(ctx, cx, cy, 92);
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 4;
  ctx.stroke();
  circle(ctx, cx, cy, 68);
  ctx.strokeStyle = '#eef1f5';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.plate.items.length === 0 && !world.plate.ready) {
    text(ctx, 'Klik bahan di bawah', cx, cy - 8, 15, '#9aa1ad', FONT, 'center', '700');
    text(ctx, 'untuk merakit hidangan', cx, cy + 14, 15, '#9aa1ad', FONT, 'center', '700');
  } else if (world.plate.ready && world.plate.cooked) {
    // The finished dish, drawn as a neat mound with its ingredients.
    const dish = world.plate.cooked;
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 62, 34, 0, Math.PI, 0);
    ctx.fill();
    dish.recipe.slice(0, 4).forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, cx - 42 + i * 28, cy - 6, 17);
    });
    if (dish.id === 'mystery') {
      text(ctx, '?', cx, cy - 34, 26, '#8a6d3b', FONT_DISPLAY, 'center', '900');
    }
    // Steam.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const sx = cx - 30 + i * 30;
      const sy = cy - 30 - Math.sin(t * 3 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 6, sy - 10, sx - 2, sy - 20);
      ctx.stroke();
    }
  } else {
    // Mid-assembly: ingredients laid out on the plate.
    world.plate.items.forEach((ingId, i) => {
      const angle = -Math.PI / 2 + (i - (world.plate.items.length - 1) / 2) * 0.7;
      drawIngredientIcon(ctx, ingId, cx + Math.cos(angle) * 34, cy + Math.sin(angle) * 22, 22);
    });
    if (world.plate.cooking >= 0) {
      text(ctx, 'Memasak…', cx, cy - 52, 14, PALETTE.inkSoft, FONT, 'center', '800');
    }
  }
  // Ingredient slots under the plate.
  for (let i = 0; i < 4; i += 1) {
    const slot = plateSlotRect(i);
    const ingId = world.plate.items[i];
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fillStyle = ingId ? '#fff6dd' : 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.strokeStyle = ingId ? '#d9a521' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (ingId) drawIngredientIcon(ctx, ingId, slot.x + slot.w / 2, slot.y + slot.h / 2, 17);
    else text(ctx, '+', slot.x + slot.w / 2, slot.y + slot.h / 2, 20, 'rgba(255,255,255,0.75)', FONT, 'center', '800');
  }
  if (world.plate.ready) {
    // SIAP banner on the panel's bottom strip, clear of the slots.
    rr(ctx, cx - 92, p.y + p.h - 42, 184, 30, 15);
    ctx.fillStyle = '#2f9e44';
    ctx.fill();
    text(ctx, 'SIAP DISAJIKAN!', cx, p.y + p.h - 26, 15, '#ffffff', FONT, 'center', '900');
  } else {
    text(ctx, 'Klik bahan di slot untuk melepasnya', p.x + p.w / 2, p.y + p.h - 16, 12, '#ffe9c4', FONT, 'center');
  }
}

function drawServe(ctx, world, t) {
  const s = serveRect();
  rr(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fillStyle = '#f3e2c2';
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'JENDELA SAJI', s.x + s.w / 2, s.y + 24, 15, PALETTE.inkSoft, FONT, 'center', '800');
  // The pass window.
  rr(ctx, s.x + 30, s.y + 44, s.w - 60, 92, 10);
  ctx.fillStyle = '#2b2118';
  ctx.fill();
  // Customers peeking through the window.
  const peekCount = Math.min(3, world.orders.length);
  for (let i = 0; i < peekCount; i += 1) {
    const order = world.orders[i];
    const px = s.x + 80 + i * 85;
    const py = s.y + 118;
    const mood = order.timeLeft < 8 ? 'worried' : 'happy';
    drawCustomerFace(ctx, order.customer, px, py, 30, mood, t + i);
  }
  if (peekCount === 0) {
    text(ctx, 'Belum ada pelanggan', s.x + s.w / 2, s.y + 92, 14, 'rgba(255,246,221,0.7)', FONT, 'center');
  }
  // The service bell.
  const bell = bellRect();
  const canServe = world.plate.ready;
  const ring = canServe ? Math.sin(t * 8) * 3 : 0;
  ctx.save();
  ctx.translate(ring, 0);
  rr(ctx, bell.x, bell.y + 26, bell.w, 12, 6);
  ctx.fillStyle = '#8a6d3b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bell.x + bell.w / 2, bell.y + 26, 30, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = canServe ? '#f2b705' : '#c9a86a';
  ctx.fill();
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 2;
  ctx.stroke();
  circle(ctx, bell.x + bell.w / 2, bell.y + 10, 6);
  ctx.fillStyle = '#8a6d3b';
  ctx.fill();
  ctx.restore();
  // Serve animation: the dish slides toward the window.
  if (world.serveAnim) {
    const a = world.serveAnim;
    const k = a.t / a.dur;
    const sx = 640 + (1090 - 640) * k;
    const sy = 330 - 120 * Math.sin(k * Math.PI);
    ctx.globalAlpha = 1 - k * 0.4;
    circle(ctx, sx, sy, 40);
    ctx.fillStyle = PALETTE.plate;
    ctx.fill();
    ctx.globalAlpha = 1;
    a.dish.recipe.slice(0, 4).forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, sx - 24 + i * 16, sy - 4, 12);
    });
  }
  // SAJIKAN button.
  const btn = serveButtonRect();
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fillStyle = canServe ? '#2f9e44' : '#9aa1ad';
  ctx.fill();
  ctx.strokeStyle = canServe ? '#227733' : '#7d838d';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SAJIKAN  (V)', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 20, '#fff8e7', FONT_DISPLAY, 'center', '900');
  text(ctx, canServe ? 'Klik pesanan di papan untuk menyajikan' : 'Masak dulu hidangan di piring', s.x + s.w / 2, s.y + 272, 12, PALETTE.inkSoft, FONT, 'center');
}

function drawCounter(ctx, world, t) {
  const c = LAYOUT.counter;
  rr(ctx, c.x, c.y, c.w, c.h, 14);
  ctx.fillStyle = PALETTE.counter;
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Counter top highlight.
  rr(ctx, c.x + 6, c.y + 6, c.w - 12, 26, 10);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fill();
  text(ctx, 'MEJA BAHAN  —  klik bahan (atau tekan 1–8) untuk menambahkannya ke piring', c.x + 20, c.y + 20, 14, '#5d3a00', FONT, 'left', '800');
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, '#fff8e7');
    grad.addColorStop(1, '#f3e2c2');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 52, 30);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 102, 16, PALETTE.ink, FONT_DISPLAY, 'center', '800');
    // Hotkey badge.
    circle(ctx, r.x + 18, r.y + 18, 12);
    ctx.fillStyle = '#2b2118';
    ctx.fill();
    text(ctx, ing.key, r.x + 18, r.y + 19, 13, '#ffd94d', FONT, 'center', '900');
    // Count of this ingredient already on the plate.
    const onPlate = world.plate.items.filter((id) => id === ing.id).length;
    if (onPlate > 0) {
      circle(ctx, r.x + r.w - 18, r.y + 18, 13);
      ctx.fillStyle = '#2f9e44';
      ctx.fill();
      text(ctx, String(onPlate), r.x + r.w - 18, r.y + 19, 13, '#ffffff', FONT, 'center', '900');
    }
    text(ctx, `Rp${ing.price}k`, r.x + r.w / 2, r.y + 126, 11, PALETTE.inkSoft, FONT, 'center');
  });
  // Trash can.
  const tr = trashRect();
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 12);
  ctx.fillStyle = '#eceff3';
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#6b7280';
  rr(ctx, tr.x + 34, tr.y + 52, 50, 62, 6);
  ctx.fill();
  rr(ctx, tr.x + 28, tr.y + 42, 62, 12, 6);
  ctx.fill();
  ctx.strokeStyle = '#eceff3';
  ctx.lineWidth = 3;
  for (const lx of [48, 59, 70]) {
    ctx.beginPath();
    ctx.moveTo(tr.x + lx, tr.y + 62);
    ctx.lineTo(tr.x + lx, tr.y + 104);
    ctx.stroke();
  }
  text(ctx, 'BUANG (T)', tr.x + tr.w / 2, tr.y + 132, 13, PALETTE.ink, FONT, 'center', '800');
  void t;
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    const k = p.t / p.dur;
    const x = p.x + p.vx * p.t;
    const y = p.y + p.vy * p.t + (p.kind === 'spark' ? 120 * p.t * p.t : 0);
    if (p.kind === 'steam') {
      ctx.globalAlpha = 0.55 * (1 - k);
      circle(ctx, x, y, p.size * (0.6 + k * 0.8));
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.t * 6);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx, world) {
  for (const p of world.popups) {
    const k = p.t / p.dur;
    const y = p.y - k * 46;
    ctx.globalAlpha = 1 - k * k;
    ctx.font = `900 30px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,248,231,0.9)';
    ctx.strokeText(p.text, p.x, y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, y);
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, world) {
  if (!world.banner) return;
  const b = world.banner;
  const k = b.t / b.dur;
  const alpha = k < 0.12 ? k / 0.12 : (k > 0.8 ? (1 - k) / 0.2 : 1);
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  const w = 520;
  const x = FIELD.width / 2 - w / 2;
  const y = 250;
  rr(ctx, x, y, w, 92, 16);
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, b.text, FIELD.width / 2, y + 34, 34, '#ffd94d', FONT_DISPLAY, 'center', '900');
  if (b.sub) text(ctx, b.sub, FIELD.width / 2, y + 68, 15, '#fff8e7', FONT, 'center');
  ctx.restore();
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(30,20,10,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const cx = FIELD.width / 2;
  // Title card.
  rr(ctx, cx - 420, 96, 840, 452, 20);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'DAPUR KILAT', cx, 158, 64, '#d63c2f', FONT_DISPLAY, 'center', '900');
  text(ctx, '— WARUNG RUSH —', cx, 208, 22, '#8a6d3b', FONT, 'center', '800');
  text(ctx, 'Pelanggan datang dengan pesanan. Rakit hidangannya di piring,', cx, 258, 18, PALETTE.ink, FONT, 'center');
  text(ctx, 'masak di kompor, lalu sajikan sebelum waktunya habis!', cx, 284, 18, PALETTE.ink, FONT, 'center');
  // How to play, three steps.
  const steps = [
    ['1', 'KLIK BAHAN', 'atau tekan 1–8'],
    ['2', 'MASAK', 'tombol kompor / C'],
    ['3', 'SAJIKAN', 'klik pesanan / V'],
  ];
  steps.forEach(([num, head, sub], i) => {
    const sx = cx - 300 + i * 200;
    circle(ctx, sx + 100, 336, 26);
    ctx.fillStyle = '#e4572e';
    ctx.fill();
    text(ctx, num, sx + 100, 337, 22, '#fff8e7', FONT_DISPLAY, 'center', '900');
    text(ctx, head, sx + 100, 376, 16, PALETTE.ink, FONT_DISPLAY, 'center', '900');
    text(ctx, sub, sx + 100, 398, 13, PALETTE.inkSoft, FONT, 'center');
  });
  text(ctx, '3 hati hangus kalau pesanan telat atau salah saji. Shift 2,5 menit —', cx, 436, 14, PALETTE.inkSoft, FONT, 'center');
  text(ctx, 'seberapa banyak hidangan bisa kamu sajikan?', cx, 456, 14, PALETTE.inkSoft, FONT, 'center');
  // Start button, inside the card.
  const btn = titleStartRect();
  const pulse = 1 + Math.sin(world.time * 4) * 0.03;
  ctx.save();
  ctx.translate(cx, btn.y + btn.h / 2);
  ctx.scale(pulse, pulse);
  ctx.translate(-cx, -(btn.y + btn.h / 2));
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fillStyle = '#2f9e44';
  ctx.fill();
  ctx.strokeStyle = '#227733';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'MULAI MASAK  (Enter)', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 22, '#ffffff', FONT_DISPLAY, 'center', '900');
  ctx.restore();
  if (world.best > 0) text(ctx, `Skor terbaik: ${world.best}`, cx, 652, 15, '#ffd94d', FONT, 'center', '800');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(30,20,10,0.66)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const cx = FIELD.width / 2;
  rr(ctx, cx - 400, 110, 800, 520, 20);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', cx, 168, 52, '#d63c2f', FONT_DISPLAY, 'center', '900');
  text(ctx, world.overReason || '', cx, 210, 16, PALETTE.inkSoft, FONT, 'center');
  text(ctx, 'SKOR AKHIR', cx, 258, 14, '#8a6d3b', FONT, 'center', '800');
  text(ctx, String(world.score), cx, 308, 64, PALETTE.ink, FONT_DISPLAY, 'center', '900');
  if (world.newBest) {
    rr(ctx, cx - 130, 344, 260, 32, 16);
    ctx.fillStyle = '#f2b705';
    ctx.fill();
    text(ctx, '★ REKOR BARU! ★', cx, 361, 16, '#5d3a00', FONT, 'center', '900');
  }
  const stats = [
    ['Hidangan disajikan', String(world.served)],
    ['Pesanan hangus', String(world.missed)],
    ['Sajian salah', String(world.wrongServes)],
    ['Kombo terbaik', `x${Math.min(world.bestCombo, 5)}`],
    ['Level tercapai', String(world.level)],
    ['Koin didapat', `${world.coins} koin`],
  ];
  stats.forEach(([label, value], i) => {
    const y = 402 + i * 28;
    text(ctx, label, cx - 180, y, 16, PALETTE.inkSoft, FONT, 'left');
    text(ctx, value, cx + 180, y, 16, PALETTE.ink, FONT_DISPLAY, 'right', '800');
  });
  const btn = overRestartRect();
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fillStyle = '#2f9e44';
  ctx.fill();
  text(ctx, 'MAIN LAGI  (Enter)', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 22, '#ffffff', FONT_DISPLAY, 'center', '900');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30,20,10,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'JEDA  —  tekan P untuk lanjut', FIELD.width / 2, FIELD.height / 2, 34, '#fff8e7', FONT_DISPLAY, 'center', '900');
}

/** Draw the whole game. `world` holds the state; `t` is the render clock. */
export function draw(ctx, world, t) {
  drawBackground(ctx, t);
  drawBoard(ctx, world, t);
  drawStove(ctx, world, t);
  drawPlateArea(ctx, world, t);
  drawServe(ctx, world, t);
  drawCounter(ctx, world, t);
  drawParticles(ctx, world);
  drawPopups(ctx, world);
  drawHud(ctx, world);
  // Hint bar.
  text(ctx, '1–8 bahan   •   C masak   •   V sajikan   •   T buang piring   •   P jeda   •   M suara', FIELD.width / 2, 784, 13, '#e8d9b8', FONT, 'center');
  drawBanner(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  else if (world.paused) drawPaused(ctx);
}

export { CUSTOMERS, DISHES };
