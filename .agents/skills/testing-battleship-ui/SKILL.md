---
name: testing-battleship-ui
description: How to run and end-to-end test the Battleship game in a browser — dev server setup, asserting grid state from the DOM, and fast routes to victory/defeat.
---

# Testing the Battleship UI

## Running it

The box's default Node (20.18.1) breaks every Vite 8 command with `Cannot find native binding`,
because npm skips Rolldown's platform binary for Node < 20.19. Always:

```bash
source ~/.nvm/nvm.sh && nvm use   # .nvmrc -> 22.12.0
npm install
npm run dev                        # http://localhost:5173
```

No backend, no accounts, no credentials. `npm test` (vitest), `npm run typecheck`, `npm run lint`
(oxlint) and `npm run build` all run offline.

## Asserting board state from the DOM

Don't eyeball the grids. Every cell is a `<button>` carrying:

- `data-cell` — the human coordinate, e.g. `C5` (columns A-J left to right, rows 1-10 top to bottom)
- `aria-label` — `"<grid name> <cell>: <visual>"` where visual is `water | ship | hit | miss | sunk`

So an information-leak check is one query: before game over, no cell in *Enemy waters* may have
`: ship` in its `aria-label` or the `cell--ship` class. Grids are labelled `Your waters` and
`Enemy waters` via `aria-label` on the section.

## Driving a game fast

- Skip manual placement with **Random fleet**, then **Start battle**.
- To reach **victory** quickly, sweep the enemy grid systematically (all of row 1, then row 2, ...);
  17 of 100 cells are ships.
- To reach **defeat**, pick the Hard AI and keep firing at cells you know are empty — the AI clears
  a fleet faster than a blind sweep does.
- The AI replies after ~650 ms (`AI_THINKING_MS` in `src/App.tsx`); the phase is `aiTurn` until then
  and all player clicks are ignored, which is intentional.

## Behaviours that look like bugs but aren't

- Turns always alternate: a hit does NOT grant an extra shot.
- Hovering near the right/bottom edge snaps the ship inside the board (`clampStart`) instead of
  rejecting it; red previews only ever mean an overlap.
- The enemy fleet roster hides partial damage until game over — deliberate, to avoid leaking which
  ships are wounded.

## Regression-prone area

The AI's wounded-ship tracking (`src/game/ai.ts`, `activeHits` / `alignedCandidates` / `sunkRun`)
has already produced one real bug: hits spanning two different ships were merged into one imagined
ship, emptying the target queue and reverting the AI to random fire. It is invisible in a normal
playthrough (the AI still wins) — you have to watch *where* it shoots after a hit. Because
`nextShot`/`registerOutcome` are pure and take an injectable `random`, suspected sequences should be
replayed in a vitest file rather than hunted for in the UI. See `DEBUGGING.md`.
