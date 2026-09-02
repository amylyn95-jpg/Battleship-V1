# Battleship: Naval Command — Art Bible and Storyboards (S0)

Companion to `docs/PLAN.md`. Everything here describes intent; nothing is built yet.
Timings are maxima at default speed; the "Fast" toggle halves every number.

---

## 1. The picture in one paragraph **(plain English)**

Golden hour, open sea. You stand on the bridge wing of a WWII cruiser, slightly
above the deck, looking forward over the bow. Your fleet rides the swell to your left
and right, close enough to see gun barrels and smoke stacks. Three kilometres ahead,
the enemy fleet is a row of dark grey shapes in warm haze, occasionally lit by their
own muzzle flashes. Over the whole picture floats a clean, modern command-centre
overlay: your tactical grid, fleet status, and the battle log. When you click a cell,
the world answers.

---

## 2. Art direction rules

| Rule | Detail |
| --- | --- |
| Palette | Sea: deep teal-grey `#1f3640` → horizon `#6d7f86`. Sky: amber `#f2b46a` at the sun, through `#c9a27a`, to `#4d5f70` overhead. Hulls: haze grey `#5f6a70`, deck `#4a4f52`, rust accents `#7a4b32`. Fire: `#ffb347` → `#ff5a1f` → smoke `#2b2b2b`. |
| HUD palette | Near-black glass `rgba(8,12,16,0.72)`, cyan accent `#4fd1ff` (friendly), signal red `#ff3b30` (enemy / hit), amber `#ffb000` (alerts), off-white text `#e8ecef`. |
| Light | One key light (sun, 10° above horizon, front-left of the enemy line so silhouettes are backlit and your ships are three-quarter lit). HDRI ambient. No dynamic time of day. |
| Haze | Exponential fog from 800 m; enemy fleet sits at ~60 % fog. Fog density rises with tension. |
| Scale | Your ships 120-250 m long, deck ~8 m above water; camera at 18 m height. Grid cell on the ocean = 60 m so the 10×10 "battle box" is 600 m per side. |
| Camera | Fixed bridge view, 55° FOV, slight 1.5° slow drift (breathing). Event moves ≤ 1.2 s, ease `power2.inOut`, always return to the bridge pose. Disabled under reduced motion. |
| Typography | Display: a condensed geometric sans (variable woff2, CC0/OFL). Body: system UI stack. Grid coordinates monospace. |
| Motion language | Everything in the world moves with the sea. HUD elements never bounce; they slide 8 px and fade in 160 ms. |
| Readability first | The tactical grid never has anything drawn over it. World effects that align with the grid (splashes, fires) also appear as stamps on the 2D grid within the same beat. |

### 2.1 Making stylised CC0 hulls read as WWII

- Repaint every material to the grey/deck/rust triplet; kill saturated colours.
- Bolt on code-built parts: twin-barrel turrets (cylinder + box), lattice mast
  (thin cylinders), two funnels, a rangefinder box. Same parts on every hull so the
  fleet looks like one navy.
- Roughness 0.7-0.85, subtle grime via a tiled 512 KTX2 dirt texture in the
  ambient-occlusion slot.
- Silhouette matters more than detail: the camera never gets closer than 150 m.

---

## 3. FIRE — max 1.2 s

Trigger: player confirms a target cell.

| t (ms) | World | HUD | Audio |
| --- | --- | --- | --- |
| 0 | — | Grid cell gets the targeting lock ring (2 rotating brackets), cell dims | click |
| 120 | Nearest friendly turret slews 5-10° toward the bearing (0.25 s) | "FIRING" chip appears above grid | servo whine (low) |
| 400 | Muzzle flash: additive sprite 3 frames + point light 0.08 s; shock ring quad expands 0-30 m over 0.3 s; grey smoke burst 60 particles | screen edge flash 4 % white | gun report (`playFire`, deeper) |
| 400 | Camera: 0.6 s push-in 3 % toward the firing turret, then return | — | — |
| 450-1200 | Shell tracer: quadratic Bezier from muzzle to target cell centre, apex 120 m, 0.75 s, faint additive trail | lock ring pulses once mid-flight | rising whistle 0.7 s |
| 1200 | Hand off to MISS or HIT (they start at their own t=0) | — | — |

Player may hover other cells throughout; input to *fire* is locked until TURN.

---

## 4. MISS — max 1.0 s

| t (ms) | World | HUD | Audio |
| --- | --- | --- | --- |
| 0 | Water column: 40 spray particles up 25 m, cone; white foam splat decal 20 m | — | splash (`playMiss`, bigger body) |
| 80 | Ring wave drawn into the ocean decal channel, expands 0→60 m over 0.9 s, fades | grid cell stamps **MISS** (grey dot + small text), scales 1.2→1.0 | — |
| 300 | Column collapses; 20 mist particles drift downwind 0.7 s | Battle log: "C5 — miss." | — |
| 1000 | Done; foam decal fades over the next 6 s | — | — |

---

## 5. HIT — max 1.4 s

| t (ms) | World | HUD | Audio |
| --- | --- | --- | --- |
| 0 | Fireball at the enemy silhouette's segment: 3-sprite additive burst 0.4 s + point light; 30 debris streaks (instanced lines) on ballistic arcs | grid cell stamps **HIT** (red diamond) | explosion (`playHit`) |
| 0 | Chromatic-aberration pulse 0.25 s (Cinematic/Balanced only); camera shake 150 ms, 0.4° | screen edge flash 8 % red-orange | — |
| 150 | Persistent smoke column starts on that hull segment (8 particles/s, dark, rises 80 m, wind-sheared). Stays until game over | "DIRECT HIT" banner slides in 160 ms, stays 900 ms | — |
| 300 | Silhouette gets a glowing ember decal at the segment | Battle log: "C5 — direct hit on unknown ship." | crackle loop fades in |
| 1400 | Done | — | — |

If HIT is followed by SUNK, SUNK starts at 600 ms into HIT (overlap), total ≤ 3.5 s.

---

## 6. SUNK — max 3.5 s

| t (ms) | World | HUD | Audio |
| --- | --- | --- | --- |
| 0 | Camera: 1.2 s move toward the enemy line (pan 6°, push 8 %), holds, returns during 2400-3500 | grid: all ship cells switch to **wreck** stamp; ship silhouette in the enemy roster turns red | deep groan (`playSunk`) |
| 0-900 | Hull lists 25° toward the hit side (ease in) | "ENEMY CRUISER SUNK" banner | secondary explosion at 400 |
| 900-1800 | Bow (or stern, alternating) rises 12 m; waterline foam and a 3 m/s spray sheet | fleet status: enemy ships 4 → 3 | steam hiss |
| 1800-3000 | Slides under along its length; oil slick decal expands 0→90 m; 6 flotsam billboards spawn and bob (they sample the wave function) | Voss line if tension changed | bubbles, then quiet |
| 3000 | Silhouette mesh removed; slick + flotsam + one thin smoke wisp persist | Battle log entry | — |
| 3500 | Done | — | — |

The player's own ship sinking uses the same timeline on a friendly hull, with the
camera holding the bridge (no move) and a 1 s red vignette.

---

## 7. INCOMING — max 1.6 s

Sequence for the enemy's turn (starts after TURN(ai)):

| t (ms) | World | HUD | Audio |
| --- | --- | --- | --- |
| 0 | — | "ENEMY ANALYZING" chip with three-dot pulse (0.6-1.4 s, see PLAN §7) | low radar ping |
| A | Enemy line: 2-3 muzzle flashes on the horizon 60 ms apart; horizon fog brightens 10 % | chip flips to **INCOMING FIRE**, amber; target ring appears on the *player's* grid at the true cell | distant thuds, 300 ms later than the flash (sound delay) |
| A+500 | Shell whistle Doppler; tracer descends toward the cell | ring tightens | whistle |
| A+1100 | Impact: MISS beats (water column near the player fleet, 60 m off a hull) or HIT beats on the player's 3D ship segment (fireball, persistent smoke, list offset +3° per segment) | grid stamps result; fleet status updates | as MISS/HIT |
| A+1600 | TURN(human): lock rings clear; "YOUR TURN" chip | — | — |

Total time from the player's click to their next turn: 1.2 (FIRE) + 1.4 (HIT) +
~1.0 (ANALYZING) + 1.6 (INCOMING) ≈ 5.2 s worst case with a SUNK overlap; the
Director trims ANALYZING to keep ≤ 5.0 s. Fast toggle: ≈ 2.5 s.

---

## 8. Ambient beats

### 8.1 Aircraft (cosmetic)

- Every 40-90 s (`critical`: 20-45 s). Two or three propeller silhouettes in a V,
  400 m altitude, crossing 1200 m ahead from one side to the other in 9 s. Engine
  drone pans left→right, ducked under any event SFX.
- Code-built model: fuselage box, tapered wings, tail, a semi-transparent spinning
  disc for the propeller. Cinematic tier adds short contrails.
- Never blocks input and never triggers a camera move.

### 8.2 Weather escalation (driven by tension)

| Tension | Sea state | Fog start | Sky | Extras |
| --- | --- | --- | --- | --- |
| `calm` | 0.4 (long swell only) | 900 m | clear golden | gulls occasionally (audio only) |
| `engaged` | 0.7 (adds chop) | 650 m | high cloud sprite layer fades in 20 % | wind gust audio, music layer 2 |
| `critical` | 1.0 (spray off crests) | 450 m | sky darkens 15 %, cloud layer 45 % | lightning flash every 25-60 s (no bolt on Performance); HUD alert red pulses |

Transitions lerp over 6-8 s so nothing pops.

---

## 9. HUD layout (1440×900 reference, desktop only)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ NAVAL COMMAND        turn banner / event chip                 ⚙ 🔊 ♫    │
│                                                                          │
│                     [ 3D bridge view fills the frame ]                   │
│                                                                          │
│ ┌ FLEET STATUS ─┐                                    ┌ ENEMY FLEET ────┐ │
│ │ ▮▮▮▮▮ Carrier │                                    │ ■■■■■ unknown   │ │
│ │ ▮▮▮▯ Battlesh.│                                    │ ...             │ │
│ └───────────────┘                                    └─────────────────┘ │
│ ┌ TACTICAL GRID (enemy waters) ──┐   ┌ BATTLE LOG ─────────────────────┐ │
│ │  A B C D E F G H I J           │   │ 14  C5 direct hit               │ │
│ │ 1 · · · · · · · · · ·          │   │ 13  Enemy fires — B2 miss       │ │
│ │ ...                            │   │ 12  Voss: "Steady. Hold course."│ │
│ └────────────────────────────────┘   └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

- The tactical grid is bottom-left, 380 px, glass panel, always fully opaque cells.
- The player's own grid is a smaller secondary panel toggled with a tab (default
  shows the enemy waters during battle, own waters during INCOMING for 1.6 s).
- The 3D world projects the same 10×10 lattice as faint lines on the water inside
  the "battle box" at Cinematic/Balanced; splashes/fires/wrecks appear at those
  cells, so the two views agree by construction.

---

## 10. Screens

| Screen | Content |
| --- | --- |
| Command | Title over the live ocean (one hull, calm sea), difficulty cards Recruit / Tactical / Admiral with one-line descriptions, START, Settings (quality tier, SFX, music, Fast, reduced motion respects OS) |
| Deployment | Own grid large and centred, ship tray, drag / click to place, **R** rotate, Random, Reset, DEPLOY. Placing a ship moves its 3D hull into formation |
| Battle | as §9 |
| Debrief | Stats (shots, accuracy, ships lost, turns), rating CADET / LIEUTENANT / COMMANDER / ADMIRAL from accuracy and ships remaining, enemy fleet revealed on the grid, REMATCH / NEW BATTLE / CHANGE DIFFICULTY. Music: debrief track |

---

## 11. Accessibility notes for art

- Hit/miss are distinguished by shape (diamond vs dot) and text, not only colour.
- HUD text ≥ 14 px, contrast ≥ 4.5:1 on the glass panels (panel alpha chosen for
  that against the brightest sky).
- Focus ring: 2 px cyan outer glow on grid cells; arrow keys move, Enter fires.
- Reduced motion: no camera moves, no shake, no chromatic pulse, particle cap 800,
  banners fade only.
