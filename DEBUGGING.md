# Debugging notes

Four defects were found while building this game. For each: what the symptom was, how it was
diagnosed, what the fix was, and how the fix was verified. Nothing here is hypothetical — each was
observed on this machine, and three of the four now have regression tests.

Bug 2 is the interesting one.

---

## 1. Every Vite and Vitest command failed with "Cannot find native binding"

**Symptom.** Immediately after scaffolding, `npx vitest run` and `npm run dev` both aborted:

```
failed to load config from vite.config.ts
Error: Cannot find native binding. npm has a bug related to optional dependencies ...
  cause: Error: Cannot find module '@rolldown/binding-wasm32-wasi'
```

**Diagnosis.** The error text blames a known npm optional-dependency bug, so the obvious move —
`rm -rf node_modules package-lock.json && npm install` — was tried first. It changed nothing, which
ruled that cause out. Next step was to check whether the platform-specific package was even
*eligible* to install:

```bash
$ ls node_modules/@rolldown          # → only "pluginutils"; no binding-linux-x64-gnu
$ node -e "console.log(process.platform, process.arch)"   # → linux x64  (so the binding exists upstream)
$ node -e "console.log(require('./node_modules/rolldown/package.json').engines)"
{ node: '^20.19.0 || >=22.12.0' }
$ node -v
v20.18.1
```

Root cause: Vite 8 bundles Rolldown, whose native binding requires Node `^20.19.0 || >=22.12.0`.
The machine's default Node was 20.18.1, so npm **silently skipped** the optional dependency — no
install error, only a confusing runtime failure later. The misleading error message was the real
time sink: it pointed at npm, not at the Node version.

**Fix.** Pin the Node version the project actually supports rather than reinstalling repeatedly:

- `.nvmrc` → `22.12.0`
- `engines.node` → `>=22.12.0` in `package.json`
- CI uses `actions/setup-node` with `node-version-file: .nvmrc`, so the deploy pipeline can never
  drift from local development.

**Verification.** `nvm use && npm ci` then `npm test`, `npm run typecheck`, `npm run lint` and
`npm run build` all succeed; `ls node_modules/@rolldown` now contains `binding-linux-x64-gnu`. CI
runs the same four commands on a clean checkout, which is the real proof — a fresh clone works.

---

## 2. The AI abandoned a wounded ship and went back to firing randomly

**Symptom.** Found during end-to-end play testing, not by unit tests. On Normal difficulty the AI
hit a ship at F9 on its first shot and then never followed up on the neighbouring cell — it drifted
back to random hunting and only found E9 about 55 shots later. Because the AI eventually wins
anyway, the game *looked* fine; the bug only showed up when watching where the shots went.

**Diagnosis.** The AI keeps `activeHits`, the hits belonging to "the ship I am currently hunting",
and once two of those line up it infers the ship's axis and fires only at the two ends of that line
(`alignedCandidates`). The flaw: `activeHits` had no concept of *which* ship a hit belonged to. When
the AI hit two different ships before sinking either one, their hits were merged into one imaginary
ship, and the inferred axis pointed at cells that had already been fired at — leaving an empty
target queue, which silently degraded to random hunting.

Reproduced deterministically with two adjacent ships (Destroyer E9–F9, Carrier F10–J10):

| AI shot | Result | `activeHits` after | Queue |
| --- | --- | --- | --- |
| F9 | hit (Destroyer) | `{F9}` | F8, F10, E9, G9 |
| F8 | miss | `{F9}` | F10, E9, G9 |
| F10 | hit (**Carrier**) | `{F9, F10}` → treated as one vertical ship | F8 only — already fired ⇒ **empty** |

A second, subtler instance of the same class of bug was found by reading the code around it: when a
ship sank, `registerOutcome` cleared `activeHits` wholesale, so a *different* ship already wounded
on the same trail was forgotten too.

**Fix** (`src/game/ai.ts`):

1. `registerOutcome` now receives the post-shot board and filters already-fired cells out of the
   queue, so a stale queue can never masquerade as "nothing to follow up".
2. Axis candidates are a *preference*, not a replacement: the queue is now
   `[...alignedCandidates(hits), ...hits.flatMap(neighbours)]`. If the axis guess is wrong (because
   the hits belong to two ships) plain adjacency is still there as a fallback.
3. On a sink, only the sunk ship's own cells are dropped. The sunk ship is a contiguous run of known
   length through the killing shot (`sunkRun`), so any hit outside that run belongs to another ship
   and stays on the trail. This required adding `shipSize` to the `sunk` outcome — legitimate
   information, since "you sank my Battleship" tells a human player the size too.

```diff
- if (outcome.kind === 'sunk') return { ...state, queue: [], activeHits: [] };
+ if (outcome.kind === 'sunk') {
+   const sunkCells = new Set(sunkRun([...state.activeHits, target], target, outcome.shipSize).map(key));
+   const orphans = state.activeHits.filter((hit) => !sunkCells.has(key(hit)));
+   return { ...state, activeHits: orphans, queue: rebuild(orphans) };
+ }
```

**Verification.** Two regression tests in `src/game/ai.test.ts` encode exactly the two scenarios
above — `keeps hunting a wounded ship whose hits interleave with another ship` and `keeps chasing a
second wounded ship after the first one sinks`. Both fail against the old code and pass now. The
pre-existing statistical test (`hard` clears a fleet in fewer shots than `easy` across 8 seeds) and
the 25-game end-to-end test still pass, confirming the fix did not break ordinary targeting.

While writing the second regression test its expectation was initially wrong — it asserted the AI
would fire at one specific neighbour when either neighbour is a legal follow-up. The *test* was
corrected to assert the real invariant (the shot is adjacent to the surviving hit); the production
code was left alone, since it was already right.

---

## 3. The illegal-placement preview was clipped to a single cell

**Symptom.** During placement, hovering the 5-cell Carrier over the right edge of the board showed
only one red cell instead of a full-length red ghost ship, so it was unclear whether the game had
registered the ship at all. Clicking correctly did nothing.

**Diagnosis.** `Grid` only renders the 100 real cells, and `shipCells` happily returns off-board
coordinates, so the parts of the preview hanging off the board simply had nowhere to draw. The
underlying cause was a UX decision, not a rendering bug: treating an overhanging hover as an
*illegal placement* is the wrong model — every other implementation lets you drop a ship near the
edge and snaps it inside.

**Fix.** `clampStart` (`src/game/board.ts`) pulls the anchor back so the ship always fits, and
`App.tsx` applies it to both the preview and the click. Overhang is now impossible instead of
illegal, so the only red previews left are genuine overlaps — which always render at full length.
`canPlace` was deliberately left strict (it still rejects off-board placements) because it is the
engine's validation boundary, and `randomBoard` and the tests rely on it.

**Verification.** `clamps an anchor so the ship stays fully on the board` in
`src/game/board.test.ts`, plus a manual pass in the browser: hovering the far-right column now shows
a full 5-cell green ghost ending at column J, and clicking places it there.

---

## 4. The enemy fleet roster stayed masked after the game ended

**Symptom.** At game over the enemy grid reveals all remaining ships, but the enemy fleet list next
to it still showed undamaged pips for ships the player had been hitting.

**Diagnosis.** Not a logic error but a hard-coded prop: `<FleetStatus revealDamage={false} />`. The
flag exists to prevent an information leak — showing partial damage on the enemy roster would tell
the player which ships they have wounded — but once the game is over there is nothing left to hide,
and the grid was already revealing more than the roster.

**Fix.** `revealDamage={game.phase === 'gameOver'}` in `App.tsx`.

**Verification.** Manual: hits on an afloat enemy ship are still invisible in the roster mid-game
(re-checked against the rendered DOM, not just visually), and after the final shot the roster shows
the true damage. The pre-existing information-leak checks — no `cell--ship` class on enemy waters
before game over — still hold.

---

## What testing found vs. what tests found

Worth recording, because it shaped how the code is structured:

| Found by | Bugs |
| --- | --- |
| Unit tests (`vitest`) | none of these four — but they pinned the rules down (invalid shots, sink detection, one-winner invariant) so the pure logic never regressed while the UI was built |
| Actually running the tooling | #1 |
| Playing the game and watching the AI | #2 — invisible to unit tests because the AI still wins; only the *quality* of its shots was wrong |
| Reading the code around a known bug | #2's second instance (forgotten second wounded ship) |
| Interaction/edge-case testing in the browser | #3, #4 |

The reason #2 could be diagnosed quickly is that the AI is a pure function of
`(state, board, random)` with an injectable random source, so a suspected sequence could be replayed
deterministically in a test file instead of being hunted for in the UI.

Things deliberately *not* fixed: the AI still only follows adjacency leads it has personally
generated (it does not compute a full probability density over possible ship placements — that would
be stronger, but the parity + axis heuristic is already hard to beat and the code stays readable),
and there is no persistence, so a page refresh restarts the game.
