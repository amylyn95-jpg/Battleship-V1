import { BOARD_SIZE, FLEET } from "./types.js";
import type { Board, Coord, Orientation, Ship, ShipSpec } from "./types.js";

export function coordKey(c: Coord): string {
  return `${c.row},${c.col}`;
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function inBounds(c: Coord): boolean {
  return c.row >= 0 && c.row < BOARD_SIZE && c.col >= 0 && c.col < BOARD_SIZE;
}

export function shipCells(origin: Coord, length: number, orientation: Orientation): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < length; i++) {
    cells.push(
      orientation === "horizontal"
        ? { row: origin.row, col: origin.col + i }
        : { row: origin.row + i, col: origin.col },
    );
  }
  return cells;
}

export function emptyBoard(): Board {
  return { ships: [], shots: [] };
}

export function occupiedCells(board: Board): Set<string> {
  const set = new Set<string>();
  for (const ship of board.ships) {
    for (const cell of ship.cells) set.add(coordKey(cell));
  }
  return set;
}

export function canPlace(
  board: Board,
  spec: ShipSpec,
  origin: Coord,
  orientation: Orientation,
): boolean {
  if (board.ships.some((s) => s.id === spec.id)) return false;
  const cells = shipCells(origin, spec.length, orientation);
  if (!cells.every(inBounds)) return false;
  const taken = occupiedCells(board);
  return !cells.some((c) => taken.has(coordKey(c)));
}

export function placeShip(
  board: Board,
  spec: ShipSpec,
  origin: Coord,
  orientation: Orientation,
): Board {
  if (!canPlace(board, spec, origin, orientation)) {
    throw new Error(`Cannot place ${spec.name} at ${coordKey(origin)} ${orientation}`);
  }
  const ship: Ship = {
    id: spec.id,
    name: spec.name,
    length: spec.length,
    cells: shipCells(origin, spec.length, orientation),
    hits: [],
  };
  return { ...board, ships: [...board.ships, ship] };
}

export function removeShip(board: Board, id: Ship["id"]): Board {
  return { ...board, ships: board.ships.filter((s) => s.id !== id) };
}

export function isFleetComplete(board: Board): boolean {
  return board.ships.length === FLEET.length;
}

export function isSunk(ship: Ship): boolean {
  return ship.hits.length === ship.length;
}

export function isFleetDestroyed(board: Board): boolean {
  return isFleetComplete(board) && board.ships.every(isSunk);
}

export function shipAt(board: Board, coord: Coord): Ship | undefined {
  return board.ships.find((s) => s.cells.some((c) => sameCoord(c, coord)));
}

export function alreadyFiredAt(board: Board, coord: Coord): boolean {
  return board.shots.some((s) => sameCoord(s, coord));
}

export function randomFleet(random: () => number = Math.random): Board {
  let board = emptyBoard();
  for (const spec of FLEET) {
    let placed = false;
    // Rejection sampling: the board is sparse enough that this terminates fast,
    // but the attempt cap keeps a pathological RNG from hanging the game.
    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const orientation: Orientation = random() < 0.5 ? "horizontal" : "vertical";
      const origin: Coord = {
        row: Math.floor(random() * BOARD_SIZE),
        col: Math.floor(random() * BOARD_SIZE),
      };
      if (canPlace(board, spec, origin, orientation)) {
        board = placeShip(board, spec, origin, orientation);
        placed = true;
      }
    }
    if (!placed) return randomFleet(random);
  }
  return board;
}
