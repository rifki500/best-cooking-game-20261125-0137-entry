// Dapur Kilat — Warung Rush: every tuning number, colour and layout constant.
// The playfield is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** A shift (one run) lasts this many seconds of play. */
export const SHIFT_SECONDS = 150;

/** Hearts lost when an order expires or a wrong dish is served. */
export const MAX_HEARTS = 3;

/** How many order tickets the board shows at once. */
export const MAX_ORDERS = 3;

/** Seconds a plate spends on the wok before it is cooked. */
export const COOK_SECONDS = 2.4;

/** Level up after this many served dishes. */
export const SERVES_PER_LEVEL = 4;

/** Highest level: timers and spawn rates stop getting harder there. */
export const MAX_LEVEL = 8;

/** Order patience, in seconds, at level 1, shrinking per level. */
export const ORDER_TIME = { base: 52, perLevel: -3.2, min: 26 };

/** Seconds between new orders, shrinking per level. */
export const SPAWN_TIME = { base: 9, perLevel: -0.7, min: 4.5 };

/** First orders appear this soon after the shift starts. */
export const FIRST_ORDER_DELAY = 1.2;

/** Combo multiplier caps at this. */
export const COMBO_MAX = 5;

/** Points for a perfect serve: base dish points + this per second left. */
export const TIME_BONUS_PER_SECOND = 2;

/** Points for serving a dish nobody ordered ("Campuran Aneh"). */
export const MYSTERY_POINTS = 15;

/** A golden order is worth this multiple of its dish points. */
export const GOLDEN_MULTIPLIER = 2;

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** The eight ingredient bins on the counter, in counter order. */
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',   key: '1', color: '#f5efe0', dark: '#d9cba6', price: 5 },
  { id: 'mie',    name: 'Mie',    key: '2', color: '#f7c948', dark: '#d9a521', price: 5 },
  { id: 'ayam',   name: 'Ayam',   key: '3', color: '#e07840', dark: '#b65424', price: 8 },
  { id: 'telur',  name: 'Telur',  key: '4', color: '#fdf6e3', dark: '#e0c98f', price: 6 },
  { id: 'sawi',   name: 'Sawi',   key: '5', color: '#58b368', dark: '#2f7d3d', price: 4 },
  { id: 'tomat',  name: 'Tomat',  key: '6', color: '#e84a3f', dark: '#b52a22', price: 4 },
  { id: 'sambal', name: 'Sambal', key: '7', color: '#c1272d', dark: '#7d1420', price: 4 },
  { id: 'kecap',  name: 'Kecap',  key: '8', color: '#4a2c17', dark: '#2c1a0d', price: 3 },
];
export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

/**
 * The warung's menu. A dish is recognised by its exact ingredient set, in any
 * order. `minLevel` gates the harder dishes until the kitchen levels up.
 */
export const DISHES = [
  { id: 'nasi-geprek', name: 'Nasi Ayam Geprek', recipe: ['nasi', 'ayam', 'sambal'], points: 100, minLevel: 1 },
  { id: 'omelet',      name: 'Omelet Sayur',     recipe: ['telur', 'tomat', 'sawi'], points: 90,  minLevel: 1 },
  { id: 'nasi-goreng', name: 'Nasi Goreng Kilat', recipe: ['nasi', 'telur', 'ayam', 'kecap'], points: 120, minLevel: 1 },
  { id: 'mie-ayam',    name: 'Mie Ayam Geprek',  recipe: ['mie', 'ayam', 'sawi', 'sambal'], points: 130, minLevel: 1 },
  { id: 'mie-goreng',  name: 'Mie Goreng Warung', recipe: ['mie', 'telur', 'sawi', 'kecap'], points: 120, minLevel: 2 },
  { id: 'nasi-balado', name: 'Nasi Telur Balado', recipe: ['nasi', 'telur', 'sambal', 'tomat'], points: 110, minLevel: 2 },
  { id: 'soto-kilat',  name: 'Soto Kilat',       recipe: ['ayam', 'telur', 'sawi', 'tomat'], points: 140, minLevel: 3 },
];

/** The regulars who queue at the warung, each with their own look. */
export const CUSTOMERS = [
  { name: 'Mbak Sari',  skin: '#f2c89b', hair: '#3a2a1a', style: 'bun',    shirt: '#e4572e' },
  { name: 'Pak Budi',   skin: '#e8b07e', hair: '#222222', style: 'cap',    shirt: '#2e86ab' },
  { name: 'Dek Rani',   skin: '#f6d3a7', hair: '#5b2d1e', style: 'pigtails', shirt: '#f2a541' },
  { name: 'Mas Joko',   skin: '#d9a066', hair: '#141414', style: 'spiky',  shirt: '#58b368' },
  { name: 'Bu Tini',    skin: '#eec39a', hair: '#6b6b6b', style: 'scarf',  shirt: '#8e44ad' },
  { name: 'Kang Udin',  skin: '#c98d54', hair: '#1a1a1a', style: 'hat',    shirt: '#c1272d' },
];

export const PALETTE = {
  wallTop: '#f7d774',
  wallBottom: '#f2b544',
  tile: '#fff3d6',
  tileLine: '#e8c98a',
  floor: '#8a5a33',
  floorDark: '#744a28',
  wood: '#a06a35',
  woodDark: '#7d4f24',
  woodLight: '#c08a4e',
  counter: '#b57a3e',
  counterTop: '#e8b96f',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  plate: '#fdfdf8',
  plateRim: '#dfe6ee',
  ink: '#2b2118',
  inkSoft: '#5d4a33',
  cream: '#fff8e7',
  red: '#d63c2f',
  green: '#3d9b4f',
  gold: '#f2b705',
  blue: '#2e86ab',
  board: '#6b4423',
  boardPaper: '#fff6dd',
  danger: '#c1272d',
  ok: '#2f9e44',
};

/** Fixed layout rectangles, in logical pixels. */
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 24, y: 66, w: 1232, h: 132 },
  stove: { x: 24, y: 210, w: 330, h: 300 },
  plateArea: { x: 378, y: 210, w: 524, h: 300 },
  serve: { x: 926, y: 210, w: 330, h: 300 },
  counter: { x: 24, y: 524, w: 1232, h: 240 },
  hint: { x: 24, y: 772, w: 1232, h: 20 },
};

/** Where the best shift is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-kilat.best';
