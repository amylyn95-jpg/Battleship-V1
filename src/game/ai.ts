import { inBounds, key, sameCoord } from './board';
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
function alignedCandidates(hits: Coord[]): Coord[] {
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

/** Folds the result of the AI's shot back into its state. */
export function registerOutcome(state: AiState, target: Coord, outcome: ShotOutcome): AiState {
  const withoutTarget = state.queue.filter((cell) => !sameCoord(cell, target));

  if (outcome.kind === 'sunk') {
    // The wounded-ship trail is resolved; drop it and go back to hunting.
    return { ...state, queue: [], activeHits: [] };
  }
  if (outcome.kind !== 'hit') {
    return { ...state, queue: withoutTarget };
  }

  const activeHits = [...state.activeHits, target];
  const aligned = alignedCandidates(activeHits);
  // Once the ship's axis is known, only its two ends can extend it.
  const candidates = aligned.length > 0 ? aligned : [...withoutTarget, ...neighbours(target)];

  const seen = new Set(activeHits.map(key));
  const queue: Coord[] = [];
  for (const cell of candidates) {
    if (seen.has(key(cell))) continue;
    seen.add(key(cell));
    queue.push(cell);
  }
  return { ...state, queue, activeHits };
}
