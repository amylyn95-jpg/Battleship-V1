import { alreadyFiredAt, isFleetDestroyed, isSunk, sameCoord, shipAt } from "./board.js";
import type { Board, Coord, Ship, ShotResult } from "./types.js";

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
