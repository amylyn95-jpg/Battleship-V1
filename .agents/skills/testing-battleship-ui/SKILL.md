---
name: testing-battleship-ui
description: How to run and end-to-end test the Battleship game in a browser — dev server setup, asserting grid state from the DOM, and fast routes to victory/defeat.
---

# Testing the Battleship UI

## Running it

```bash
npm install
npm run dev   # http://localhost:5173
```

There is no `.nvmrc`; the project is on Vite 6 and runs on the box's default Node.

No backend, no accounts, no credentials. `npm test` (vitest), `npm run typecheck`, `npm run lint`
(eslint) and `npm run build` all run offline.

## Asserting board state from the DOM

Don't eyeball the grids. Every cell is a `<button>` inside `#player-board` ("Your fleet") or
`#enemy-board` (grids carry `role="grid"` and an `aria-label`), with:

- `aria-label` — just the coordinate, e.g. `C5` (columns A-J left to right, rows 1-10 top to bottom)
- `data-row` / `data-col` — zero-based indices
- CSS classes carrying the state: `ship`, `hit`, `miss`, `sunk`, `splash` (unresolved Salvo shot),
  plus hull-art classes `hull-h`/`hull-v` and `hull-bow`/`hull-mid`/`hull-stern`

So an information-leak check is one query: before game over, no cell in the enemy grid may have
the `ship` class.

## Driving a game fast

- Skip manual placement with **Random fleet**, then **Start battle**.
- To reach **victory** quickly, sweep the enemy grid systematically (all of row 1, then row 2, ...);
  17 of 100 cells are ships.
- To reach **defeat**, pick the Hard AI and keep firing at cells you know are empty — the AI clears
  a fleet faster than a blind sweep does.
- The AI replies after ~550 ms (`AI_THINK_MS` in `src/main.ts`); player clicks are ignored while
  `aiThinking` is set, which is intentional.

## Behaviours that look like bugs but aren't

- Turns always alternate: a hit does NOT grant an extra shot.
- A ship hovered past the right/bottom edge shows a red preview and the click is rejected
  ("The Battleship does not fit there.") — out-of-bounds placement is refused, not snapped inside.
- The enemy fleet roster hides partial damage until game over — deliberate, to avoid leaking which
  ships are wounded.
- In Salvo mode, letting the 20s shot clock expire does NOT forfeit the turn: the selection is
  topped up with random unfired cells and the salvo fires, with the status prefixed "Time!".
- The shot that sinks a ship shows no burst animation (`.sunk` sets `animation: none`); feedback is
  the screen shake, sound, and wreck marker.

## Regression-prone area

The AI's wounded-ship tracking (`src/ai.ts`, `activeHits` / `alignedCandidates` / `sunkRun`)
has already produced one real bug: hits spanning two different ships were merged into one imagined
ship, emptying the target queue and reverting the AI to random fire. It is invisible in a normal
playthrough (the AI still wins) — you have to watch *where* it shoots after a hit. Because
`nextShot`/`registerOutcome` are pure and take an injectable `random`, suspected sequences should be
replayed in a vitest file rather than hunted for in the UI. See `DEBUGGING.md`.
