import { createAi, nextShot, registerOutcome, type AiState } from './ai';
import { allShipsSunk, emptyBoard, fireAt, randomBoard } from './board';
import type { Board, Coord, Difficulty, Phase, ShotOutcome, Winner } from './types';

export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  /** The player's waters. The AI fires here. */
  playerBoard: Board;
  /** The AI's waters. The player fires here; ships stay hidden until sunk. */
  aiBoard: Board;
  ai: AiState;
  winner: Winner;
  /** Newest entry first. */
  log: string[];
}

const CELL_NAMES = 'ABCDEFGHIJ';

export const coordLabel = ({ row, col }: Coord): string => `${CELL_NAMES[col]}${row + 1}`;

export function createGame(difficulty: Difficulty, random: () => number = Math.random): GameState {
  return {
    phase: 'placement',
    difficulty,
    playerBoard: emptyBoard(),
    aiBoard: randomBoard(random),
    ai: createAi(difficulty),
    winner: null,
    log: ['Place your fleet to begin.'],
  };
}

export function startBattle(state: GameState, playerBoard: Board): GameState {
  return {
    ...state,
    playerBoard,
    phase: 'playerTurn',
    log: ['Fleet deployed. Fire at the enemy grid.', ...state.log],
  };
}

const describe = (who: 'You' | 'Enemy', target: Coord, outcome: ShotOutcome): string => {
  const at = coordLabel(target);
  switch (outcome.kind) {
    case 'sunk':
      return `${who} sank the ${outcome.shipName} at ${at}!`;
    case 'hit':
      return `${who} hit at ${at}.`;
    case 'miss':
      return `${who} missed at ${at}.`;
    default:
      return `${who} fired an invalid shot at ${at}.`;
  }
};

/** Resolves the player's shot. Returns the state unchanged for illegal shots. */
export function playerFire(state: GameState, target: Coord): GameState {
  if (state.phase !== 'playerTurn') return state;

  const { board: aiBoard, outcome } = fireAt(state.aiBoard, target);
  if (outcome.kind === 'invalid') return state;

  const log = [describe('You', target, outcome), ...state.log];
  if (allShipsSunk(aiBoard)) {
    return {
      ...state,
      aiBoard,
      phase: 'gameOver',
      winner: 'player',
      log: ['You destroyed the enemy fleet. Victory!', ...log],
    };
  }
  // A hit does not grant another shot in these rules; the turn always passes.
  return { ...state, aiBoard, phase: 'aiTurn', log };
}

/** Resolves one AI shot. Call while `phase === 'aiTurn'`. */
export function aiFire(state: GameState, random: () => number = Math.random): GameState {
  if (state.phase !== 'aiTurn') return state;

  const target = nextShot(state.ai, state.playerBoard, random);
  const { board: playerBoard, outcome } = fireAt(state.playerBoard, target);
  const ai = registerOutcome(state.ai, target, outcome, playerBoard);

  const log = [describe('Enemy', target, outcome), ...state.log];
  if (allShipsSunk(playerBoard)) {
    return {
      ...state,
      playerBoard,
      ai,
      phase: 'gameOver',
      winner: 'ai',
      log: ['Your fleet has been destroyed. Defeat.', ...log],
    };
  }
  return { ...state, playerBoard, ai, phase: 'playerTurn', log };
}
