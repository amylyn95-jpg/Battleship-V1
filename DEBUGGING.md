# Bugs found, diagnosed, and fixed

Five real defects surfaced while building this game. Each entry records the
symptom, how it was diagnosed, the fix, and how the fix was verified. Two of them
(#1 and #3) would have shipped silently without automated tests.

---

## 1. "Easy" difficulty was not easy

**Symptom.** The self-play test asserting that the AI gets weaker as difficulty
drops failed: Easy finished games in an average of 61.7 shots, when a genuinely
blind opponent should need well over 80.

```
AssertionError: expected 61.72 to be greater than 80
```

**Diagnosis.** The self-play harness plays 300 seeded games per difficulty and
reports the average number of shots needed, which turns "the AI feels wrong" into
a number. 61.7 is a hunting AI's score, not a random one's. Reading
`nextShot()`, the target queue was drained *before* the difficulty switch:

```ts
if (state.queue.length > 0) return state.queue[0]!;   // ran for every difficulty
switch (state.difficulty) { case "easy": return pick(remaining, random); ... }
```

So Easy fired randomly only until its first hit, then followed up exactly like
Normal. The "difficulty" selector effectively did almost nothing.

**Fix.** Gate the queue on difficulty, so Easy never follows up on a hit
(`src/ai.ts`):

```ts
if (state.difficulty !== "easy") {
  state.queue = state.queue.filter((c) => untried(state, c));
  if (state.queue.length > 0) return state.queue[0]!;
}
```

**Verification.** The same 300-game harness now reports a strictly decreasing
average across easy → normal → hard, with Easy above 80 shots and Hard below 60.
The test that caught it was kept as a regression guard rather than relaxed.

---

## 2. An invisible overlay swallowed every click

**Symptom.** Every browser test timed out on its very first click, including
clicks on plain buttons:

```
- <div id="gameover" class="overlay hidden"> intercepts pointer events
```

The page looked completely normal in a screenshot — nothing was visibly covering it.

**Diagnosis.** Playwright names the element that intercepted the click, which
pointed straight at the game-over dialog even though it carried the `hidden`
class. Two rules of equal specificity were fighting in `styles.css`, and the
later one wins in CSS:

```css
.hidden  { display: none; }   /* declared early  */
.overlay { display: flex; }   /* declared later — won */
```

The dialog was therefore laid out full-screen and transparent over the whole game
at all times, blocking every interaction. A human tester would have reported
"the game does nothing when I click".

**Fix.** Give the overlay its own, more specific hidden rule so declaration order
stops mattering:

```css
.overlay.hidden { display: none; }
```

**Verification.** All six browser tests pass on desktop and mobile viewports, and
the same suite would fail again the moment the overlay reappears, since every test
begins with a click.

---

## 3. Reloading during the AI's turn froze the game forever

**Symptom.** Suspected from reading the code rather than observed, so a test was
written to prove it: fire a shot, then reload the page before the AI's ~0.5s
"thinking" delay elapses. The status line stayed at "Game restored — fire at the
enemy waters." and the enemy grid was permanently disabled.

**Diagnosis.** The game saves itself on every render. Firing sets `turn = "ai"`
immediately and schedules the AI's shot with `setTimeout`. Reloading in that
window restores a state that says "it is the AI's turn" — but the timer died with
the old page, and nothing on startup re-triggers it. The player's board is locked
whenever it is not their turn, so the game was unwinnable and unrecoverable
without clearing browser storage.

**Fix.** Resume the pending turn on startup (`src/main.ts`):

```ts
if (session.phase === "playing" && session.turn === "ai") {
  scheduleAiTurn();
}
```

**Verification.** New browser test `resumes the AI turn when reloaded mid-think`
reloads inside the delay window and asserts the enemy's shot is reported *and*
that the player's grid becomes clickable again. It fails against the old code and
passes against the fix.

---

## 4. The compiler hid the fact that the game state can change mid-turn

**Symptom.** A type error that looks like pedantry:

```
src/main.ts: error TS2367: This comparison appears to be unintentional because
the types '"playing"' and '"gameover"' have no overlap.
```

**Diagnosis.** TypeScript had narrowed `session.phase` from an earlier guard and
carried that narrowing into a `setTimeout` callback that runs half a second
later — by which time the phase genuinely can have changed (the player's shot may
have ended the game). The compiler was not wrong about its own rules; it was
proving that the code relied on a stale assumption about the phase.

**Fix.** Read the phase through a small accessor (`currentPhase()`) at the point
of use, which both silences the false narrowing and documents that the value is
re-read deliberately.

**Verification.** `npm run typecheck` is clean, and the "plays a full game"
browser test exercises the end-of-game path repeatedly without the AI firing after
the final shot.

---

## 5. Browser tests never started: the server was listening on the wrong address

**Symptom.** `npm run e2e` failed before running a single test:

```
Error: Timed out waiting 120000ms from config.webServer.
```

**Diagnosis.** Starting the preview server by hand and curling it returned `200`,
so the server itself was fine. The difference was the address: the harness
health-checks `http://127.0.0.1:4173`, while the dev server's default host
resolved to IPv6 `::1` on this machine, so the check never succeeded.

**Fix.** Bind the test server explicitly (`playwright.config.ts`):

```
npx vite preview --port 4173 --strictPort --host 127.0.0.1
```

A related trap cost time here: `reuseExistingServer` silently reused a stale
server I had started manually, so a fixed CSS bug kept "failing" because the
browser was being served an old build. Killing the stray process resolved it.

**Verification.** `npm run e2e` starts the server and runs all 12 checks (6 tests
across desktop and mobile) from a cold start.

---

## Testing that backs these fixes

| Layer                        | What it covers                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Unit (`tests/board.test.ts`) | Placement bounds/overlap, hit/miss/sunk resolution, refusing repeat shots, win detection.         |
| AI (`tests/ai.test.ts`)      | 900 seeded self-play games: no repeat shots, every game finishes, difficulty ordering holds.        |
| AI edge cases                | Axis lock, resuming a second wounded ship, and two touching ships faking a wrong axis.             |
| Session                      | Turn alternation, out-of-turn rejection, save/restore round-trip, corrupt saved data.               |
| Browser (`e2e/game.spec.ts`) | Placement rejection, firing feedback, no double-fire, a full game to the result screen, reloads.    |

Every browser test also fails the run if the page logs a console error, which is
how silent runtime exceptions get caught.

## Known limitations, deliberately not fixed

- The enemy fleet layout lives in the browser (and in `localStorage`), so a player
  who opens developer tools can read it. Hiding it would require a server, which
  the brief explicitly traded away for simplicity.
- Changing difficulty mid-game starts a new game rather than swapping the
  opponent's brain in place, since a hunting AI's memory is not meaningful to a
  random one.
- There is no undo for ship placement; **Clear** resets the whole fleet.

---

# Additional rebuild defects

## 6. The debrief screen never appeared after game over

**Problem.** A finished match kept showing the battle screen instead of opening
the debrief overlay.

**Discovery.** The full-game browser test reached an engine game-over state but
never found the visible debrief dialog.

**Investigation.** The game engine correctly changed `session.phase` to
`"gameover"`, but the controller's derived UI `screen` value was still
`"battle"`. The render path therefore continued to paint the battle view.

**Root cause.** Engine phase and UI screen were tracked separately, and no
phase-to-screen synchronization ran after a shot ended the game.

**Fix.** Added `syncScreenToPhase()` and called it after player and AI shot
resolution. It derives the debrief screen from the engine phase without
persisting a second screen state.

**Verification.** The full-game Playwright test now reaches the debrief, checks
its title and statistics, verifies the revealed enemy fleet, and completes the
rematch flow.

## 7. The enemy fleet was hidden at game over

**Problem.** The debrief appeared, but the enemy ships were not revealed behind
it.

**Discovery.** The debrief requirement specifically called for the enemy's final
fleet positions, and a browser assertion found no `.ship` cells on the enemy
board after game over.

**Investigation.** `renderBattle` always called `paintBoard` with
`revealShips` set to `false`, even when `session.phase` was `"gameover"`.

**Root cause.** The old controller's phase-aware reveal argument was lost during
the battle-view refactor.

**Fix.** Passed `session.phase === "gameover"` to `paintBoard` for the enemy
board.

**Verification.** The full-game Playwright test asserts that at least one
`#ai-board .cell.ship` is visible after the debrief appears.

## 8. Duplicate difficulty and mode controls appeared

**Problem.** The command screen showed both select menus and button rows for
difficulty and mode, giving the player two controls for each choice.

**Discovery.** Browser review showed duplicate controls, and the command markup
contained both the selects and the newer labelled buttons.

**Investigation.** Both control sets had listeners and both were painted by the
command view, so the duplication was in the rendered page rather than only in
unused markup.

**Root cause.** The original select controls were left in place when the
button-based command screen was added.

**Fix.** Removed the selects, their labels, and their listeners. The labelled
button rows are now the single source of input, while difficulty changes still
recreate the AI with the selected level.

**Verification.** Unit/type checks pass, and Playwright selects Salvo through
the button row before exercising salvo gameplay.

## 9. Hovering replayed the whole battle log

**Problem.** Moving across board cells caused the entire screen to re-render,
including replaying the battle-log entry animation on every hover or focus.

**Discovery.** Code review found that every `mouseenter`, `focus`, `mouseleave`,
and `blur` handler called the controller's full `render()` function.

**Investigation.** Aiming only needed to change one cell's `.aiming` class and
the target readout; it did not need to rebuild docks, fleet lists, or log
entries. The log renderer also rebuilt all entries on every normal render.

**Root cause.** Pointer and keyboard aiming updates were routed through the
general repaint path, and the log had no change check.

**Fix.** Added targeted `updateAiming()` handling and cached the log count and
newest timestamp so the log DOM is rebuilt only when entries change.

**Verification.** The browser suite covers mouse/keyboard gameplay, and manual
review confirms aiming updates without restarting existing log entries.

## 10. New battle silently changed the selected settings

**Problem.** Choosing **NEW BATTLE** discarded the player's difficulty and mode
and silently started a Normal Classic game.

**Discovery.** Reviewing the button handler showed hardcoded `"normal"` and
`"classic"` arguments.

**Investigation.** The command controls correctly updated the current session,
but the reset path did not use those values when constructing the new session.

**Root cause.** The new-battle handler retained defaults from the earlier
single-setting flow.

**Fix.** Passed `session.difficulty` and `session.mode` through both the
debrief **NEW BATTLE** action and the top-bar **New game** action.

**Verification.** The settings are preserved through the reset path and the
full browser suite continues to pass.

## 11. Hidden board wrappers were not hidden

**Problem.** The `ENEMY WATERS` board remained visible on the deployment screen.

**Discovery.** Browser review showed the enemy board beneath the deployment
controls even though `render()` applied the `hidden` class.

**Investigation.** The generic `.hidden` rule appeared earlier in the stylesheet
than `.board-wrap { display: flex; }`, so the later display rule won the CSS
cascade.

**Root cause.** `.board-wrap` was another instance of the existing hidden-class
cascade trap.

**Fix.** Added the more-specific `.board-wrap.hidden { display: none; }`
override.

**Verification.** Playwright asserts that `#ai-wrap` is hidden during
deployment and visible during battle on desktop and mobile.

## 12. Commander Voss reported the best streak instead of the current streak

**Problem.** After a miss, Commander Voss could still claim that the player was
on an earlier, longer hit streak.

**Discovery.** Browser review caught Voss continuing to report a four-shot run
after that run had ended.

**Investigation.** Player-shot comms used `longestHitStreak`, which measures the
best run anywhere in the match. The live message needs only the consecutive hits
at the end of the shot history.

**Root cause.** A debrief statistic was reused for a live-turn message with a
different meaning.

**Fix.** Added the pure `currentHitStreak()` helper and used it for Voss.
`longestHitStreak()` remains the debrief statistic.

**Verification.** Unit tests cover empty histories, interrupted streaks,
trailing hits, and an earlier longer streak; the full browser suite passes.

## 13. Drag-and-drop data was unavailable during dragover

**Problem.** Native drag placement did not reliably know which ship was being
dragged while the pointer moved over the board.

**Discovery.** The drag-and-drop Playwright scenario intermittently showed the
wrong preview or placed the next queued ship instead of the dragged ship.

**Investigation.** The browser supplied the drag data consistently on drop but
not consistently during `dragover`, even though `dragover` had to call
`preventDefault()` for dropping to work.

**Root cause.** The implementation relied on `dataTransfer` at every drag
event, but browsers do not guarantee the same readable data during
`dragover`.

**Fix.** Kept native drag events and `dataTransfer` for the normal path, while
tracking the dragged ship ID in the deployment view as a fallback for preview
and drop.

**Verification.** The drag-and-drop Playwright test confirms that dragging the
Destroyer places the Destroyer, and the full desktop/mobile suite passes.
