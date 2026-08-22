export const BOARD_SIZE = 10;

export type Orientation = 'horizontal' | 'vertical';

export interface Coord {
  row: number;
  col: number;
}

export interface ShipSpec {
  name: string;
  size: number;
}

export const FLEET: readonly ShipSpec[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const;

export interface Ship {
  id: string;
  name: string;
  size: number;
  cells: Coord[];
  hits: Coord[];
}

/** A player's own waters: their ships plus every shot the opponent has taken at them. */
export interface Board {
  ships: Ship[];
  /** Keys are `${row},${col}` of cells the opponent has fired at. */
  shots: Record<string, 'hit' | 'miss'>;
}

export type ShotOutcome =
  | { kind: 'invalid'; reason: 'off-board' | 'repeat' }
  | { kind: 'miss' }
  | { kind: 'hit'; shipId: string }
  | { kind: 'sunk'; shipId: string; shipName: string; shipSize: number };

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Phase = 'placement' | 'playerTurn' | 'aiTurn' | 'gameOver';

export type Winner = 'player' | 'ai' | null;
