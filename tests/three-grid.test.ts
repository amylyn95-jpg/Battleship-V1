import { describe, expect, it } from "vitest";
import { gridToWorld, worldToGrid } from "../src/three/grid.js";

describe("3D board coordinates", () => {
  it("round-trips every cell on both boards", () => {
    for (const side of ["player", "enemy"] as const) {
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const coord = { row, col };
          expect(worldToGrid(gridToWorld(coord, side).x, gridToWorld(coord, side).z, side)).toEqual(coord);
        }
      }
    }
  });

  it("rejects points outside either board", () => {
    expect(worldToGrid(-31, 30, "player")).toBeNull();
    expect(worldToGrid(0, 23.9, "player")).toBeNull();
    expect(worldToGrid(0, -23.9, "enemy")).toBeNull();
    expect(worldToGrid(31, -30, "enemy")).toBeNull();
  });

  it("keeps the two board areas separate", () => {
    expect(gridToWorld({ row: 0, col: 0 }, "player").z).toBeGreaterThan(
      gridToWorld({ row: 9, col: 9 }, "enemy").z,
    );
  });
});
