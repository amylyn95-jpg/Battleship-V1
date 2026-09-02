import type { Coord } from "../types.js";

export type BoardSide = "player" | "enemy";
export const CELL_SIZE = 6;
const BOARD_SIZE = 60;

export function gridToWorld(coord: Coord, side: BoardSide): { x: number; z: number } {
  return {
    x: -BOARD_SIZE / 2 + (coord.col + 0.5) * CELL_SIZE,
    z: side === "player" ? 24 + (coord.row + 0.5) * CELL_SIZE : -84 + (coord.row + 0.5) * CELL_SIZE,
  };
}

export function worldToGrid(x: number, z: number, side: BoardSide): Coord | null {
  const minZ = side === "player" ? 24 : -84;
  const maxZ = minZ + BOARD_SIZE;
  if (x < -BOARD_SIZE / 2 || x >= BOARD_SIZE / 2 || z < minZ || z >= maxZ) return null;
  const col = Math.floor((x + BOARD_SIZE / 2) / CELL_SIZE);
  const row = Math.floor((z - minZ) / CELL_SIZE);
  return row >= 0 && row < 10 && col >= 0 && col < 10 ? { row, col } : null;
}
