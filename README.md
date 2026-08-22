# Battleship

Browser-based Battleship against an AI opponent. No backend, no accounts — the whole game runs in
the browser.

**Play:** https://amylyn95-jpg.github.io/Battleship-V1/

## How to play

1. Place the five ships on your grid (click to drop, `R` or **Rotate** to change orientation,
   **Random fleet** to skip placement).
2. Pick the enemy AI's difficulty, then **Start battle**.
3. Click cells in *Enemy waters* to fire. Orange = hit, dark red = sunk, dimple = miss.
4. First fleet fully sunk loses. Turns always alternate — a hit does not grant an extra shot.

## The AI

| Difficulty | Behaviour |
| --- | --- |
| Easy | Uniformly random shots at untried cells. |
| Normal | Hunt/target: random search, then works the cells adjacent to a hit until the ship sinks. |
| Hard | Same, plus (a) searching only cells where `(row + col)` is even — every ship is at least 2 long, so it must cover one, halving the search space — and (b) once two hits line up, firing only at the two ends of that axis. |

`src/game/ai.test.ts` asserts Hard clears a fleet in fewer shots than Easy across a set of seeds.

## Project layout

```
src/game/types.ts    board size, fleet, shared types
src/game/board.ts    placement, validation, firing, sink detection   (pure)
src/game/ai.ts       hunt/target AI state machine                    (pure)
src/game/engine.ts   turn/phase/win-condition state machine          (pure)
src/components/      Grid, FleetStatus
src/App.tsx          placement UI, board layout, AI turn timing
```

Game rules are pure functions taking an injectable `random`, so a whole game can be played
headlessly and deterministically in tests — see `src/game/ai.test.ts`.

## Development

Requires Node `22.12.0` (see `.nvmrc`; Vite 8's Rolldown binary is not published for Node < 20.19).

```bash
nvm use
npm ci
npm run dev        # http://localhost:5173
npm test           # vitest
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run build      # production bundle into dist/
```

## Deployment

`.github/workflows/deploy.yml` lints, typechecks, tests and builds on every push and pull request,
and publishes `dist/` to GitHub Pages on `main`. The Pages build sets `GITHUB_PAGES=true` so Vite
emits asset URLs under the `/Battleship-V1/` subpath.

## Debugging notes

[`DEBUGGING.md`](./DEBUGGING.md) documents the bugs found while building this, how each was
diagnosed, fixed and verified.
