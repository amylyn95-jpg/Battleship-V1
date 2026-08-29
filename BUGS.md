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

## 6. "The enemy hits me every time I hit it" — a perception bug, not a cheat

**Symptom.** Reported by the player: every time they scored a hit, the opponent
seemed to score one immediately afterwards, as if it were reading their shots.

**Diagnosis.** The opponent cannot see the player's board — it only ever reads its
own shot history (`AiState.tried`), and player and AI shots resolve against
different boards. To prove that rather than assert it, I simulated 400 games per
difficulty and measured the AI's hit rate on the shot right after a player hit
versus right after a player miss: Normal 32.4% vs 32.7%, Easy 17.0% vs 17.4%,
Hard 39.1% vs 36.4% (Hard's gap comes from its density map getting sharper as the
board fills, not from the player). So the feeling was real but the cause was not
coupling: the AI never wasted a follow-up shot, so its hits arrived in clumps
(mean run 2.1, 29% of runs 3+), and each clump began right after the player's own
turn. Normal also searched on a perfect diagonal lattice that no ship can hide
from, so it found ships faster than a person would.

**Fix.** Made the opponent fallibly human instead of mechanically perfect
(`src/ai.ts`): after a miss it sometimes abandons a wounded ship and comes back to
it later (Normal 40%, Hard 12%), occasionally probes a diagonal neighbour, and
Normal now hunts with loose spacing rather than a fixed lattice. It still never
repeats a shot and still sees only its own results. A visible build-up
(`showScan()` in `src/main.ts`) highlights a few cells it is weighing before it
fires, so a hot streak reads as reasoning rather than mind-reading — the
candidates come from AI state only, so nothing about the player's fleet leaks.

**Verification.** New unit tests assert it keeps chasing when it does not lose the
thread, can break off after a miss but never straight after a hit, searches with
spacing instead of a lattice, only ever telegraphs cells it has not fired at, and
picks identical shots from identical AI state regardless of what the player did.
Re-measured self-play: average shots to clear a fleet is 95.6 (Easy), 61.3
(Normal), 46.7 (Hard), so difficulty ordering still holds and Normal is easier
than before. 54 unit and 24 browser tests pass.

A regression the browser tests caught: the build-up initially added ~2s per turn
and overwrote the player's own hit/miss line, so the full-game test timed out and
the status assertion failed. The build-up is now ~550ms total and appended to the
player's result instead of replacing it.

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
