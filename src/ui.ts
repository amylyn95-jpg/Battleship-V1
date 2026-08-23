import { BOARD_SIZE, FLEET } from "./types.js";
import type { Board, Coord, Ship, ShipId } from "./types.js";
import { isSunk, sameCoord } from "./board.js";

/** Where a cell sits along its ship, so the hull can be drawn continuously. */
export type HullPart = "bow" | "mid" | "stern";

export interface CellRenderState {
  ship: boolean;
  hit: boolean;
  miss: boolean;
  sunk: boolean;
  /** A fired cell whose hit-or-miss outcome is being withheld (salvo mode). */
  splash: boolean;
  /** Null unless this cell belongs to a revealed ship. */
  hullPart: HullPart | null;
  hullAxis: "h" | "v" | null;
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
    hullPart: null,
    hullAxis: null,
  }));

  for (const ship of board.ships) {
    const sunk = isSunk(ship);
    const axis = hullAxis(ship);
    ship.cells.forEach((cell, index) => {
      const state = states[cellIndex(cell)]!;
      const wasHit = ship.hits.some((h) => sameCoord(h, cell));
      if (revealShips || wasHit || sunk) state.ship = revealShips;
      if (revealShips) {
        state.hullAxis = axis;
        state.hullPart = index === 0 ? "bow" : index === ship.cells.length - 1 ? "stern" : "mid";
      }
      if (wasHit) state.hit = true;
      if (sunk) state.sunk = true;
    });
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

function hullAxis(ship: Ship): "h" | "v" {
  const [first, second] = ship.cells;
  return second && first && second.row === first.row ? "h" : "v";
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
    // The hull stays drawn under a hit so damage reads as "my ship, struck here".
    cell.classList.toggle("ship", state.ship);
    cell.classList.toggle("hull-h", state.hullAxis === "h");
    cell.classList.toggle("hull-v", state.hullAxis === "v");
    cell.classList.toggle("hull-bow", state.hullPart === "bow");
    cell.classList.toggle("hull-mid", state.hullPart === "mid");
    cell.classList.toggle("hull-stern", state.hullPart === "stern");
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

/**
 * The placement dock: every ship in the fleet, marked as placed or as the one
 * being placed now, so it is obvious what is left before the battle can start.
 */
export function paintDock(dock: HTMLElement, board: Board, nextId: ShipId | null): void {
  dock.textContent = "";
  const placed = new Set(board.ships.map((ship) => ship.id));
  for (const spec of FLEET) {
    const item = document.createElement("li");
    item.dataset.ship = spec.id;
    item.classList.toggle("placed", placed.has(spec.id));
    item.classList.toggle("current", spec.id === nextId);

    const silhouette = document.createElement("span");
    silhouette.className = "dock-hull";
    silhouette.style.setProperty("--len", String(spec.length));
    silhouette.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = `${spec.name} (${spec.length})`;

    item.append(silhouette, label);
    dock.append(item);
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
