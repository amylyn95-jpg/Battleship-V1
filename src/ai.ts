import { BOARD_SIZE, FLEET } from "./types.js";
import type { Coord, Difficulty, ShipId, ShotResult } from "./types.js";
import { coordKey, inBounds, sameCoord, shipCells } from "./board.js";

type Axis = "horizontal" | "vertical";

/**
 * The opponent's view of the player's board. It only ever records the results
 * of its own shots, so it cannot see unhit ship cells.
 */
export interface AiState {
  difficulty: Difficulty;
  /** Cells the AI has fired at, mapped to whether they were a hit. */
  tried: Map<string, boolean>;
  /** Hits belonging to a ship that has not yet been sunk. */
  activeHits: Coord[];
  /** Candidate follow-up shots around the active hits. */
  queue: Coord[];
  /** Locked-in axis once two active hits line up. */
  axis: Axis | null;
  remainingShips: ShipId[];
}

export function createAi(difficulty: Difficulty): AiState {
  return {
    difficulty,
    tried: new Map(),
    activeHits: [],
    queue: [],
    axis: null,
    remainingShips: FLEET.map((s) => s.id),
  };
}

function untried(state: AiState, coord: Coord): boolean {
  return inBounds(coord) && !state.tried.has(coordKey(coord));
}

function allUntried(state: AiState): Coord[] {
  const cells: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const coord = { row, col };
      if (untried(state, coord)) cells.push(coord);
    }
  }
  return cells;
}

function neighbours(coord: Coord): Coord[] {
  return [
    { row: coord.row - 1, col: coord.col },
    { row: coord.row + 1, col: coord.col },
    { row: coord.row, col: coord.col - 1 },
    { row: coord.row, col: coord.col + 1 },
  ];
}

function smallestRemainingLength(state: AiState): number {
  const lengths = FLEET.filter((s) => state.remainingShips.includes(s.id)).map((s) => s.length);
  return lengths.length > 0 ? Math.min(...lengths) : 1;
}

/**
 * Hunt mode restricted to a diagonal lattice: no ship of length >= n can sit
 * entirely between cells where (row + col) % n === 0, so this halves (or better)
 * the number of wasted searching shots without ever excluding a valid target.
 */
function parityCells(state: AiState): Coord[] {
  const stride = Math.max(2, smallestRemainingLength(state));
  const candidates = allUntried(state).filter((c) => (c.row + c.col) % stride === 0);
  return candidates.length > 0 ? candidates : allUntried(state);
}

/**
 * Counts, for every untried cell, how many legal placements of the remaining
 * ships would cover it. Cells covered most often are the most likely to hold a
 * ship. Known hits that belong to an unsunk ship are treated as confirmed
 * coverage so the density naturally extends along a wounded ship.
 */
export function densityMap(state: AiState): Map<string, number> {
  const density = new Map<string, number>();
  const specs = FLEET.filter((s) => state.remainingShips.includes(s.id));

  for (const spec of specs) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        for (const orientation of ["horizontal", "vertical"] as const) {
          const cells = shipCells({ row, col }, spec.length, orientation);
          if (!cells.every(inBounds)) continue;
          // A placement is impossible if it covers a cell we know is a miss.
          if (cells.some((c) => state.tried.get(coordKey(c)) === false)) continue;

          const overlapsActiveHit = cells.some((c) =>
            state.activeHits.some((h) => sameCoord(h, c)),
          );
          const weight = overlapsActiveHit ? 10 : 1;
          for (const cell of cells) {
            const key = coordKey(cell);
            if (state.tried.has(key)) continue;
            density.set(key, (density.get(key) ?? 0) + weight);
          }
        }
      }
    }
  }
  return density;
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

function bestByDensity(state: AiState, random: () => number): Coord | null {
  const density = densityMap(state);
  let best = -1;
  let bestCells: Coord[] = [];
  for (const coord of allUntried(state)) {
    const score = density.get(coordKey(coord)) ?? 0;
    if (score > best) {
      best = score;
      bestCells = [coord];
    } else if (score === best) {
      bestCells.push(coord);
    }
  }
  return bestCells.length > 0 ? pick(bestCells, random) : null;
}

/** Chooses the AI's next shot. Never returns a cell it has already fired at. */
export function nextShot(state: AiState, random: () => number = Math.random): Coord {
  const remaining = allUntried(state);
  if (remaining.length === 0) {
    throw new Error("AI has no cells left to fire at");
  }

  // Easy deliberately ignores the target queue: it fires blind so a beginner
  // can win. Every other difficulty follows up on its hits first.
  if (state.difficulty !== "easy") {
    // Drain stale queue entries; a cell can be queued and then fired at from a
    // different branch of the search.
    state.queue = state.queue.filter((c) => untried(state, c));
    if (state.queue.length > 0) return state.queue[0]!;
  }

  switch (state.difficulty) {
    case "easy":
      return pick(remaining, random);
    case "normal":
      return pick(parityCells(state), random);
    case "hard":
      return bestByDensity(state, random) ?? pick(remaining, random);
  }
}

/**
 * Extends the candidate queue along the locked axis in both directions from the
 * run of active hits.
 */
function enqueueAlongAxis(state: AiState): void {
  const axis = state.axis;
  if (!axis) return;
  const hits = state.activeHits;
  if (hits.length === 0) return;

  if (axis === "horizontal") {
    const row = hits[0]!.row;
    const cols = hits.map((h) => h.col);
    const ends = [
      { row, col: Math.min(...cols) - 1 },
      { row, col: Math.max(...cols) + 1 },
    ];
    state.queue = ends.filter((c) => untried(state, c));
  } else {
    const col = hits[0]!.col;
    const rows = hits.map((h) => h.row);
    const ends = [
      { row: Math.min(...rows) - 1, col },
      { row: Math.max(...rows) + 1, col },
    ];
    state.queue = ends.filter((c) => untried(state, c));
  }
}

/** Feeds the outcome of the AI's shot back into its search state. */
export function recordResult(state: AiState, result: ShotResult): void {
  state.tried.set(coordKey(result.coord), result.hit);
  state.queue = state.queue.filter((c) => !sameCoord(c, result.coord));

  if (!result.hit) {
    if (state.axis) enqueueAlongAxis(state);
    return;
  }

  if (result.sunk) {
    state.remainingShips = state.remainingShips.filter((id) => id !== result.sunk!.id);
    const sunkCells = result.sunk.cells;
    // A shot can sink one ship while other wounded ships are still afloat, so
    // only the sunk ship's cells leave the active set.
    state.activeHits = state.activeHits.filter(
      (h) => !sunkCells.some((c) => sameCoord(c, h)),
    );
    state.axis = null;
    state.queue = [];
    if (state.activeHits.length > 0) {
      // Resume hunting the remaining wounded ship.
      const anchor = state.activeHits[0]!;
      state.queue = neighbours(anchor).filter((c) => untried(state, c));
    }
    return;
  }

  state.activeHits = [...state.activeHits, result.coord];

  if (state.activeHits.length >= 2 && !state.axis) {
    const [a, b] = [state.activeHits[0]!, state.activeHits[state.activeHits.length - 1]!];
    if (a.row === b.row) state.axis = "horizontal";
    else if (a.col === b.col) state.axis = "vertical";
  }

  if (state.axis) {
    enqueueAlongAxis(state);
    if (state.queue.length === 0) {
      // Blocked at both ends along the axis: fall back to probing neighbours of
      // every active hit, which covers the two-ships-adjacent case.
      state.axis = null;
      state.queue = state.activeHits
        .flatMap(neighbours)
        .filter((c) => untried(state, c));
    }
    return;
  }

  const fresh = neighbours(result.coord).filter((c) => untried(state, c));
  const known = new Set(state.queue.map(coordKey));
  state.queue = [...state.queue, ...fresh.filter((c) => !known.has(coordKey(c)))];
}
