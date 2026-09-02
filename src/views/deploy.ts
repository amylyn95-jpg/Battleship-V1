import type { Board, Coord, Orientation, ShipId } from "../types.js";
import { FLEET } from "../types.js";
import { isFleetComplete } from "../board.js";
import {
  paintBoard,
  paintDock,
  paintOwnFleet,
} from "../ui.js";

export interface DeployViewDom {
  root: HTMLElement;
  playerBoard: HTMLElement;
  playerFleet: HTMLElement;
  placementPrompt: HTMLElement;
  rotate: HTMLButtonElement;
  randomFleet: HTMLButtonElement;
  resetFleet: HTMLButtonElement;
  engage: HTMLButtonElement;
  startHint: HTMLElement;
  dock: HTMLElement;
  stepPlace: HTMLElement;
  stepStart: HTMLElement;
  stepFire: HTMLElement;
}

export interface DeployViewState {
  board: Board;
  cells: readonly HTMLButtonElement[];
  orientation: Orientation;
  selectedShipId: ShipId | null;
  preview: (coord: Coord) => void;
  clearPreview: () => void;
}

export function renderDeploy(dom: DeployViewDom, state: DeployViewState, visible: boolean): void {
  dom.root.classList.toggle("hidden", !visible);
  if (!visible) return;
  paintBoard(state.cells, state.board, true, null);
  paintOwnFleet(dom.playerFleet, state.board.ships);
  const ready = isFleetComplete(state.board);
  paintDock(dom.dock, state.board, state.selectedShipId);
  const selected = FLEET.find((spec) => spec.id === state.selectedShipId);
  dom.placementPrompt.textContent = selected
    ? `Place your ${selected.name} (${selected.length} cells, ${state.orientation}) — click a square on your waters.`
    : "Fleet ready. Engage the enemy!";
  dom.engage.disabled = !ready;
  dom.startHint.textContent = ready
    ? ""
    : `${FLEET.length - state.board.ships.length} ship${FLEET.length - state.board.ships.length === 1 ? "" : "s"} left to place — or use Random fleet.`;
  dom.stepPlace.classList.toggle("active", !ready);
  dom.stepPlace.classList.toggle("done", ready);
  dom.stepStart.classList.toggle("active", ready);
  dom.stepStart.classList.remove("done");
  dom.stepFire.classList.remove("active");
}

export function setupDeployDrag(
  dock: HTMLElement,
  cells: readonly HTMLButtonElement[],
  callbacks: {
    select: (id: ShipId) => void;
    preview: (id: ShipId, coord: Coord) => void;
    drop: (id: ShipId, coord: Coord) => void;
    clear: () => void;
  },
): void {
  let draggedShip: ShipId | null = null;
  dock.addEventListener("click", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>("[data-ship]");
    const id = item?.dataset.ship as ShipId | undefined;
    if (id) callbacks.select(id);
  });
  dock.addEventListener("dragstart", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>("[data-ship]");
    const id = item?.dataset.ship as ShipId | undefined;
    if (!id || item?.classList.contains("placed")) return;
    draggedShip = id;
    event.dataTransfer?.setData("text/plain", id);
  });
  dock.addEventListener("dragend", () => {
    draggedShip = null;
    callbacks.clear();
  });
  cells.forEach((cell, index) => {
    const coord = { row: Math.floor(index / 10), col: index % 10 };
    cell.addEventListener("dragover", (event) => {
      const id = draggedShip ?? (event.dataTransfer?.getData("text/plain") as ShipId | undefined);
      if (!id) return;
      event.preventDefault();
      callbacks.preview(id, coord);
    });
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      const id = draggedShip ?? (event.dataTransfer?.getData("text/plain") as ShipId | undefined);
      if (id) callbacks.drop(id, coord);
      draggedShip = null;
      callbacks.clear();
    });
  });
}
