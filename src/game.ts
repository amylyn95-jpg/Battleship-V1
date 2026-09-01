import { alreadyFiredAt, isFleetDestroyed, isSunk, sameCoord, shipAt } from "./board.js";
import type { Board, Coord, Difficulty, Ship, ShotResult } from "./types.js";

export class InvalidShotError extends Error {}

/**
 * Applies a shot to the board being fired upon and returns the updated board
 * plus a description of what happened.
 */
export function fire(board: Board, coord: Coord): { board: Board; result: ShotResult } {
  if (alreadyFiredAt(board, coord)) {
    throw new InvalidShotError(`Already fired at ${coord.row},${coord.col}`);
  }
  const target = shipAt(board, coord);
  const shots = [...board.shots, coord];

  if (!target) {
    return {
      board: { ...board, shots },
      result: { coord, hit: false, fleetDestroyed: false },
    };
  }

  const ships: Ship[] = board.ships.map((ship) =>
    ship.id === target.id ? { ...ship, hits: [...ship.hits, coord] } : ship,
  );
  const nextBoard: Board = { ships, shots };
  const updated = ships.find((s) => s.id === target.id)!;
  const sunk = isSunk(updated) ? updated : undefined;

  return {
    board: nextBoard,
    result: {
      coord,
      hit: true,
      ...(sunk ? { sunk } : {}),
      fleetDestroyed: isFleetDestroyed(nextBoard),
    },
  };
}

/** How many shots the owner of this board gets per salvo turn. */
export function salvoSize(board: Board): number {
  return board.ships.filter((ship) => !isSunk(ship)).length;
}

export function shotsFired(board: Board): number {
  return board.shots.length;
}

export function hitCount(board: Board): number {
  return board.ships.reduce((total, ship) => total + ship.hits.length, 0);
}

export function accuracy(board: Board): number {
  if (board.shots.length === 0) return 0;
  return hitCount(board) / board.shots.length;
}

export function wasHit(board: Board, coord: Coord): boolean {
  return board.ships.some((s) => s.hits.some((h) => sameCoord(h, coord)));
}

/** Longest run of consecutive hits in the order the shots were fired. */
export function longestHitStreak(shots: readonly ShotResult[]): number {
  let current = 0;
  let longest = 0;
  for (const shot of shots) {
    current = shot.hit ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export type Rating = "Cadet" | "Lieutenant" | "Commander" | "Admiral";

/** accuracy is 0..1. */
export function rating(input: { won: boolean; accuracy: number; difficulty: Difficulty }): Rating {
  const ratings: Rating[] = ["Cadet", "Lieutenant", "Commander", "Admiral"];
  let index: number;
  if (!input.won) {
    index = input.accuracy >= 0.35 ? 1 : 0;
  } else if (input.accuracy < 0.25) {
    index = 1;
  } else if (input.accuracy < 0.35) {
    index = 2;
  } else {
    index = 3;
  }
  if (input.difficulty === "hard") index++;
  if (input.difficulty === "easy") index--;
  return ratings[Math.min(ratings.length - 1, Math.max(0, index))]!;
}
