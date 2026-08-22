import { describe, expect, it } from 'vitest';
import {
  allShipsSunk,
  canPlace,
  emptyBoard,
  fireAt,
  occupiedCells,
  placeShip,
  randomBoard,
  shipCells,
} from './board';
import { BOARD_SIZE, FLEET, type ShipSpec } from './types';

const destroyer: ShipSpec = { name: 'Destroyer', size: 2 };
const cruiser: ShipSpec = { name: 'Cruiser', size: 3 };

describe('placement', () => {
  it('lays a ship out along the chosen axis', () => {
    expect(shipCells({ row: 2, col: 4 }, 3, 'horizontal')).toEqual([
      { row: 2, col: 4 },
      { row: 2, col: 5 },
      { row: 2, col: 6 },
    ]);
    expect(shipCells({ row: 2, col: 4 }, 3, 'vertical')).toEqual([
      { row: 2, col: 4 },
      { row: 3, col: 4 },
      { row: 4, col: 4 },
    ]);
  });

  it('rejects ships that would run off the board', () => {
    expect(canPlace(emptyBoard(), { row: 0, col: 8 }, 3, 'horizontal')).toBe(false);
    expect(canPlace(emptyBoard(), { row: 8, col: 0 }, 3, 'vertical')).toBe(false);
    expect(canPlace(emptyBoard(), { row: 0, col: 7 }, 3, 'horizontal')).toBe(true);
  });

  it('rejects overlapping ships', () => {
    const board = placeShip(emptyBoard(), cruiser, { row: 5, col: 5 }, 'horizontal');
    expect(board).not.toBeNull();
    expect(canPlace(board!, { row: 5, col: 6 }, 2, 'vertical')).toBe(false);
    expect(placeShip(board!, destroyer, { row: 5, col: 6 }, 'vertical')).toBeNull();
    expect(canPlace(board!, { row: 6, col: 6 }, 2, 'vertical')).toBe(true);
  });

  it('never mutates the board it is given', () => {
    const board = emptyBoard();
    placeShip(board, cruiser, { row: 0, col: 0 }, 'horizontal');
    expect(board.ships).toHaveLength(0);
  });

  it('places the whole fleet without overlaps, 200 layouts in a row', () => {
    for (let i = 0; i < 200; i++) {
      const board = randomBoard();
      expect(board.ships).toHaveLength(FLEET.length);
      const cells = occupiedCells(board);
      const expected = FLEET.reduce((sum, ship) => sum + ship.size, 0);
      expect(cells.size).toBe(expected);
      for (const ship of board.ships) {
        for (const { row, col } of ship.cells) {
          expect(row).toBeGreaterThanOrEqual(0);
          expect(row).toBeLessThan(BOARD_SIZE);
          expect(col).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThan(BOARD_SIZE);
        }
      }
    }
  });
});

describe('firing', () => {
  const board = placeShip(emptyBoard(), destroyer, { row: 3, col: 3 }, 'horizontal')!;

  it('records misses', () => {
    const { board: next, outcome } = fireAt(board, { row: 0, col: 0 });
    expect(outcome).toEqual({ kind: 'miss' });
    expect(next.shots['0,0']).toBe('miss');
  });

  it('records hits and sinks the ship on its last cell', () => {
    const first = fireAt(board, { row: 3, col: 3 });
    expect(first.outcome.kind).toBe('hit');
    const second = fireAt(first.board, { row: 3, col: 4 });
    expect(second.outcome).toMatchObject({ kind: 'sunk', shipName: 'Destroyer' });
    expect(allShipsSunk(second.board)).toBe(true);
  });

  it('rejects repeat and off-board shots without changing the board', () => {
    const { board: afterMiss } = fireAt(board, { row: 0, col: 0 });
    const repeat = fireAt(afterMiss, { row: 0, col: 0 });
    expect(repeat.outcome).toEqual({ kind: 'invalid', reason: 'repeat' });
    expect(repeat.board).toBe(afterMiss);

    const offBoard = fireAt(board, { row: -1, col: 0 });
    expect(offBoard.outcome).toEqual({ kind: 'invalid', reason: 'off-board' });
    expect(offBoard.board).toBe(board);
  });

  it('does not treat an empty board as a defeated fleet', () => {
    expect(allShipsSunk(emptyBoard())).toBe(false);
  });
});
