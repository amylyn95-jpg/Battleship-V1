import { describe, expect, it } from "vitest";
import {
  alreadyFiredAt,
  canPlace,
  emptyBoard,
  isFleetComplete,
  isFleetDestroyed,
  placeShip,
  randomFleet,
  removeShip,
  shipAt,
  shipCells,
} from "../src/board.js";
import { FLEET } from "../src/types.js";
import { fire, InvalidShotError } from "../src/game.js";

const carrier = FLEET[0]!;
const destroyer = FLEET[4]!;

describe("placement", () => {
  it("computes cells for both orientations", () => {
    expect(shipCells({ row: 2, col: 3 }, 3, "horizontal")).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ]);
    expect(shipCells({ row: 2, col: 3 }, 3, "vertical")).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 4, col: 3 },
    ]);
  });

  it("rejects placements that run off the board", () => {
    const board = emptyBoard();
    expect(canPlace(board, carrier, { row: 0, col: 6 }, "horizontal")).toBe(false);
    expect(canPlace(board, carrier, { row: 6, col: 0 }, "vertical")).toBe(false);
    expect(canPlace(board, carrier, { row: 0, col: 5 }, "horizontal")).toBe(true);
  });

  it("rejects overlapping placements", () => {
    const board = placeShip(emptyBoard(), carrier, { row: 0, col: 0 }, "horizontal");
    expect(canPlace(board, destroyer, { row: 0, col: 4 }, "vertical")).toBe(false);
    expect(canPlace(board, destroyer, { row: 1, col: 4 }, "vertical")).toBe(true);
  });

  it("rejects placing the same ship twice and supports removal", () => {
    const board = placeShip(emptyBoard(), carrier, { row: 0, col: 0 }, "horizontal");
    expect(canPlace(board, carrier, { row: 5, col: 0 }, "horizontal")).toBe(false);
    expect(canPlace(removeShip(board, "carrier"), carrier, { row: 5, col: 0 }, "horizontal")).toBe(true);
  });

  it("builds a complete, non-overlapping random fleet", () => {
    for (let i = 0; i < 200; i++) {
      const board = randomFleet();
      expect(isFleetComplete(board)).toBe(true);
      const cells = board.ships.flatMap((s) => s.cells.map((c) => `${c.row},${c.col}`));
      expect(new Set(cells).size).toBe(cells.length);
      expect(cells.length).toBe(FLEET.reduce((n, s) => n + s.length, 0));
    }
  });
});

describe("firing", () => {
  it("records misses and hits", () => {
    const board = placeShip(emptyBoard(), destroyer, { row: 0, col: 0 }, "horizontal");
    const miss = fire(board, { row: 5, col: 5 });
    expect(miss.result.hit).toBe(false);
    expect(alreadyFiredAt(miss.board, { row: 5, col: 5 })).toBe(true);

    const hit = fire(board, { row: 0, col: 0 });
    expect(hit.result.hit).toBe(true);
    expect(hit.result.sunk).toBeUndefined();
    expect(shipAt(hit.board, { row: 0, col: 0 })!.hits).toHaveLength(1);
  });

  it("reports the sunk ship and fleet destruction", () => {
    let board = placeShip(emptyBoard(), destroyer, { row: 0, col: 0 }, "horizontal");
    board = fire(board, { row: 0, col: 0 }).board;
    const final = fire(board, { row: 0, col: 1 });
    expect(final.result.sunk?.name).toBe("Destroyer");
    // A single-ship board is not a complete fleet, so the game is not over.
    expect(final.result.fleetDestroyed).toBe(false);
    expect(isFleetDestroyed(final.board)).toBe(false);
  });

  it("ends the game only when every ship of a full fleet is sunk", () => {
    let board = randomFleet();
    const targets = board.ships.flatMap((s) => s.cells);
    let last = null as ReturnType<typeof fire> | null;
    for (const cell of targets) {
      last = fire(board, cell);
      board = last.board;
    }
    expect(last!.result.fleetDestroyed).toBe(true);
  });

  it("refuses to fire at the same cell twice", () => {
    const board = fire(randomFleet(), { row: 0, col: 0 }).board;
    expect(() => fire(board, { row: 0, col: 0 })).toThrow(InvalidShotError);
  });
});
