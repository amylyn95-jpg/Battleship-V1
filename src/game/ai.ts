import { inBounds, key } from './board';
import { BOARD_SIZE, type Board, type Coord, type Difficulty, type ShotOutcome } from './types';

/**
 * Hunt/target AI. While no ship is wounded it hunts (randomly, on a parity grid for `hard`);
 * once it lands a hit it works a queue of adjacent cells until the ship sinks.
 */
export interface AiState {
  difficulty: Difficulty;
  /** Cells queued for the "target" phase, highest priority first. */
  queue: Coord[];
  /** Hits on the ship currently being hunted, in the order they landed. */
  activeHits: Coord[];
}

export const createAi = (difficulty: Difficulty): AiState => ({
  difficulty,
  queue: [],
  activeHits: [],
});

const neighbours = ({ row, col }: Coord): Coord[] =>
  [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(inBounds);

const untried = (board: Board, cell: Coord): boolean => !board.shots[key(cell)];

function allUntried(board: Board): Coord[] {
  const cells: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (untried(board, { row, col })) cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * The smallest ship is 2 cells long, so every ship must cover at least one cell where
 * (row + col) is even. Hunting only those halves the number of searching shots.
 */
const parityCells = (cells: Coord[]): Coord[] =>
  cells.filter(({ row, col }) => (row + col) % 2 === 0);

/** Picks the AI's next target against `board` (the board it is shooting at). */
export function nextShot(state: AiState, board: Board, random: () => number = Math.random): Coord {
  const candidates = allUntried(board);
  if (candidates.length === 0) throw new Error('nextShot called with no cells left to fire at');

  if (state.difficulty !== 'easy') {
    const queued = state.queue.find((cell) => untried(board, cell));
    if (queued) return queued;
  }

  const huntPool =
    state.difficulty === 'hard' && parityCells(candidates).length > 0
      ? parityCells(candidates)
      : candidates;
  return huntPool[Math.floor(random() * huntPool.length)];
}

/** Same-axis extensions of a wounded ship, which beat plain adjacency once we know its direction. */
export function alignedCandidates(hits: Coord[]): Coord[] {
  if (hits.length < 2) return [];
  const horizontal = hits.every((hit) => hit.row === hits[0].row);
  const vertical = hits.every((hit) => hit.col === hits[0].col);
  if (horizontal) {
    const cols = hits.map((hit) => hit.col);
    return [
      { row: hits[0].row, col: Math.min(...cols) - 1 },
      { row: hits[0].row, col: Math.max(...cols) + 1 },
    ].filter(inBounds);
  }
  if (vertical) {
    const rows = hits.map((hit) => hit.row);
    return [
      { row: Math.min(...rows) - 1, col: hits[0].col },
      { row: Math.max(...rows) + 1, col: hits[0].col },
    ].filter(inBounds);
  }
  return [];
}

/**
 * Folds the result of the AI's shot back into its state. `board` is the board *after* the shot,
 * used only to keep already-fired cells out of the queue.
 */
export function registerOutcome(
  state: AiState,
  target: Coord,
  outcome: ShotOutcome,
  board: Board,
): AiState {
  const viable = (cell: Coord) => untried(board, cell);
  const rebuild = (hits: Coord[], extra: Coord[] = []): Coord[] => {
    const seen = new Set<string>();
    const queue: Coord[] = [];
    for (const cell of [...alignedCandidates(hits), ...hits.flatMap(neighbours), ...extra]) {
      if (seen.has(key(cell)) || !viable(cell)) continue;
      seen.add(key(cell));
      queue.push(cell);
    }
    return queue;
  };

  if (outcome.kind === 'sunk') {
    // The sunk ship's cells are a contiguous run of known length through the killing shot.
    // Any other hit still on the trail belongs to a *different* ship, so keep hunting it.
    const trail = [...state.activeHits, target];
    const sunkCells = new Set(sunkRun(trail, target, outcome.shipSize).map(key));
    const orphans = state.activeHits.filter((hit) => !sunkCells.has(key(hit)));
    return { ...state, activeHits: orphans, queue: rebuild(orphans) };
  }
  if (outcome.kind !== 'hit') {
    return { ...state, queue: state.queue.filter((cell) => viable(cell)) };
  }

  // Prefer extending the known axis, but always keep plain adjacency as a fallback: the hits may
  // belong to two different ships, in which case the axis guess is wrong and its ends are dead.
  const activeHits = [...state.activeHits, target];
  return { ...state, activeHits, queue: rebuild(activeHits, state.queue) };
}

/**
 * The cells of the ship that just sank: the contiguous run of `size` hits through `killingShot`.
 * Falls back to the killing shot alone when the trail is ambiguous.
 */
function sunkRun(hits: Coord[], killingShot: Coord, size: number): Coord[] {
  const hitKeys = new Set(hits.map(key));
  const walk = (step: Coord): Coord[] => {
    const run: Coord[] = [];
    let cursor = { row: killingShot.row + step.row, col: killingShot.col + step.col };
    while (hitKeys.has(key(cursor))) {
      run.push(cursor);
      cursor = { row: cursor.row + step.row, col: cursor.col + step.col };
    }
    return run;
  };

  for (const [back, forward] of [
    [walk({ row: 0, col: -1 }), walk({ row: 0, col: 1 })],
    [walk({ row: -1, col: 0 }), walk({ row: 1, col: 0 })],
  ]) {
    const run = [...back.reverse(), killingShot, ...forward];
    if (run.length >= size) return run;
  }
  return [killingShot];
}
