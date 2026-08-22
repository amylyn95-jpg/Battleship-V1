import { describe, expect, it } from 'vitest';
import { createAi, nextShot, registerOutcome } from './ai';
import { emptyBoard, fireAt, key, placeShip, randomBoard } from './board';
import { aiFire, createGame, playerFire, startBattle } from './engine';
import { BOARD_SIZE, type Board, type Coord, type Difficulty } from './types';

/** Deterministic pseudo-random source so AI behaviour is reproducible in tests. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const shotsTaken = (board: Board): number => Object.keys(board.shots).length;

describe('ai targeting', () => {
  it('never fires at the same cell twice over a whole board', () => {
    const random = seededRandom(7);
    let ai = createAi('hard');
    let board = randomBoard(random);
    const fired = new Set<string>();

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      const target = nextShot(ai, board, random);
      expect(fired.has(key(target))).toBe(false);
      fired.add(key(target));
      const result = fireAt(board, target);
      expect(result.outcome.kind).not.toBe('invalid');
      board = result.board;
      ai = registerOutcome(ai, target, result.outcome, board);
    }
    expect(fired.size).toBe(100);
  });

  it('follows up adjacent to a hit', () => {
    const board = placeShip(emptyBoard(), { name: 'Cruiser', size: 3 }, { row: 4, col: 4 }, 'horizontal')!;
    const target: Coord = { row: 4, col: 4 };
    const { board: afterHit, outcome } = fireAt(board, target);
    const ai = registerOutcome(createAi('normal'), target, outcome, afterHit);

    const follow = nextShot(ai, afterHit, seededRandom(1));
    const adjacency = Math.abs(follow.row - target.row) + Math.abs(follow.col - target.col);
    expect(adjacency).toBe(1);
  });

  it('extends along the ship axis once two hits line up', () => {
    let board = placeShip(emptyBoard(), { name: 'Cruiser', size: 3 }, { row: 4, col: 4 }, 'horizontal')!;
    let ai = createAi('hard');

    for (const target of [
      { row: 4, col: 4 },
      { row: 4, col: 5 },
    ]) {
      const result = fireAt(board, target);
      board = result.board;
      ai = registerOutcome(ai, target, result.outcome, board);
    }

    const next = nextShot(ai, board, seededRandom(3));
    expect(next.row).toBe(4);
    expect([3, 6]).toContain(next.col);
  });

  it('stops chasing a ship once it is sunk', () => {
    let board = placeShip(emptyBoard(), { name: 'Destroyer', size: 2 }, { row: 0, col: 0 }, 'horizontal')!;
    let ai = createAi('hard');
    for (const target of [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]) {
      const result = fireAt(board, target);
      board = result.board;
      ai = registerOutcome(ai, target, result.outcome, board);
    }
    expect(ai.queue).toHaveLength(0);
    expect(ai.activeHits).toHaveLength(0);
  });

  it('keeps hunting a wounded ship whose hits interleave with another ship', () => {
    // Regression: hits on two different ships used to be treated as one, so the inferred axis
    // pointed at already-fired cells and the AI abandoned both trails.
    let board = placeShip(emptyBoard(), { name: 'Destroyer', size: 2 }, { row: 8, col: 4 }, 'horizontal')!;
    board = placeShip(board, { name: 'Carrier', size: 5 }, { row: 9, col: 5 }, 'horizontal')!;
    let ai = createAi('normal');

    for (const target of [
      { row: 8, col: 5 }, // hits the Destroyer
      { row: 7, col: 5 }, // miss
      { row: 9, col: 5 }, // hits the Carrier: two hits, same column, different ships
    ]) {
      const result = fireAt(board, target);
      board = result.board;
      ai = registerOutcome(ai, target, result.outcome, board);
    }

    const next = nextShot(ai, board, seededRandom(9));
    const adjacentToAHit = ai.activeHits.some(
      (hit) => Math.abs(hit.row - next.row) + Math.abs(hit.col - next.col) === 1,
    );
    expect(adjacentToAHit).toBe(true);
  });

  it('keeps chasing a second wounded ship after the first one sinks', () => {
    // The Destroyer sinks while the Carrier is already wounded; that hit must not be forgotten.
    let board = placeShip(emptyBoard(), { name: 'Destroyer', size: 2 }, { row: 8, col: 4 }, 'horizontal')!;
    board = placeShip(board, { name: 'Carrier', size: 5 }, { row: 9, col: 5 }, 'horizontal')!;
    let ai = createAi('normal');

    for (const target of [
      { row: 9, col: 5 }, // wounds the Carrier
      { row: 8, col: 5 }, // wounds the Destroyer
      { row: 8, col: 4 }, // sinks the Destroyer
    ]) {
      const result = fireAt(board, target);
      board = result.board;
      ai = registerOutcome(ai, target, result.outcome, board);
    }

    expect(ai.activeHits).toEqual([{ row: 9, col: 5 }]);
    // Either horizontal neighbour of the surviving hit is a legitimate follow-up.
    const next = nextShot(ai, board, seededRandom(5));
    expect(next.row).toBe(9);
    expect([4, 6]).toContain(next.col);
  });

  it('hard difficulty needs fewer shots than easy to clear a fleet', () => {
    const sink = (difficulty: Difficulty, seed: number): number => {
      const random = seededRandom(seed);
      let ai = createAi(difficulty);
      let board = randomBoard(seededRandom(seed + 500));
      while (Object.keys(board.shots).length < 100) {
        const target = nextShot(ai, board, random);
        const result = fireAt(board, target);
        board = result.board;
        ai = registerOutcome(ai, target, result.outcome, board);
        if (board.ships.every((ship) => ship.hits.length === ship.size)) break;
      }
      return shotsTaken(board);
    };

    const seeds = [11, 23, 42, 57, 68, 71, 89, 97];
    const easy = seeds.reduce((sum, seed) => sum + sink('easy', seed), 0) / seeds.length;
    const hard = seeds.reduce((sum, seed) => sum + sink('hard', seed), 0) / seeds.length;
    expect(hard).toBeLessThan(easy);
  });
});

describe('full game', () => {
  it('always ends with exactly one winner', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const random = seededRandom(seed);
      let state = startBattle(createGame('hard', random), randomBoard(random));
      const playerTargets: Coord[] = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) playerTargets.push({ row, col });
      }

      let guard = 0;
      while (state.phase !== 'gameOver' && guard++ < 400) {
        if (state.phase === 'playerTurn') {
          const target = playerTargets.shift();
          if (!target) break;
          state = playerFire(state, target);
        } else {
          state = aiFire(state, random);
        }
      }

      expect(state.phase).toBe('gameOver');
      expect(state.winner === 'player' || state.winner === 'ai').toBe(true);
      const playerWon = state.winner === 'player';
      expect(state.aiBoard.ships.every((ship) => ship.hits.length === ship.size)).toBe(playerWon);
    }
  });

  it('ignores clicks that are not the player’s to make', () => {
    const random = seededRandom(4);
    const state = startBattle(createGame('normal', random), randomBoard(random));
    const afterShot = playerFire(state, { row: 0, col: 0 });
    expect(afterShot.phase).toBe('aiTurn');
    // A second click before the AI has replied must not fire.
    expect(playerFire(afterShot, { row: 0, col: 1 })).toBe(afterShot);
    expect(shotsTaken(afterShot.aiBoard)).toBe(1);
  });
});
