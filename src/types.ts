export const BOARD_SIZE = 10;

export type Orientation = "horizontal" | "vertical";

export interface ShipSpec {
  readonly id: ShipId;
  readonly name: string;
  readonly length: number;
}

export type ShipId = "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";

export const FLEET: readonly ShipSpec[] = [
  { id: "carrier", name: "Carrier", length: 5 },
  { id: "battleship", name: "Battleship", length: 4 },
  { id: "cruiser", name: "Cruiser", length: 3 },
  { id: "submarine", name: "Submarine", length: 3 },
  { id: "destroyer", name: "Destroyer", length: 2 },
];

export interface Coord {
  readonly row: number;
  readonly col: number;
}

export interface Ship {
  readonly id: ShipId;
  readonly name: string;
  readonly length: number;
  readonly cells: readonly Coord[];
  readonly hits: readonly Coord[];
}

export type CellState = "empty" | "ship" | "hit" | "miss";

export interface Board {
  readonly ships: readonly Ship[];
  /** Every cell that has been fired at on this board. */
  readonly shots: readonly Coord[];
}

export type Difficulty = "easy" | "normal" | "hard";

export type TheatreId = "salamis" | "trafalgar" | "midway";

/**
 * "classic" fires one shot per turn and marks each hit on the board.
 * "salvo" fires one shot per surviving ship and only reports how many of them
 * hit, so individual splashes stay ambiguous until a ship sinks.
 */
export type Mode = "classic" | "salvo";

export type Phase = "placement" | "playing" | "gameover";

export type Player = "human" | "ai";

export interface LogEntry {
  readonly at: number;
  readonly actor: "you" | "enemy" | "system";
  readonly text: string;
}

export interface ShotResult {
  readonly coord: Coord;
  readonly hit: boolean;
  /** Set when this shot sank a ship. */
  readonly sunk?: Ship;
  /** True when this shot sank the final remaining ship. */
  readonly fleetDestroyed: boolean;
}
