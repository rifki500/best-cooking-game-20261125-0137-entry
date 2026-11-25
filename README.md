[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rifki500/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rifki500/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — Warung Rush

A complete, original 2D cooking game that plays offline in a desktop browser
from its own static files. You run a small Indonesian warung kitchen:
customers queue up with timed orders, you assemble their dishes on the
plate, cook them on the wok, and serve before their patience runs out.

## How to play

1. **Rakit (assemble)** — click an ingredient on the counter (or press
   `1`–`8`) to add it to the plate. Click a plate slot to take an
   ingredient back off, `T` to throw the whole plate away.
2. **Masak (cook)** — press `C` or the MASAK button. The wok sizzles for a
   couple of seconds; a plate whose recipe matches a menu dish comes out as
   that dish, anything else comes out a mystery mix.
3. **Sajikan (serve)** — click the customer's order ticket (or `V`) to serve
   the ready plate to them. A correct dish on time earns points plus a time
   bonus and builds your combo (up to x5); a golden order pays double. A
   wrong dish or an expired order costs one of your three hearts.

A shift lasts 2.5 minutes. Every four dishes served raises the level:
orders arrive faster, patience shrinks, and harder dishes (Mie Goreng, Nasi
Telur Balado, Soto Kilat) join the menu. Three lost hearts — or the end of
the shift — ends the run.

## Menu

| Dish | Recipe | Points |
| --- | --- | --- |
| Nasi Ayam Geprek | Nasi + Ayam + Sambal | 100 |
| Omelet Sayur | Telur + Tomat + Sawi | 90 |
| Nasi Goreng Kilat | Nasi + Telur + Ayam + Kecap | 120 |
| Mie Ayam Geprek | Mie + Ayam + Sawi + Sambal | 130 |
| Mie Goreng Warung | Mie + Telur + Sawi + Kecap | 120 |
| Nasi Telur Balado | Nasi + Telur + Sambal + Tomat | 110 |
| Soto Kilat | Ayam + Telur + Sawi + Tomat | 140 |

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Open `game/index.html` directly in desktop Chrome, or serve it as above.
No network requests, no build step, no libraries: the kitchen, its food,
its customers and its sounds are all drawn and synthesised by the code in
`game/src/`. `?shot=start|play|serve|end&seed=1` stages a deterministic
screenshot scene; `?test=1` runs the autopilot self-test.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and game loop
- `game/src/world.js` — the kitchen rules (orders, plate, cooking, scoring)
- `game/src/render.js` — all canvas art: kitchen, customers, food, screens
- `game/src/input.js` — mouse and keyboard
- `game/src/config.js` — tuning, menu, ingredients, layout
- `game/src/geometry.js` — the clickable rectangles the renderer and input share
- `game/src/shots.js` — the autopilot that stages the screenshot scenes
- `game/src/audio.js` — synthesised WebAudio sounds
- `game/src/random.js` — seeded RNG

## Entry

Built for the make.fun competition `best-cooking-game-20261125-0137`
("Make the best cooking game"). `main.ts` (Node 22, standard library only)
copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `vendor/makefun-game.ts`.
