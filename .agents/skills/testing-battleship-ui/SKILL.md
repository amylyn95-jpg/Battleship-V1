---
name: testing-battleship-ui
description: How to run and end-to-end test the Battleship game in a browser — dev server setup, asserting grid state from the DOM, fast routes to victory/defeat, and capturing the 3D view's shot cinematics from CDP screencast frames.
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

Restarting the server safely: `pkill -f vite` can match your own command chain and kill the process
you just launched. Prefer:

```bash
cd /path/to/Battleship-V1 && (setsid nohup npm run dev > /tmp/dev5173.log 2>&1 < /dev/null &) ; sleep 12
```

## Asserting board state from the DOM

Don't eyeball the grids. Every cell is a `<button>` inside `#player-board` ("Your fleet") or
`#ai-board` (grids carry `role="grid"` and an `aria-label`), with:

- `aria-label` — just the coordinate, e.g. `C5` (columns A-J left to right, rows 1-10 top to bottom)
- `data-row` / `data-col` — zero-based indices
- CSS classes carrying the state: `ship`, `hit`, `miss`, `sunk`, `splash` (unresolved Salvo shot),
  plus hull-art classes `hull-h`/`hull-v` and `hull-bow`/`hull-mid`/`hull-stern`

So an information-leak check is one query: before game over, no cell in the enemy grid may have
the `ship` class.

Other useful handles: `[aria-label="Battle log"] li` (newest first),
`[aria-label="Commander Voss communications"]`, `#stage canvas` (the Three.js view), and the
header view toggle whose label is either `3D VIEW` or `CLASSIC VIEW`.

## Driving a game fast

- Fresh loads open on the command screen. Click **DEPLOY FLEET**, then skip manual
  placement with **Random fleet**, then **ENGAGE ENEMY**.
- To reach **victory** quickly, sweep the enemy grid systematically (all of row 1, then row 2, ...);
  17 of 100 cells are ships.
- To reach **defeat**, pick the Hard AI and keep firing at cells you know are empty — the AI clears
  a fleet faster than a blind sweep does.
- The AI replies after ~550 ms (`AI_THINK_MS` in `src/main.ts`); player clicks are ignored while
  `aiThinking` is set, which is intentional.
- The persisted session is `localStorage["battleship.session.v1"]`; the persisted view mode is
  `localStorage["battleship.view.v1"]`. **The enemy fleet is under `session.aiBoard`** (not
  `session.ai`, which is the AI's own guess state) — read `aiBoard.ships[].cells` to choose a
  known-ship cell and `aiBoard.shots` to skip already-fired cells.
- To force a *specific* scripted situation, write a doctored session into localStorage and reload.
  `session.ai.tried` serialises as an array of `[key, hit]` pairs (it is a `Map` at runtime), and
  `session.ai.queue` is the AI's follow-up shot list — seeding `activeHits`/`queue`/`axis` makes the
  AI's next shot deterministic, which is the only reliable way to make the AI sink a chosen ship of
  yours on cue (useful for the player-side sink cinematic).

## Behaviours that look like bugs but aren't

- Turns always alternate: a hit does NOT grant an extra shot.
- A ship hovered past the right/bottom edge shows a red preview and the click is rejected
  ("The Battleship does not fit there.") — out-of-bounds placement is refused, not snapped inside.
- The enemy fleet roster hides partial damage until game over — deliberate, to avoid leaking which
  ships are wounded.
- In Salvo mode, letting the 20s shot clock expire does NOT forfeit the turn: the selection is
  topped up with random unfired cells and the salvo fires, with the status prefixed "Time!".
- The shot that sinks a ship shows no burst animation in the Classic grid (`.sunk` sets
  `animation: none`); feedback is the screen shake, sound, and wreck marker.

## The 3D view on a software-WebGL box

This is the norm on CI/VM boxes, where the renderer reports SwiftShader:

- `defaultViewMode()` (`src/three/support.ts`) returns **classic** on software renderers, so the app
  opens in Classic. That is intended. **Every 3D test must first click the `3D VIEW` toggle.**
- Vapour trails are gated off by `trailEnabled: !softwareRenderer && !(max-width:700px)`
  (`src/three/scene.ts`), so on such a box, and at any viewport ≤700px, **no trail is expected**.
  To exercise the trail path, spoof the renderer string in a Playwright init script before the page
  loads and check the app agrees:

  ```js
  await ctx.addInitScript(() => {
    const patch = (P) => { if (!P) return; const o = P.getParameter;
      P.getParameter = function (p) { return p === 37446 ? 'NVIDIA GeForce RTX 3080' : o.call(this, p); }; };
    patch(globalThis.WebGLRenderingContext?.prototype);
    patch(globalThis.WebGL2RenderingContext?.prototype);
  });
  ```

  `37446` is `UNMASKED_RENDERER_WEBGL`. Disclose any such spoof in the report — it changes quality
  settings, not just trails.
- Frame rate is low but usable (~14-30 rAF FPS). Judge visuals from captured frames, not motion.
  Report absolute FPS as an environment observation and gate only on "no long stall".

### Capturing shot cinematics (projectile in flight, plume, airburst, sink)

Single screenshots almost always land *after* impact, and at real camera distance the shell is only
a few pixels. Use a CDP `Page.startScreencast` loop and save every frame, then inspect:

```js
const client = await ctx.newCDPSession(page);
const pending = [];
client.on('Page.screencastFrame', async (f) => { pending.push({ at: Date.now(), data: f.data });
  await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await client.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
```

Timing rules that make frames attributable:

- **Wait for a genuinely idle turn before firing.** If the previous cinematic is still running the
  click is swallowed and your `t=0` is meaningless. Wait for `YOUR TURN` in the status, absence of
  `INCOMING FIRE`/`ENEMY ANALYZING`, and then a further ~3s.
- **Anchor `t=0` on the player's own battle-log line**, not on the click: poll until
  `[aria-label="Battle log"] li` count increases, and name frame files by ms offset from that.
  Click→log is typically 230-470ms.
- Flight durations (`src/three/projectiles.ts`): cannonball 1500ms, bolt 1250ms, bomb 1900ms. The AI
  replies ~550ms after your shot, so an enemy impact cannot land before roughly
  `flight + 550ms` — anything earlier is yours.
- The Midway bomb mesh is hidden until 45% of the arc (`bomb.visible = t > 0.45`); before that you
  see the dive-bomber silhouette only.
- The impact camera looks *at* the impact point, so the airburst/plume renders near the **centre of
  the viewport** during the ~1800ms hold. Crop the centre rather than hunting the whole frame.
- To localise an effect objectively, difference two frames and take the largest changed component:
  `convert A.jpg B.jpg -compose difference -composite -colorspace gray -blur 0x2 -threshold 18% -connected-components 8 null:`

### Enemy ships are not rendered mid-battle

`renderFleet(board, side, visible)` in `src/three/director.ts` clears the fleet entirely when
`visible` is false, and the enemy side is only visible at game over. Consequences:

- Fog of war in 3D is structural, not just a material trick.
- **You cannot see an enemy hull sink mid-battle.** An enemy kill is evidenced by the larger
  `sunk`-kind impact (taller plume, bigger fireball, 2500ms) plus the roster flipping to
  `DESTROYED`. To film a hull actually rolling and submerging, sink one of *your own* ships (the
  player fleet is always rendered) — seed the AI state as described above.

## Regression-prone area

The AI's wounded-ship tracking (`src/ai.ts`, `activeHits` / `alignedCandidates` / `sunkRun`)
has already produced one real bug: hits spanning two different ships were merged into one imagined
ship, emptying the target queue and reverting the AI to random fire. It is invisible in a normal
playthrough (the AI still wins) — you have to watch *where* it shoots after a hit. Because
`nextShot`/`registerOutcome` are pure and take an injectable `random`, suspected sequences should be
replayed in a vitest file rather than hunted for in the UI. See `DEBUGGING.md`.

## Test-harness gotchas

- Measure layout from `window.innerWidth`, not the outer window: a maximized Chrome window is ~32px
  wider than its viewport. For desktop widths drive `page.setViewportSize(...)`, or request
  `outerWidth = desired + 32`.
- CDP `Emulation.clearDeviceMetricsOverride` does **not** reliably release a stuck emulated
  viewport. Recover by setting an explicit desktop viewport (e.g. 1600×1069) instead.
- At an emulated mobile viewport Chrome scales the page inside the window, so screen-space
  (xdotool-style) clicks miss the page. Dispatch mobile taps in page coordinates.
- If several tabs are open, the tab CDP controls may not be the visible one. Enumerate pages, close
  the extras, and `bringToFront()` the survivor before recording.

## Devin Secrets Needed

None — the app has no backend, accounts or credentials.
