import { BOARD_SIZE } from "./types.js";
import type { Board, Coord, Ship } from "./types.js";
import { isSunk, sameCoord } from "./board.js";

export interface CellRenderState {
  ship: boolean;
  hit: boolean;
  miss: boolean;
  sunk: boolean;
  /** A fired cell whose hit-or-miss outcome is being withheld (salvo mode). */
  splash: boolean;
}

export function buildGrid(container: HTMLElement, onSelect: (coord: Coord) => void): HTMLButtonElement[] {
  container.textContent = "";
  const cells: HTMLButtonElement[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${String.fromCharCode(65 + col)}${row + 1}`);
      cell.addEventListener("click", () => onSelect({ row, col }));
      container.append(cell);
      cells.push(cell);
    }
  }
  return cells;
}

export function cellIndex(coord: Coord): number {
  return coord.row * BOARD_SIZE + coord.col;
}

/**
 * Computes what each cell should look like. `revealShips` is false for the
 * enemy board so unhit ship cells stay hidden. `hideOutcome` is salvo mode's
 * rule: a shot shows as an anonymous splash until the ship it belongs to sinks,
 * so the only feedback is the per-turn hit count.
 */
export function cellStates(
  board: Board,
  revealShips: boolean,
  hideOutcome = false,
): CellRenderState[] {
  const states: CellRenderState[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({
    ship: false,
    hit: false,
    miss: false,
    sunk: false,
    splash: false,
  }));

  for (const ship of board.ships) {
    const sunk = isSunk(ship);
    for (const cell of ship.cells) {
      const state = states[cellIndex(cell)]!;
      const wasHit = ship.hits.some((h) => sameCoord(h, cell));
      if (revealShips || wasHit || sunk) state.ship = revealShips;
      if (wasHit) state.hit = true;
      if (sunk) state.sunk = true;
    }
  }

  for (const shot of board.shots) {
    const state = states[cellIndex(shot)]!;
    if (!state.hit) state.miss = true;
  }

  if (hideOutcome && !revealShips) {
    for (const state of states) {
      if (state.sunk) continue;
      if (state.hit || state.miss) {
        state.hit = false;
        state.miss = false;
        state.splash = true;
      }
    }
  }

  return states;
}

export function paintBoard(
  cells: readonly HTMLButtonElement[],
  board: Board,
  revealShips: boolean,
  lastShot: Coord | null,
  hideOutcome = false,
): void {
  const states = cellStates(board, revealShips, hideOutcome);
  states.forEach((state, index) => {
    const cell = cells[index]!;
    cell.classList.toggle("ship", state.ship && !state.hit);
    cell.classList.toggle("hit", state.hit && !state.sunk);
    cell.classList.toggle("sunk", state.sunk);
    cell.classList.toggle("miss", state.miss);
    cell.classList.toggle("splash", state.splash);
    cell.classList.toggle("fired", state.hit || state.miss || state.splash);
    cell.classList.remove("preview", "preview-invalid", "last-shot", "target");
    cell.disabled = false;
  });
  if (lastShot) cells[cellIndex(lastShot)]!.classList.add("last-shot");
}

/** Marks the cells queued up for the next salvo. */
export function showTargets(
  cells: readonly HTMLButtonElement[],
  coords: readonly Coord[],
): void {
  for (const cell of cells) cell.classList.remove("target");
  for (const coord of coords) cells[cellIndex(coord)]?.classList.add("target");
}

export function paintFleet(list: HTMLElement, ships: readonly Ship[]): void {
  list.textContent = "";
  for (const ship of ships) {
    const item = document.createElement("li");
    item.textContent = `${ship.name} (${ship.length})`;
    item.classList.toggle("sunk", isSunk(ship));
    list.append(item);
  }
}

export function clearPreview(cells: readonly HTMLButtonElement[]): void {
  for (const cell of cells) cell.classList.remove("preview", "preview-invalid");
}

export function showPreview(
  cells: readonly HTMLButtonElement[],
  coords: readonly Coord[],
  valid: boolean,
): void {
  clearPreview(cells);
  for (const coord of coords) {
    const index = cellIndex(coord);
    const cell = cells[index];
    if (cell) cell.classList.add(valid ? "preview" : "preview-invalid");
  }
}

export function coordLabel(coord: Coord): string {
  return `${String.fromCharCode(65 + coord.col)}${coord.row + 1}`;
}
