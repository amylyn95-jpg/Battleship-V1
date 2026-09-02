# Battleship: Naval Command — Program Plan (S0)

Status: **draft for approval**. Nothing in this document has been built yet. The
companion document `docs/ART.md` holds the storyboards and art bible.

This plan turns the current Battleship-V1 (a flat 2D grid game) into a browser game
where the player stands on the bridge of a WWII warship in a live naval battle,
without changing the rules of Battleship. The 10x10 grid stays the truth; the 3D
world only shows the consequences of what happens on the grid.

Sections marked **(plain English)** are written for a non-engineer reader.

---

## 0. Read this first: what I found in the repo that changes the brief

1. **The repo hosts two apps.** Besides Battleship, `devin-sales-academy/` is a
   separate Next.js app published to the same GitHub Pages site under `/academy/`.
   Nothing in this program touches it, but every session must keep its build
   and its `/academy/` URL working. (The blueprint's lint/test commands run it too.)
2. **Pages base path.** The brief says the deploy runs with `GITHUB_PAGES=true`. It
   actually uses `PAGES_BASE=/Battleship-V1/` (see `.github/workflows/deploy.yml` and
   `vite.config.ts`). Same idea; I will keep the existing variable.
3. **No realistic WWII warship models exist under a CC0 licence that I could verify.**
   Every realistic WWII hull I found (Sketchfab, Poly Pizza) is CC-BY, not CC0. The
   CC0 hulls that do exist (Kenney, Quaternius) are low-poly and stylised, not WWII.
   Section 3 explains the options; this is the one genuine open question for you
   (section 12). It does not block S1.
4. **No CC0 propeller aircraft models were verifiable either.** Aircraft are distant
   silhouettes, so I plan to build them in code from a few boxes and a spinning
   disc. This is cheap and looks right at that distance.
5. **Node/Vite:** the project runs on Vite 6, no `.nvmrc`; CI uses Node 22. Kept.

---

## 1. Confirmed stack and deviations

| Layer | Choice | Status |
| --- | --- | --- |
| UI framework | React 18 + TypeScript + Vite 6 | as briefed |
| 3D | three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` | as briefed |
| Timelines | GSAP (core only, no paid plugins) | as briefed |
| State | Zustand | as briefed |
| Audio | Howler.js for the music bed + existing procedural Web Audio SFX (`src/sound.ts`) | as briefed |
| Tests | Vitest (unit), Playwright (e2e) | as briefed, both already in the repo |
| Lint | ESLint 9 flat config, adding `eslint-plugin-react-hooks` | small addition |
| Hosting | GitHub Pages via the existing workflow | as briefed |
| Asset tooling | `gltf-transform` CLI (Draco + KTX2) run once at asset-import time, output committed | tooling only |

Deviations, with reasons:

- **Post-processing is capped at three effects** (Bloom, Vignette, ChromaticAberration
  on hit pulses). No SSAO, no SSR, no depth-of-field. They are the fastest way to
  miss 60 fps on an M1 and the scene does not need them (open sea, no occluders).
- **Ocean reflections are faked** (sky-colour Fresnel + specular sun streak + HDRI
  environment map), not planar/screen-space reflections. See section 5.
- **React 18, not 19.** `@react-three/fiber` v8 targets React 18; the sales academy
  uses React 19 but is a separate package, so there is no conflict.
- **Playwright mobile project is dropped** (`Pixel 5` in `playwright.config.ts`)
  because the product is desktop-only.
- Everything else is exactly as briefed. No physics engine; no WebGPU; no raw WebGL.

---

## 2. Architecture and migration path

### 2.1 Architecture walkthrough **(plain English)**

Think of the game as five rooms connected by a one-way corridor:

```
 player click            typed GameEvent stream
      │                          │
      ▼                          ▼
 ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────────────┐
 │  HUD    │───▶│  Store  │───▶│ Director │───▶│  Scene (3D world)    │
 │ (React) │    │(Zustand)│    │  (GSAP)  │    │  camera, FX, audio   │
 └─────────┘    └────┬────┘    └──────────┘    └─────────────────────┘
      ▲              │
      │              ▼
      │         ┌─────────┐   ┌─────────┐
      └─────────│ Engine  │   │   AI    │   pure rules, no graphics
                └─────────┘   └─────────┘
```

- **Engine** is the rulebook: where ships are, whether a shot hit, who has won. It
  is plain TypeScript with no graphics. It already exists in V1 (`board.ts`,
  `game.ts`, `session.ts`) and is fully unit-tested. It moves, it does not change.
- **AI** is the enemy commander. It only ever sees the results of its own shots.
  It also already exists (`ai.ts`) and stays.
- **Store** is the single notebook everyone reads from. When the player fires, the
  store asks the engine what happened, writes the answer down, and shouts a short
  typed message (a *GameEvent*, e.g. `HIT at C5 on Cruiser`).
- **Director** listens for those shouts and turns each into a short, timed
  sequence: "flash the guns, fly the shell, splash, stamp MISS". It knows how long
  each sequence is allowed to take and never lets one run long.
- **Scene** is the 3D world. It draws what the Director tells it to. It is not
  allowed to change the game state, so a rendering bug can never corrupt a game.
- **HUD** is the flat overlay: the tactical grid you click, the fleet status, the
  battle log, Commander Voss's messages, settings. It reads the store and sends
  clicks back to it.

Because the Scene is one-way, the game is fully playable with the 3D world
switched off (`?render=off`). That is how tests run in CI and how the game
degrades on a machine with no usable graphics.

### 2.2 Target folder layout

```
src/
  engine/     board.ts game.ts fleet.ts types.ts     (ported from V1, pure TS)
  ai/         ai.ts                                   (ported from V1, pure TS)
  store/      gameStore.ts events.ts tension.ts settings.ts persistence.ts
  director/   director.ts timelines/*.ts budgets.ts
  scene/      Scene.tsx Ocean/ Sky/ Fleet/ EnemyHorizon/ Projectiles/ Particles/ Aircraft/ Weather/ CameraRig/ NullScene.tsx
  hud/        App.tsx CommandScreen.tsx Deployment.tsx Battle/ Debrief.tsx components/
  quality/    detect.ts tiers.ts
  audio/      sfx.ts (V1 sound.ts) music.ts
  assets/     manifest.ts (paths, licences, byte sizes)
public/models/  *.glb (Draco)      public/textures/ *.ktx2   public/audio/ *.ogg
tests/          vitest specs      e2e/  playwright specs
```

### 2.3 Migration path from V1 (vanilla TS DOM) to React + R3F

| V1 file | Fate | Notes |
| --- | --- | --- |
| `src/types.ts` | **keep** → `src/engine/types.ts` | drop `Mode` type ("classic" only); rename `Difficulty` values `easy/normal/hard` → `recruit/tactical/admiral` with a one-line saved-game migration |
| `src/board.ts` | **keep** → `src/engine/board.ts` | unchanged |
| `src/game.ts` | **keep** → `src/engine/game.ts` | delete `salvoSize` |
| `src/session.ts` | **keep, trimmed** → `src/engine/session.ts` | delete `toggleTarget`, `fillTargets`, `playerSalvo`, `aiSalvo`, `chooseSalvo`, `pendingTargets`, `mode`; keep `playerFire`, `aiFire`, `startBattle`, serialise/deserialise (storage key bumps to `v2`) |
| `src/ai.ts` | **keep** → `src/ai/ai.ts` | unchanged in S1; Admiral tuning in S1 (section 7) |
| `src/sound.ts` | **keep** → `src/audio/sfx.ts` | add `INCOMING` whistle, shell-flight, aircraft pass; separate SFX/music mute keys |
| `src/ui.ts` | **rewrite** as React components | grid painting becomes `<TacticalGrid>`; hull-segment logic (`hull-bow/mid/stern`) is kept as a pure function and its test `tests/hull.test.ts` carries over |
| `src/main.ts` | **rewrite** as store + director | the 500-line DOM controller becomes Zustand actions plus Director timelines; `AI_THINK_MS` becomes the `ENEMY ANALYZING` beat |
| `src/styles.css` | **rewrite** | new HUD design system (see ART.md); keep the CSS-custom-property approach |
| `index.html` | **rewrite** | single `<div id="root">` + canvas mount |
| `tests/salvo.test.ts` | **delete** | Salvo mode is removed |
| `tests/board|session|ai|hull.test.ts` | **keep** | import paths change only; the salvo cases inside `session.test.ts` are removed |
| `e2e/game.spec.ts` | **rewrite** | same scenarios (placement, information leak, win, refresh persistence) against the new HUD with `?render=off` |
| `.agents/skills/testing-battleship-ui/SKILL.md` | **update in S1** | new selectors, `?render=off`, the new difficulty names |
| `BUGS.md`, `DEBUGGING.md` | **keep / extend** | `DEBUGGING.md` referenced by the skill does not exist yet; S1 creates it |

Salvo and the shot clock are removed outright rather than kept dormant: the
`pendingTargets`/`mode` fields leak into the session type, the AI (`chooseSalvo`) and
the save format, so leaving them costs real complexity. Removal is a pure deletion
with the test suite proving nothing else broke.

### 2.4 GameEvent contract (the one interface everything depends on)

```ts
type GameEvent =
  | { type: "FIRE";     by: Player; at: Coord; seq: number }
  | { type: "MISS";     by: Player; at: Coord; seq: number }
  | { type: "HIT";      by: Player; at: Coord; ship: ShipId; segment: number; seq: number }
  | { type: "SUNK";     by: Player; ship: ShipId; cells: Coord[]; seq: number }
  | { type: "INCOMING"; at: Coord; seq: number }              // enemy shell announced before it lands
  | { type: "TURN";     player: Player; seq: number }
  | { type: "TENSION_CHANGE"; from: Tension; to: Tension; seq: number }
  | { type: "GAME_OVER"; winner: Player; stats: Stats; seq: number };
```

One player shot emits `FIRE → (MISS | HIT [→ SUNK]) → TURN(ai)`; the enemy's reply
emits `INCOMING → FIRE(ai) → (MISS | HIT [→ SUNK]) → TURN(human)`. Events are
appended to the store; the Director consumes them in `seq` order.

---

## 3. Asset plan

### 3.1 What I verified (links opened on 2026-09-02, licence text read on the page)

| Asset | Source | Licence | Use | Size |
| --- | --- | --- | --- | --- |
| Kenney **Watercraft Kit** (40+ glTF boats/ships) | https://kenney-assets.itch.io/watercraft-kit (also https://kenney.nl/assets/watercraft-kit) | CC0 1.0 (stated on the itch page) | hull bases for the five ships, restyled with naval-grey materials | 1.7 MB zip; ~300-600 KB per hull after Draco |
| Quaternius **Ship** | https://poly.pizza/m/mEQj2wZ3GC | Public Domain (CC0), stated on page | alternative carrier/battleship hull | <500 KB |
| Poly Haven **Kloofendal 48d Partly Cloudy (Pure Sky)** HDRI | https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | CC0 (site-wide, https://polyhaven.com/license) | golden-hour sky + environment lighting; 1K HDR for lighting, 2K KTX2 for the visible dome | ~1.5 MB |
| Poly Haven **Qwantani Sunset** HDRI | https://polyhaven.com/a/qwantani_sunset | CC0 | fallback sky if Kloofendal reads too "midday" | ~1.5 MB |
| "**Open Warfare**" by ruskerdax | https://opengameart.org/content/open-warfare | CC0 (stated in attribution notice) | `engaged`/`critical` music layer | 3.7 MB mp3 → ~2.5 MB ogg |
| "**Sirens in Darkness**" by The Cynic Project | https://opengameart.org/content/sirens-in-darkness | CC0 (credit requested, not required) | `calm` music layer (command screen, early battle) | 7 MB mp3 → ~3 MB ogg, streamed after first paint |
| "**Some Militaristic Tune**" by Spring Spring | https://opengameart.org/content/some-militaristic-tune | CC0 | debrief / victory | 4.6 MB ogg, lazy |

All SFX remain **procedural** (existing `src/sound.ts`, extended). I looked at
Freesound naval-gun recordings; the best ones (e.g. https://freesound.org/people/qubodup/sounds/184728/)
say "cc0/public domain" in the description but the page footer points to CC-BY
profile terms, so I am not relying on them.

### 3.2 What I looked for and rejected

| Candidate | Why not |
| --- | --- |
| Poly Pizza "low poly battleship" (Catalano), "Simple Battleship" (de Rivaz) | CC-BY, not CC0 |
| Sketchfab "Battleship Yamato" (maya2023, 168k tris), "Dunkerque" (KojfDiscord, 263k tris) | CC-BY; also far too heavy for the budget |
| Sketchfab WWII destroyers (Fumitzuki, Daring, etc.) | CC-BY or not downloadable; 1-2M triangles |
| Quaternius "Ships Pack" | pirate/sail ships, FBX/OBJ only |
| Poly Pizza aircraft | almost all "Poly by Google" = CC-BY |
| Kenney kits | no aircraft kit; Space Kit is sci-fi |

### 3.3 Decision needed **(plain English)**

There is a tension between two things you asked for: *WWII-realistic hulls* and
*CC0-only assets*. I could not find both in one model. Three ways forward:

| Option | Look | Licence | Download | Effort |
| --- | --- | --- | --- | --- |
| **A. Stylised CC0 hulls (Kenney/Quaternius), restyled** grey, with code-built turrets, masts and smoke stacks bolted on | "clean model-kit" WWII; reads as warships at bridge distance, not photoreal | CC0 | smallest | low |
| **B. Realistic CC-BY hulls from Sketchfab**, decimated to <20k tris each, credited in README | closest to the brief's "WWII realistic" | CC-BY (attribution required; allowed for a public demo) | 3-6 MB after Draco | medium (decimation + retexture) |
| **C. Fully code-built hulls** (box hull + superstructure + turrets from primitives, procedural rust/grey material) | consistent, deliberately stylised; weakest close-up | none needed | ~0 | medium |

**My recommendation: A, with C as the guaranteed fallback.** The player's fleet is
seen from a fixed bridge camera at medium distance and the enemy fleet is a
silhouette in haze, so lighting, water, smoke and scale sell "WWII" far more than
hull polygon detail does. S2's vertical slice ships with one Option A hull; if you
see it and want more realism, S3 can switch to Option B for the two largest ships
only (carrier, battleship) with attribution in README, without changing any code
outside `assets/manifest.ts`.

### 3.4 Download budget (initial ≤ 12 MB, hard cap enforced by a CI size check)

| Bundle | Budget | When |
| --- | --- | --- |
| JS (React, R3F, three, drei, postprocessing, GSAP, Zustand, Howler) | ≤ 900 KB gzip | first load |
| HUD CSS + fonts (system stack + one variable display font, woff2) | ≤ 120 KB | first load |
| Sky HDRI 1K (lighting) + 2K KTX2 dome | ≤ 1.6 MB | first load (command screen background) |
| Ocean normal/foam textures (2× 1K KTX2) | ≤ 700 KB | first load |
| Particle sprite atlas (smoke, fire, spray, flash, 1× 1K KTX2) | ≤ 350 KB | first load |
| `calm` music layer (ogg, streamed) | ≤ 3 MB | starts streaming on command screen |
| **Initial total** | **≈ 6.7 MB** | leaves headroom under 12 MB |
| Ship glTF ×5 (Draco) + enemy silhouette LOD ×5 | ≤ 3 MB | lazy, after command screen |
| `engaged`/`critical` and debrief music | ≤ 5.5 MB | lazy, on first `TENSION_CHANGE` / `GAME_OVER` |

Asset import is a documented script (`npm run assets:build`) that runs
`gltf-transform optimize --compress draco --texture-compress ktx2` and writes
`src/assets/manifest.ts` with licence, source URL and byte size for every file. The
README "Credits" table is generated from that manifest so attribution can never
drift from what ships.

---

## 4. Storyboards

See `docs/ART.md` sections 3-7 for FIRE / MISS / HIT / SUNK / INCOMING beat sheets
with timings, plus the ambient aircraft and weather beats.

---

## 5. Ocean and floating

### 5.1 Wave function (shared by GPU and CPU)

A sum of four Gerstner-style waves, defined once in a tiny TS module and mirrored
verbatim in GLSL:

```
h(x, z, t) = Σ_i  A_i · sin( dot(D_i, (x,z)) · k_i  +  t · ω_i  + φ_i )
  i = 1..4     (two long swells 40-60 m, one 12 m chop, one 4 m ripple)
```

- `A_i, k_i, ω_i, D_i` are uniforms driven by **sea state** (0-1) from the tension
  system: `calm` → A scaled 0.4, `engaged` → 0.7, `critical` → 1.0 plus wind-aligned
  direction jitter. Transitions lerp over 6 s so the sea "builds".
- The same four terms are evaluated on the CPU (`waves.ts`, unit-tested) so hull
  positions match the visible surface exactly. This is why there is no physics engine.

### 5.2 How hulls float

Each ship samples the wave height at **three points** (bow, stern, one beam point)
every frame → position y = mean height; pitch = atan(bow - stern / length);
roll = atan(beam - centre / half-beam). Angles are clamped (pitch ≤ 4°, roll ≤ 6°)
and low-pass filtered so a 200 m carrier does not twitch on a ripple. The three
samples are precomputed per ship length so the cost is ~12 sin() per ship per frame.

Damage adds a **static list offset** (per hit segment) and the SUNK timeline drives
the hull through list → rise → slide, after which the mesh is removed and the
oil-slick decal + flotsam take over.

### 5.3 Rendering the surface

- One `PlaneGeometry` in front of the camera, vertex-displaced in the shader,
  fading into a flat far plane at the horizon (fog hides the seam).
- Fragment: normals from analytic derivatives of the same wave sum (no normal-map
  fetch on Performance tier), a tiled 1K normal map for micro-detail on higher tiers,
  Fresnel blend between deep-water colour and the sky HDRI, a Blinn specular streak
  for the sun, foam mask where `h` exceeds a threshold (crests) plus a **splash
  decal channel** (a small render target the Director draws ring waves and oil slicks
  into, sampled in the ocean fragment shader — this is how grid results "live" on the
  water).
- Reflections are **environment-map only**: no planar mirror pass. At bridge
  height and golden hour the sun streak + sky Fresnel is what the eye expects, and it
  saves a full extra scene draw.

### 5.4 Cost per tier

| Tier | Ocean mesh | Normal map | Foam | Decal RT | Approx. GPU cost |
| --- | --- | --- | --- | --- | --- |
| Cinematic | 256×256 verts | yes | yes | 1024² | ~2.5 ms on M1 |
| Balanced (default) | 160×160 | yes | yes | 512² | ~1.5 ms |
| Performance | 96×96 | no (analytic only) | crest-only | 256² | ~0.6 ms on Iris Xe |

---

## 6. Quality tiers

### 6.1 Detection

1. On first load, read `navigator.hardwareConcurrency`, `devicePixelRatio`, and the
   WebGL `UNMASKED_RENDERER_WEBGL` string (Apple / NVIDIA / AMD → start **Balanced**;
   Intel / Mesa / SwiftShader / unknown → start **Performance**).
2. During the command screen (where the ocean is already rendering) drei's
   `PerformanceMonitor` watches 2 s of frames: sustained >58 fps at Balanced promotes
   to Cinematic; <45 fps demotes one tier. Demotion is allowed at any time; promotion
   only between phases, so nothing pops mid-cinematic.
3. The chosen tier is stored (`battleship.quality.v1`) and shown in Settings with a
   manual override that disables auto-detection. `prefers-reduced-motion` forces the
   Reduced-motion column regardless of tier.

### 6.2 What each tier does

| Feature | Cinematic | Balanced (default, M1 target 60 fps) | Performance (Intel ≥30 fps) | Reduced motion |
| --- | --- | --- | --- | --- |
| Render scale | 1.0 × DPR (cap 2) | DPR cap 1.5 | DPR cap 1.0 | as tier |
| Ocean mesh / normal map | 256² / yes | 160² / yes | 96² / analytic | as tier |
| Shadows | 2048 map, ships only | 1024, ships only | off | as tier |
| Post-FX | Bloom + Vignette + chromatic pulse | Bloom + Vignette | none | none |
| Particles (max live) | 6000 | 3000 | 1000 | 800 |
| Persistent smoke columns | all hit segments | all | 3 most recent | 3 |
| Enemy horizon fleet | full LOD1 meshes | billboards + LOD1 on SUNK | billboards | billboards |
| Aircraft | meshes + contrails | meshes | silhouettes, half frequency | off |
| Weather: fog | volumetric-ish (2-layer) | 1-layer fog + haze sprite | fog only | fog only |
| Weather: lightning | flash + bolt sprite | flash | flash | off |
| Camera event moves | yes | yes | yes | **no** |
| Screen shake | 150 ms | 150 ms | 100 ms | **no** |
| Antialiasing | MSAA 4× | MSAA 2× | none (FXAA off) | as tier |

---

## 7. AI strategy per difficulty

V1's `ai.ts` already implements a clean hunt → target → axis → finish state machine
with a parity lattice and a placement-density map, and it is pure (injectable
`random`), which is exactly what we need. Changes:

| Difficulty | V1 name | Hunt | Target | Change from V1 |
| --- | --- | --- | --- | --- |
| **Recruit** | easy | uniform random over untried cells | *local finish*: after a hit, probes the four neighbours until the ship sinks, but never locks an axis and forgets wounded ships once distracted | **new**: V1 "easy" never follows up, which feels broken rather than easy |
| **Tactical** | normal | parity lattice with stride = smallest remaining ship | full hunt → hit → orient → destroy (existing) | none |
| **Admiral** | hard | placement-density map (existing) | density with active-hit weight 10 (existing) + **aggressive target mode**: when two wounded ships are known it finishes the one with the fewest legal completions first, and ends look beyond misses on the far side | tuning only |

**Tension without cheating.** The AI never reads the player's board; the only
inputs are its own shot results (enforced by the type of `AiState` and by a test
that runs 500 games with a board proxy that throws if any non-shot field is read).
Drama comes from pacing, not information:

- The `ENEMY ANALYZING` beat lasts 0.6-1.4 s scaled by how "close" the AI's choice
  was (density spread), so a decisive Admiral shot lands fast and a coin-flip lingers.
- `INCOMING` is announced 0.5 s before impact; the HUD shows a target ring on the
  *player's* grid at the true cell, so the player sees it coming and cannot do anything.
- Commander Voss lines are picked from a small table keyed on tension and event
  (never more than one message per 3 turns).

**Tests** (extending `tests/ai.test.ts`): 500 random games per difficulty must
finish with mean shots inside a band — Recruit 78-95, Tactical 52-66, Admiral 40-52
(bands calibrated in S1 from 5000-game runs and then frozen); strict ordering
Admiral < Tactical < Recruit; never a repeated shot; the existing regression cases
for touching ships stay.

---

## 8. Testing strategy

| Layer | Tool | What | Runs in CI |
| --- | --- | --- | --- |
| Engine | Vitest | V1's `board/game/session/hull` tests, minus salvo cases | yes |
| AI | Vitest | V1 tests + 500-game bands + "sees only shot history" proxy test | yes |
| Store | Vitest | every action emits the exact GameEvent sequence; tension thresholds; save/load round-trip incl. v1→v2 migration | yes |
| Director | Vitest with fake timers and a mocked GSAP timeline | events scheduled in `seq` order; each event's total duration ≤ budget; "Fast" halves budgets; player input is never blocked; reduced-motion removes camera tracks | yes |
| Waves | Vitest | CPU wave sum equals a reference table; hull sample math | yes |
| HUD | Playwright (`?render=off`) | Command → Deploy → Battle → Debrief; information-leak check (no enemy ship revealed before game over); refresh persistence; keyboard grid navigation; settings toggles | yes |
| 3D scene | manual + one Playwright smoke test with `--use-gl=swiftshader` that only asserts the canvas mounted and no console errors | smoke only |
| Performance | manual checklist per session on two GPU classes, numbers recorded in `DEBUGGING.md`; `stats.js` overlay behind `?stats=1` | no |
| Bundle size | CI step fails if initial payload > 12 MB or JS gzip > 900 KB | yes |

**`?render=off`:** `<Scene>` is swapped for `<NullScene>` which mounts nothing and
still subscribes to the Director so timelines run (at 0 duration) and the HUD reaches
the same states. Playwright always uses it. The e2e grid selectors stay DOM-based
(`role="grid"`, `aria-label="C5"`, `data-row/col`, state classes) so the skill file's
approach keeps working.

**Carry-over:** `tests/board|ai|hull|session.test.ts` move with path changes only;
`tests/salvo.test.ts` is deleted with the feature; `e2e/game.spec.ts` is rewritten
against the new HUD but keeps the same scenario list.

---

## 9. Risks (likelihood × impact, highest first)

| # | Risk | L | I | Mitigation | Fallback |
| --- | --- | --- | --- | --- | --- |
| 1 | Ocean shader + post-FX miss 60 fps on M1 at Balanced | M | H | S2 is dedicated to hitting the number before any fleet work; ocean mesh and DPR are the first knobs | ship Balanced with Bloom off and 128² mesh; keep Cinematic as opt-in |
| 2 | CC0 hull models look "toy" against the realistic brief | H | M | restyle materials, bolt on code-built turrets/masts, rely on lighting/smoke/haze (ART.md §2) | Option B (CC-BY realistic) for the two big ships — needs your OK on attribution |
| 3 | Integrated Intel <30 fps even at Performance | M | M | Performance tier has no post-FX, analytic normals, billboards only | auto-fallback to `render=off` HUD-only mode with a message |
| 4 | Safari WebGL2 quirks (KTX2/Basis transcoder, `OES_texture_float_linear`, audio autoplay) | M | M | test Safari in S2; use `drei` KTX2Loader with the Basis transcoder; float RT only where supported; music starts on first click | PNG texture fallback (+1.5 MB); halve decal RT |
| 5 | Particle load on HIT/SUNK causes frame spikes | M | M | pooled `InstancedMesh` particles, fixed caps per tier, no per-frame allocation | drop debris pass first, then persistent smoke count |
| 6 | Director timelines overrun the 5 s turn budget | L | H | budgets are constants tested in Vitest; the Director hard-kills any timeline at budget+50 ms | "Fast" toggle default-on under Performance |
| 7 | GitHub Pages + 12 MB assets: slow first paint, no Brotli control | M | L | assets Draco/KTX2/ogg, lazy ship models, HDRI 1K for lighting; Pages already serves gzip | if TTFB is bad, move to Vercel (same static output, one workflow change) |
| 8 | React migration breaks save-game compatibility | L | L | storage key bump to `v2` with a migration from v1 classic saves; v1 salvo saves are discarded with a friendly message | — |
| 9 | Bundle grows past 900 KB gzip (three + drei + postprocessing) | M | L | import only used drei components; tree-shake postprocessing; CI size gate | lazy-load the Scene chunk after the command screen |
| 10 | Breaking `/academy/` on the shared Pages site | L | M | do not touch `devin-sales-academy/`; keep its build in CI | revert the workflow step |

---

## 10. Session program and gates

| Session | Deliverable | What you will see at the gate |
| --- | --- | --- |
| **S0** (this) | `docs/PLAN.md`, `docs/ART.md` | these two documents → **approve / amend** |
| **S1** | React + R3F shell; engine/AI ported with tests; Zustand store + GameEvents; full HUD (command, deployment, battle grid, log, Voss, debrief); `?render=off`; Playwright rewritten; Salvo removed; deployed to Pages | a fully playable **2D** game with the new HUD skin over a flat sea-blue backdrop. Same rules as today, new look, three difficulty names. |
| **S2** | Ocean shader, sky, lighting, post-FX, one CC0 hull bobbing correctly, tier detection + manual override, fps numbers on M1 + Intel in `DEBUGGING.md` | the **bridge view**: real water at golden hour with one grey warship riding the swell. Command screen has this behind it. → **approve the look** (and pick Option A/B/C for hulls) |
| **S3** | Five player ships in formation, enemy silhouettes on the horizon, deployment phase drives 3D positions, damage states (smoke, list) | placing ships on the grid moves real ships on the water; enemy fleet visible in haze |
| **S4** | FIRE / MISS / HIT / SUNK / INCOMING cinematics, camera moves, procedural SFX hooked to Director, Fast toggle | the battle: guns fire, shells arc, splashes, fireballs, ships sink |
| **S5** | Aircraft, weather escalation, music layers, tension system wired end to end, debrief with rating | the full 5-minute demo experience |
| **S6** | Hardening: a11y pass, reduced-motion, Playwright coverage, README credits, `ART.md`/`DEBUGGING.md` final, verification on two GPU classes | production build you can demo |

**If compressed to 5 sessions:** merge S5 into S4 (cinematics + aircraft/weather/
music together — the Director already owns them all) and move the tension system into
S3. S6 stays separate; hardening merged into a feature session always gets cut.

Each session ends with one PR, a Pages preview URL, and a `DEBUGGING.md` update.

---

## 11. Things I would intentionally simplify

| Simplification | Why | Visual cost |
| --- | --- | --- |
| No planar/SSR water reflections | biggest single fps saver | ships do not mirror in the water; the sun streak and sky tint still do |
| Enemy fleet as billboards until SUNK (Balanced and below) | five extra hulls at 3 km add nothing visible through haze | none at default tier; Cinematic uses meshes |
| Shell arcs as a single glowing tracer, not a modelled shell | a 40 cm shell is sub-pixel at this distance | none |
| Persistent smoke capped at 3 columns on Performance | particle budget | a badly damaged ship on a weak GPU shows fewer columns |
| One time of day, baked HDRI lighting | no dynamic sun = no shadow cascades | none; it is the brief |
| Aircraft as code-built silhouettes | no verified CC0 models | fine at distance; weak if we ever want a close flyby |
| Damage as decals + smoke, not mesh deformation | mesh damage needs per-model authoring | hits look like fires/scorch, not holes |
| Bloom + Vignette only | each extra pass costs ~1 ms on Intel | no DoF, no SSAO |

---

## 12. Open questions (only what blocks S1 or the S2 gate)

1. **Hull licence (blocks the S2 look gate, not S1):** Are CC-BY realistic models with
   README attribution acceptable if the CC0 stylised hulls look too "toy"? Default if
   unanswered: Option A (CC0 stylised, restyled) with Option C fallback, per §3.3.
2. **Difficulty rename (S1):** OK to rename Easy/Normal/Hard → Recruit/Tactical/Admiral
   in the UI and saved games, as the brief's game-flow section implies? Default: yes.
3. **Old saved games (S1):** In-progress *Salvo* games saved in players' browsers
   cannot be resumed after Salvo is removed. Default: discard them with a one-line
   notice; Classic saves migrate.

Decisions I am making on your behalf that you might disagree with are listed in
sections 1 (deviations), 3.3 (hull option A), 7 (Recruit now follows up on hits),
and 11 (simplifications).
