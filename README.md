# Battleship — Tactical Fleet Command

Battleship is a polished, browser-based fleet battle against an opponent that
adapts its search at higher difficulty levels. It is a static client-side game:
there is no account, server, or backend, and game progress is saved only in your
browser.

## Play online

Live game: **https://amylyn95-jpg.github.io/Battleship-V1/**

## How to play

The game has four screens:

1. **Command** — choose a difficulty and engagement mode, then select
   **DEPLOY FLEET**.
2. **Deploy** — place the Carrier, Battleship, Cruiser, Submarine, and
   Destroyer. Click a ship and a square, press **R** to rotate, drag a ship
   from the dock onto the board, or use **Random fleet**.
3. **Battle** — take turns firing at the enemy waters. Coordinate labels run
   from A–J across the top and 1–10 down the side. Your fleet shows its damage;
   the enemy fleet hides partial damage until the battle ends.
4. **Debrief** — review the result, statistics, rating, and the revealed enemy
   fleet. Choose **REMATCH** to keep the same settings or **NEW BATTLE** /
   **CHANGE DIFFICULTY** to return to command.

In **Classic** mode, each side fires one shot per turn and every result is
shown immediately. In **Salvo** mode, you select one target per surviving ship
and fire the volley together. A 20-second shot clock fills any missing targets
automatically when it expires, and the enemy's partial results stay hidden until
a ship sinks.

### Controls and accessibility

- Mouse or touch: click a square to place or fire.
- Keyboard: use arrow keys to move between squares, **Enter** or **Space** to
  activate the focused square, and **R** to rotate a ship during deployment.
- Drag and drop: drag a ship from the deployment dock onto the desired square.
- Sound: use the sound button on the command screen to mute or restore effects.
- Reduced motion: when the browser requests reduced motion, animated effects
  become still or disappear while all game actions remain available.
- Refreshing during a battle restores the saved match and returns it to play.

## Opponent difficulty

The opponent never reads your ship layout. It only learns from the results of
its own shots.

| Difficulty | What it does |
| --- | --- |
| **Recruit** | Fires at a random square it has not tried before. It does not chase a hit. |
| **Tactical** | Searches in a regular pattern, then follows a hit along the ship's likely direction until the ship is found. |
| **Admiral** | Uses the same follow-up search, but first scores each possible square by how many legal ship placements could cover it. It chooses the most promising square. |

## Development

Install the tools once, then run commands from the repository folder:

```bash
npm install
npm run dev        # start the local game at http://localhost:5173/
npm run lint       # check code style
npm run typecheck  # check TypeScript types
npm test           # run unit and AI tests
npm run e2e        # run browser tests on desktop and mobile
npm run build      # create the production files in dist/
```

The unit tests check the game rules, session saving, statistics, audio/effect
helpers, and opponent decisions. The browser tests open the real game and check
the screens and interactions, including reloads and reduced-motion play.

## Project layout

| Location | Purpose |
| --- | --- |
| `index.html` / `src/styles.css` | Page structure and visual design. |
| `src/types.ts` | Shared names for ships, coordinates, turns, and results. |
| `src/board.ts` | Placement rules, board updates, random fleets, and sunk ships. |
| `src/game.ts` | Shot resolution and end-of-game statistics. |
| `src/ai.ts` | Recruit, Tactical, and Admiral opponent decisions. |
| `src/session.ts` | Turn order, saving, restoring, logs, and timers. |
| `src/views/` | Rendering for command, deployment, battle, and debrief screens. |
| `src/ui.ts` | Board cells, fleet status, and coordinate labels. |
| `src/effects.ts` / `src/sound.ts` | Decorative visual effects and procedural sounds. |
| `src/commander.ts` | Commander Voss's deterministic radio messages. |
| `src/main.ts` | Connects the screens, controls, session, and game actions. |
| `tests/` | Fast unit tests. |
| `e2e/` | Playwright tests in a real browser. |

The rules and opponent logic are kept separate from the page, so they can be
tested without opening a browser.

## Deployment

The GitHub Pages workflow in `.github/workflows/deploy.yml` runs when changes
are pushed to `main`. It installs dependencies, runs the unit tests, builds the
production bundle with the Pages path, and publishes `dist/` to GitHub Pages.

See [`DEBUGGING.md`](./DEBUGGING.md) for the real bugs found while building the
game and how each one was discovered, fixed, and verified.
