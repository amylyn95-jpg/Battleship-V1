# Battleship

Classic Battleship in the browser against an AI opponent. No backend, no accounts,
no data leaves your machine — the whole game runs as static files.

## Play

Live: _set after the first Pages deploy_ (`https://<owner>.github.io/battleship/`)

Place your five ships (click to place, **R** to rotate, or hit **Random fleet**),
press **Start battle**, then click the enemy grid to fire. First fleet sunk loses.
An in-progress game survives a page refresh.

## Difficulty

| Level  | How the opponent picks its shot                                                                 |
| ------ | ----------------------------------------------------------------------------------------------- |
| Easy   | Fires at a random untried cell and never follows up on a hit.                                    |
| Normal | Hunts on a parity lattice, then locks onto a ship's axis and finishes it off.                     |
| Hard   | Same follow-up logic, but hunts by counting how many legal ship placements cover each cell.       |

The opponent only ever sees the results of its own shots — it cannot read your board.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit + AI self-play tests (Vitest)
npm run e2e        # browser tests (Playwright, desktop + mobile viewports)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # production bundle into dist/
```

## Layout

| File              | Responsibility                                                       |
| ----------------- | -------------------------------------------------------------------- |
| `src/types.ts`    | Shared types, board size, fleet definition.                          |
| `src/board.ts`    | Grid maths: placement validation, random fleets, sunk detection.      |
| `src/game.ts`     | Resolving a single shot and deriving stats.                          |
| `src/ai.ts`       | Opponent search: hunt, target, probability density.                  |
| `src/session.ts`  | Turn order, win detection, save/restore.                             |
| `src/ui.ts`       | Turning board state into DOM classes.                                |
| `src/main.ts`     | Event wiring.                                                        |

Game rules and AI logic never touch the DOM, which is what makes them testable in
isolation.

## Deployment

Pushing to `main` runs the tests and publishes `dist/` to GitHub Pages
(`.github/workflows/deploy.yml`). Enable it once under **Settings → Pages →
Source: GitHub Actions**.

See [`BUGS.md`](./BUGS.md) for the bugs found while building this and how each was
diagnosed, fixed, and verified.
