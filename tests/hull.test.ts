import { describe, expect, it } from "vitest";
import { emptyBoard, placeShip } from "../src/board.js";
import { fire } from "../src/game.js";
import { FLEET } from "../src/types.js";
import { cellIndex, cellStates } from "../src/ui.js";

const carrier = FLEET[0]!;
const destroyer = FLEET[4]!;

describe("hull rendering", () => {
  it("marks bow, middle and stern along a horizontal ship", () => {
    const board = placeShip(emptyBoard(), carrier, { row: 0, col: 0 }, "horizontal");
    const states = cellStates(board, true);
    expect(states[cellIndex({ row: 0, col: 0 })]!.hullPart).toBe("bow");
    expect(states[cellIndex({ row: 0, col: 2 })]!.hullPart).toBe("mid");
    expect(states[cellIndex({ row: 0, col: 4 })]!.hullPart).toBe("stern");
    for (let col = 0; col < carrier.length; col++) {
      expect(states[cellIndex({ row: 0, col })]!.hullAxis).toBe("h");
    }
  });

  it("marks a vertical ship along the other axis", () => {
    const board = placeShip(emptyBoard(), destroyer, { row: 3, col: 6 }, "vertical");
    const states = cellStates(board, true);
    expect(states[cellIndex({ row: 3, col: 6 })]!.hullPart).toBe("bow");
    expect(states[cellIndex({ row: 4, col: 6 })]!.hullPart).toBe("stern");
    expect(states[cellIndex({ row: 3, col: 6 })]!.hullAxis).toBe("v");
  });

  it("keeps the hull drawn under a hit so damage shows on the ship", () => {
    let board = placeShip(emptyBoard(), destroyer, { row: 1, col: 1 }, "horizontal");
    board = fire(board, { row: 1, col: 1 }).board;
    const state = cellStates(board, true)[cellIndex({ row: 1, col: 1 })]!;
    expect(state.hit).toBe(true);
    expect(state.ship).toBe(true);
    expect(state.hullPart).toBe("bow");
  });

  it("never leaks hull geometry on the unrevealed enemy board", () => {
    let board = placeShip(emptyBoard(), destroyer, { row: 1, col: 1 }, "horizontal");
    board = fire(board, { row: 1, col: 1 }).board;
    const states = cellStates(board, false);
    for (const state of states) {
      expect(state.hullPart).toBeNull();
      expect(state.hullAxis).toBeNull();
    }
  });
});
