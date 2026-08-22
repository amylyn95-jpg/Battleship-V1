import {
  BOARD_SIZE,
  FLEET,
  type Board,
  type Coord,
  type Orientation,
  type Ship,
  type ShipSpec,
  type ShotOutcome,
} from './types';

export const key = ({ row, col }: Coord): string => `${row},${col}`;

export const inBounds = ({ row, col }: Coord): boolean =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

export const sameCoord = (a: Coord, b: Coord): boolean => a.row === b.row && a.col === b.col;

export const emptyBoard = (): Board => ({ ships: [], shots: {} });

/** The cells a ship of `size` would occupy if anchored at `start` in `orientation`. */
export function shipCells(start: Coord, size: number, orientation: Orientation): Coord[] {
  return Array.from({ length: size }, (_, i) =>
    orientation === 'horizontal'
      ? { row: start.row, col: start.col + i }
      : { row: start.row + i, col: start.col },
  );
}

/**
 * Pulls an anchor back so a ship of `size` stays fully on the board. Hovering near the right or
 * bottom edge then previews and places a whole ship instead of one clipped to the edge.
 */
export function clampStart(start: Coord, size: number, orientation: Orientation): Coord {
  const limit = BOARD_SIZE - size;
  return orientation === 'horizontal'
    ? { row: start.row, col: Math.min(start.col, limit) }
    : { row: Math.min(start.row, limit), col: start.col };
}

export function occupiedCells(board: Board): Set<string> {
  const occupied = new Set<string>();
  for (const ship of board.ships) {
    for (const cell of ship.cells) occupied.add(key(cell));
  }
  return occupied;
}

export function canPlace(
  board: Board,
  start: Coord,
  size: number,
  orientation: Orientation,
): boolean {
  const cells = shipCells(start, size, orientation);
  if (!cells.every(inBounds)) return false;
  const occupied = occupiedCells(board);
  return cells.every((cell) => !occupied.has(key(cell)));
}

/** Returns a new board with the ship added, or `null` when the placement is illegal. */
export function placeShip(
  board: Board,
  spec: ShipSpec,
  start: Coord,
  orientation: Orientation,
): Board | null {
  if (!canPlace(board, start, spec.size, orientation)) return null;
  const ship: Ship = {
    id: `${spec.name}-${board.ships.length}`,
    name: spec.name,
    size: spec.size,
    cells: shipCells(start, spec.size, orientation),
    hits: [],
  };
  return { ...board, ships: [...board.ships, ship] };
}

export function randomBoard(random: () => number = Math.random): Board {
  let board = emptyBoard();
  for (const spec of FLEET) {
    let placed: Board | null = null;
    // Rejection sampling: the fleet occupies 17 of 100 cells, so collisions are rare.
    while (!placed) {
      const orientation: Orientation = random() < 0.5 ? 'horizontal' : 'vertical';
      const start = {
        row: Math.floor(random() * BOARD_SIZE),
        col: Math.floor(random() * BOARD_SIZE),
      };
      placed = placeShip(board, spec, start, orientation);
    }
    board = placed;
  }
  return board;
}

export function shipAt(board: Board, target: Coord): Ship | undefined {
  return board.ships.find((ship) => ship.cells.some((cell) => sameCoord(cell, target)));
}

export const isSunk = (ship: Ship): boolean => ship.hits.length === ship.size;

export const allShipsSunk = (board: Board): boolean =>
  board.ships.length > 0 && board.ships.every(isSunk);

/** Applies a shot at `target`, returning the resulting board and what happened. */
export function fireAt(board: Board, target: Coord): { board: Board; outcome: ShotOutcome } {
  if (!inBounds(target)) return { board, outcome: { kind: 'invalid', reason: 'off-board' } };
  if (board.shots[key(target)]) return { board, outcome: { kind: 'invalid', reason: 'repeat' } };

  const hitShip = shipAt(board, target);
  if (!hitShip) {
    return {
      board: { ...board, shots: { ...board.shots, [key(target)]: 'miss' } },
      outcome: { kind: 'miss' },
    };
  }

  const updatedShip: Ship = { ...hitShip, hits: [...hitShip.hits, target] };
  const nextBoard: Board = {
    ships: board.ships.map((ship) => (ship.id === updatedShip.id ? updatedShip : ship)),
    shots: { ...board.shots, [key(target)]: 'hit' },
  };
  return {
    board: nextBoard,
    outcome: isSunk(updatedShip)
      ? {
          kind: 'sunk',
          shipId: updatedShip.id,
          shipName: updatedShip.name,
          shipSize: updatedShip.size,
        }
      : { kind: 'hit', shipId: updatedShip.id },
  };
}

export const remainingShips = (board: Board): Ship[] => board.ships.filter((ship) => !isSunk(ship));
