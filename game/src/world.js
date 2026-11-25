// Dapur Kilat — the kitchen rules. No DOM here: the world is plain data plus
// methods, stepped at a fixed rate, so screenshots can run it forward fast and
// the renderer only draws what the world holds.
import {
  COMBO_MAX, COOK_SECONDS, CUSTOMERS, DISHES, FIRST_ORDER_DELAY, GOLDEN_MULTIPLIER,
  INGREDIENTS, MAX_HEARTS, MAX_LEVEL, MAX_ORDERS, MYSTERY_POINTS, ORDER_TIME,
  SERVES_PER_LEVEL, SHIFT_SECONDS, SPAWN_TIME, STEP, TIME_BONUS_PER_SECOND,
} from './config.js';
import { int, mulberry32, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const MYSTERY_DISH = { id: 'mystery', name: 'Campuran Aneh', recipe: [], points: MYSTERY_POINTS };

let nextOrderId = 1;

export function dishForRecipe(items) {
  const sorted = [...items].sort();
  for (const dish of DISHES) {
    if (dish.recipe.length !== sorted.length) continue;
    if ([...dish.recipe].sort().every((ing, i) => ing === sorted[i])) return dish;
  }
  return null;
}

export function dishesForLevel(level) {
  return DISHES.filter((dish) => dish.minLevel <= level);
}

export function orderTimeForLevel(level) {
  return Math.max(ORDER_TIME.min, ORDER_TIME.base + ORDER_TIME.perLevel * (level - 1));
}

export function spawnIntervalForLevel(level) {
  return Math.max(SPAWN_TIME.min, SPAWN_TIME.base + SPAWN_TIME.perLevel * (level - 1));
}

export class World {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.rand = mulberry32(this.seed);
    this.reset();
  }

  reset() {
    this.rand = mulberry32(this.seed);
    this.screen = SCREEN_TITLE;
    this.time = 0;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.missed = 0;
    this.wrongServes = 0;
    this.hearts = MAX_HEARTS;
    this.level = 1;
    this.shiftLeft = SHIFT_SECONDS;
    this.orders = [];
    this.spawnTimer = FIRST_ORDER_DELAY;
    this.plate = { items: [], cooking: -1, cooked: null, ready: false, shake: 0 };
    this.particles = [];
    this.popups = [];
    this.floaters = [];
    this.serveAnim = null; // {dish, x, y, t}
    this.angryOrder = null;
    this.banner = null; // {text, sub, t, dur}
    this.best = 0;
    try {
      this.best = Number(window.localStorage.getItem('dapur-kilat.best') || 0) || 0;
    } catch {
      this.best = 0;
    }
    this.events = [];
  }

  start() {
    this.reset();
    this.screen = SCREEN_PLAY;
    this.showBanner('SHIFT DIMULAI!', 'Sajikan pesanan sebelum waktunya habis');
  }

  showBanner(text, sub = '') {
    this.banner = { text, sub, t: 0, dur: 2.2 };
  }

  addPopup(x, y, text, color = '#2b2118') {
    this.popups.push({ x, y, text, color, t: 0, dur: 1.2 });
  }

  spawnSteam(x, y, n = 1) {
    for (let i = 0; i < n; i += 1) {
      this.particles.push({
        kind: 'steam', x: x + (this.rand() - 0.5) * 60, y,
        vx: (this.rand() - 0.5) * 12, vy: -28 - this.rand() * 22,
        t: 0, dur: 0.9 + this.rand() * 0.6, size: 7 + this.rand() * 8,
      });
    }
  }

  spawnSparkle(x, y, color = '#f2b705', n = 14) {
    for (let i = 0; i < n; i += 1) {
      const a = this.rand() * Math.PI * 2;
      const sp = 60 + this.rand() * 120;
      this.particles.push({
        kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        t: 0, dur: 0.6 + this.rand() * 0.5, size: 3 + this.rand() * 4, color,
      });
    }
  }

  spawnOrder() {
    const menu = dishesForLevel(this.level);
    const dish = pick(this.rand, menu);
    const customer = pick(this.rand, CUSTOMERS);
    const timeMax = orderTimeForLevel(this.level) * (0.9 + this.rand() * 0.2);
    const golden = this.rand() < 0.12;
    this.orders.push({
      id: nextOrderId += 1,
      customer, dish, timeLeft: timeMax, timeMax,
      golden, flash: 0, servedT: 0, leaving: false,
    });
  }

  addIngredient(id) {
    if (this.screen !== SCREEN_PLAY) return false;
    if (this.plate.cooking >= 0) return false;
    if (this.plate.ready) return false;
    if (this.plate.items.length >= 4) return false;
    this.plate.items.push(id);
    this.events.push('add');
    return true;
  }

  removePlateIndex(index) {
    if (this.screen !== SCREEN_PLAY) return false;
    if (this.plate.cooking >= 0 || this.plate.ready) return false;
    if (index < 0 || index >= this.plate.items.length) return false;
    this.plate.items.splice(index, 1);
    this.events.push('remove');
    return true;
  }

  clearPlate() {
    if (this.screen !== SCREEN_PLAY) return false;
    if (this.plate.cooking >= 0) return false;
    if (this.plate.items.length === 0 && !this.plate.ready) return false;
    this.plate.items = [];
    this.plate.cooked = null;
    this.plate.ready = false;
    this.events.push('remove');
    return true;
  }

  cook() {
    if (this.screen !== SCREEN_PLAY) return false;
    if (this.plate.cooking >= 0 || this.plate.ready) return false;
    if (this.plate.items.length === 0) {
      this.plate.shake = 0.35;
      return false;
    }
    this.plate.cooking = 0;
    this.events.push('sizzle');
    return true;
  }

  /** Serve the ready plate to the order with this id. Returns 'ok' | 'wrong' | 'mystery' | null. */
  serve(orderId) {
    if (this.screen !== SCREEN_PLAY) return null;
    if (!this.plate.ready || !this.plate.cooked) return null;
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    const dish = this.plate.cooked;
    const isMystery = dish.id === MYSTERY_DISH.id;
    const matches = dish.id === order.dish.id;
    const result = matches ? 'ok' : (isMystery ? 'mystery' : 'wrong');
    if (result === 'ok') {
      const mult = Math.min(this.combo + 1, COMBO_MAX);
      const timeBonus = Math.round(order.timeLeft) * TIME_BONUS_PER_SECOND;
      let pts = dish.points * mult + timeBonus;
      if (order.golden) pts *= GOLDEN_MULTIPLIER;
      this.score += pts;
      this.coins += Math.round(pts / 10);
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.served += 1;
      const cx = 640;
      this.addPopup(cx, 300, `+${pts}`, order.golden ? '#b8860b' : '#2f9e44');
      if (order.golden) this.addPopup(cx, 330, 'PESANAN EMAS x2!', '#b8860b');
      this.spawnSparkle(1090, 330);
      this.serveAnim = { dish, t: 0, dur: 0.7 };
      this.orders = this.orders.filter((o) => o.id !== orderId);
      this.events.push('serve');
      const newLevel = Math.min(MAX_LEVEL, 1 + Math.floor(this.served / SERVES_PER_LEVEL));
      if (newLevel > this.level) {
        this.level = newLevel;
        this.showBanner(`LEVEL ${newLevel}!`, 'Pesanan datang lebih cepat — tetap tenang!');
        this.events.push('levelup');
      }
    } else if (result === 'mystery') {
      this.score += MYSTERY_POINTS;
      this.coins += 2;
      this.served += 1;
      this.combo = 0;
      this.addPopup(640, 300, `+${MYSTERY_POINTS} (asal jadi)`, '#8a6d3b');
      this.serveAnim = { dish, t: 0, dur: 0.7 };
      this.orders = this.orders.filter((o) => o.id !== orderId);
      this.events.push('serve');
    } else {
      this.hearts -= 1;
      this.combo = 0;
      this.wrongServes += 1;
      this.angryOrder = { id: order.id, t: 0, dur: 1.0 };
      this.addPopup(640, 300, 'SALAH HIDANGAN!', '#c1272d');
      this.events.push('wrong');
      if (this.hearts <= 0) this.endShift('Pelanggan kecewa — shift berakhir lebih cepat.');
    }
    this.plate.items = [];
    this.plate.cooked = null;
    this.plate.ready = false;
    this.plate.cooking = -1;
    return result;
  }

  /** Serve to the first order that matches the cooked dish, else the oldest order. */
  serveBest() {
    if (!this.plate.ready || !this.plate.cooked) return null;
    const match = this.orders.find((o) => o.dish.id === this.plate.cooked.id);
    const target = match || this.orders[0];
    return target ? this.serve(target.id) : null;
  }

  endShift(reason = '') {
    if (this.screen !== SCREEN_PLAY) return;
    this.screen = SCREEN_OVER;
    this.overReason = reason || 'Shift selesai! Dapur tutup untuk hari ini.';
    if (this.score > this.best) {
      this.best = this.score;
      try { window.localStorage.setItem('dapur-kilat.best', String(this.best)); } catch { /* ignore */ }
      this.newBest = true;
    } else {
      this.newBest = false;
    }
    this.events.push('gameover');
  }

  step(dt) {
    this.time += dt;
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t >= this.banner.dur) this.banner = null;
    }
    if (this.plate.shake > 0) this.plate.shake = Math.max(0, this.plate.shake - dt);
    if (this.serveAnim) {
      this.serveAnim.t += dt;
      if (this.serveAnim.t >= this.serveAnim.dur) this.serveAnim = null;
    }
    if (this.angryOrder) {
      this.angryOrder.t += dt;
      if (this.angryOrder.t >= this.angryOrder.dur) this.angryOrder = null;
    }
    for (const p of this.particles) p.t += dt;
    this.particles = this.particles.filter((p) => p.t < p.dur);
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter((p) => p.t < p.dur);

    if (this.screen !== SCREEN_PLAY) return;

    this.shiftLeft -= dt;
    if (this.shiftLeft <= 0) {
      this.shiftLeft = 0;
      this.endShift();
      return;
    }

    // Cooking on the wok.
    if (this.plate.cooking >= 0) {
      this.plate.cooking += dt / COOK_SECONDS;
      if (Math.floor(this.time * 10) !== Math.floor((this.time - dt) * 10)) {
        this.spawnSteam(189, 306, 1);
      }
      if (this.plate.cooking >= 1) {
        this.plate.cooking = -1;
        this.plate.cooked = dishForRecipe(this.plate.items) || MYSTERY_DISH;
        this.plate.ready = true;
        this.events.push('ding');
        this.spawnSparkle(640, 330, '#f2b705', 10);
      }
    }

    // Orders: patience ticks down, expiry costs a heart.
    for (const order of this.orders) {
      order.timeLeft -= dt;
      if (order.timeLeft < 8) order.flash = (order.flash + dt) % 0.5;
    }
    const expired = this.orders.filter((o) => o.timeLeft <= 0);
    if (expired.length > 0) {
      this.orders = this.orders.filter((o) => o.timeLeft > 0);
      for (const order of expired) {
        this.missed += 1;
        this.hearts -= 1;
        this.combo = 0;
        this.addPopup(640, 240, `${order.customer.name} pergi kecewa…`, '#c1272d');
        this.events.push('expire');
      }
      if (this.hearts <= 0) {
        this.endShift('Terlalu banyak pesanan hangus — shift berakhir lebih cepat.');
        return;
      }
    }

    // New orders arrive on a timer.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < MAX_ORDERS) {
      this.spawnOrder();
      const interval = spawnIntervalForLevel(this.level);
      this.spawnTimer = interval * (0.85 + this.rand() * 0.3);
    }
  }
}

export { INGREDIENTS, STEP };
