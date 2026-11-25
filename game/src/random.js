// A small seeded generator (mulberry32) so a screenshot seed always stages the
// same kitchen, and so normal play can be seeded from the clock.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one of `items` using `rand`, without mutating the list. */
export function pick(rand, items) {
  return items[Math.floor(rand() * items.length)];
}

/** An integer in [min, max] from `rand`. */
export function int(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}
