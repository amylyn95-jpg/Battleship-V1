---
name: testing-battleship
description: How to build, serve and browser-test the vanilla TypeScript Battleship app (Classic mode, Salvo mode and battle theatres), including DOM probes for verifying concealed/revealed enemy cells.
---

# Testing the Battleship app

## Serving the app
The app is vanilla TypeScript + Vite, no framework: `index.html` + `src/main.ts` / `src/ui.ts` /
`src/session.ts`. Run everything from the repo root.

```bash
npm install            # usually already done
npm run build && npx vite preview --port 4173 --strictPort --host 127.0.0.1
```
Then open `http://127.0.0.1:4173/`.
`npm test` (vitest), `npm run typecheck`, `npm run lint` and `npx playwright test` all run offline.

- Bind `127.0.0.1` explicitly: the default IPv6 bind makes curl/Playwright health checks fail.
- A preview server may already be running on 4173 — kill it first (`fuser -k 4173/tcp`) if it
  serves stale output, and always rebuild after checking out a new branch.
- No backend, no login, no secrets required. State lives in `localStorage`; clear it
  (`localStorage.clear()` then reload) for a truly fresh run. Legacy saves may load as Classic.

## Devin secrets needed
None.

## Useful DOM probes (read-only, no console noise)
Enemy board is `#ai-board`, own board `#player-board`. Cells are `<button aria-label="B3">`.

```js
// Concealment / reveal audit
const q = s => document.querySelectorAll('#ai-board .cell' + s).length;
({ hit: q('.hit'), miss: q('.miss'), splash: q('.splash'), sunk: q('.sunk'),
   ship: q('.ship'), target: q('.target') })
```
Expectations:
- Salvo mid-game: `hit === 0 && miss === 0`, fired-but-unsunk cells are `.splash`.
- Classic mid-game: real `.hit`/`.miss`, never `.splash`.
- Any phase before game over: 0 unhit enemy `.ship` cells.
- After game over: exactly 17 occupied enemy cells (5+4+3+3+2) and concealment lifted.

## Theatres
Only on branches carrying the theatre work — not yet on `main`.
`#theatre` (aria-label "Battle theatre") switches between `pacific`, `sail`, `atlantic` and
`mekong`; the active one is mirrored on `body[data-theatre]` and saved under the
`battleship.theatre` localStorage key (an unknown value falls back to `pacific`). A theatre
renames the fleet and the status vocabulary, so assert against the theatre's own words, not
Pacific's: `#theatre-place` (location subtitle), `#player-heading` / `#ai-heading` (e.g.
"Your squadron" / "Hunting grounds"), `#dock` ship names ("Ship of the Line (5)"), and
`#horizon` (the landscape band). Sound differs per theatre but cannot be captured here.

Salvo UI ids: `#salvo-bar`, `#salvo-count` ("Targets n/5"), `#salvo-timer` (gains `.urgent`
under ~5s), `#fire-salvo` (keyboard `F`). The bar only exists during Salvo *playing* phase.
The 20s clock is intentionally not persisted — a refresh mid-turn gives a fresh 20s.

## Test flow tips
- "Random fleet" + "Start battle" is much faster than manual placement when placement isn't
  what you're testing; Easy difficulty finishes a full game fastest.
- To hit the clock-expiry path, just stop interacting for ~20s; status is prefixed `Time!`.
- Keyboard-only: click a board cell once to take focus, then arrows move focus, Enter
  places/fires/toggles a salvo target, `R` rotates during placement, `F` fires a salvo.
- Window width: this environment's Chrome will not shrink below ~500 CSS px
  (`wmctrl -r :ACTIVE: -e 0,0,0,420,1100` still yields `innerWidth === 500`), so
  sub-400px layout can't be verified here — say so rather than claiming phone coverage.
  Maximize with `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.
- To reach **defeat** quickly, pick Hard and keep firing at cells you know are empty.
- The AI's reply is delayed (`AI_THINK_MS` in `src/main.ts`) and clicks are ignored while it is
  thinking, by design. On branches that carry the human-like AI work, the delay also flickers a
  few candidate cells on your own board before it fires; on `main` there is no flicker.
- Known cosmetic issue to re-check: the game-over card's overlay dims both boards, making the
  newly revealed enemy fleet hard to read on screen even though the DOM reveal is correct.

## Behaviours that look like bugs but aren't
- Classic turns always alternate: a hit does not grant an extra shot.
- Placement past an edge is refused, not snapped inside (red preview + "does not fit there").
- The enemy roster hides partial damage until game over, so wounded ships are not leaked.
- Salvo clock expiry does not forfeit the turn: unfired picks are topped up at random.
- The sinking shot shows no burst (`.sunk` sets `animation: none`); shake and sound carry it.

## Regression-prone area
The AI's wounded-ship tracking in `src/ai.ts` has already produced a real bug (hits on two
adjacent ships merged into one imagined ship, emptying the target queue). It is invisible in a
normal playthrough — watch *where* it fires after a hit. `nextShot`/`recordResult` are pure
and take an injectable `random`, so replay suspect sequences in a vitest file instead of the UI.
See `BUGS.md`.
