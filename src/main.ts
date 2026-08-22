import { canPlace, inBounds, placeShip, randomFleet, shipCells, emptyBoard, isFleetComplete } from "./board.js";
import { createAi } from "./ai.js";
import { accuracy, shotsFired } from "./game.js";
import {
  aiFire,
  aiSalvo,
  clearSaved,
  fillTargets,
  load,
  newSession,
  nextShipToPlace,
  playerFire,
  playerSalvo,
  playerSalvoSize,
  save,
  startBattle,
  toggleTarget,
} from "./session.js";
import { BOARD_SIZE } from "./types.js";
import type { Coord, Difficulty, Mode, Orientation, Phase, ShotResult } from "./types.js";
import {
  buildGrid,
  cellIndex,
  clearPreview,
  coordLabel,
  paintBoard,
  paintFleet,
  showPreview,
  showTargets,
} from "./ui.js";
import type { Session } from "./session.js";

const AI_THINK_MS = 550;
/** Salvo mode shot clock. */
const TURN_SECONDS = 20;

function required<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const dom = {
  playerBoard: required<HTMLDivElement>("player-board"),
  aiBoard: required<HTMLDivElement>("ai-board"),
  playerFleet: required<HTMLUListElement>("player-fleet"),
  aiFleet: required<HTMLUListElement>("ai-fleet"),
  status: required<HTMLParagraphElement>("status"),
  placementPanel: required<HTMLElement>("placement-panel"),
  placementPrompt: required<HTMLParagraphElement>("placement-prompt"),
  rotate: required<HTMLButtonElement>("rotate"),
  randomFleet: required<HTMLButtonElement>("random-fleet"),
  resetFleet: required<HTMLButtonElement>("reset-fleet"),
  startBattle: required<HTMLButtonElement>("start-battle"),
  difficulty: required<HTMLSelectElement>("difficulty"),
  mode: required<HTMLSelectElement>("mode"),
  salvoBar: required<HTMLElement>("salvo-bar"),
  salvoCount: required<HTMLSpanElement>("salvo-count"),
  salvoTimer: required<HTMLSpanElement>("salvo-timer"),
  fireSalvo: required<HTMLButtonElement>("fire-salvo"),
  newGame: required<HTMLButtonElement>("new-game"),
  gameover: required<HTMLDivElement>("gameover"),
  gameoverTitle: required<HTMLHeadingElement>("gameover-title"),
  gameoverStats: required<HTMLParagraphElement>("gameover-stats"),
  rematch: required<HTMLButtonElement>("rematch"),
};

let session: Session = load() ?? newSession("normal");
let orientation: Orientation = "horizontal";
let cursor: Coord = { row: 0, col: 0 };
/** True while the AI's delayed shot is pending, to lock out player input. */
let aiThinking = false;
/** Salvo mode: id of the shot-clock interval, and when the clock runs out. */
let clockTimer: number | null = null;
let clockEndsAt = 0;

const playerCells = buildGrid(dom.playerBoard, handlePlacementClick);
const aiCells = buildGrid(dom.aiBoard, handleFireClick);

dom.difficulty.value = session.difficulty;
dom.mode.value = session.mode;

function setStatus(html: string): void {
  dom.status.innerHTML = html;
}

/**
 * Salvo feedback is deliberately vague: only the number of hits, never which
 * shots landed. Sinkings are still announced because the board reveals them.
 */
function describeSalvo(results: readonly ShotResult[], actor: "Your" | "Enemy"): string {
  const hits = results.filter((r) => r.hit).length;
  const sunk = results.filter((r) => r.sunk).map((r) => r.sunk!.name);
  const tally =
    hits === 0
      ? `${actor} salvo of ${results.length}: all misses.`
      : `${actor} salvo of ${results.length}: <span class="hit-text">${hits} hit${hits === 1 ? "" : "s"}</span>!`;
  if (sunk.length === 0) return tally;
  const owner = actor === "Your" ? "Sank the" : "They sank your";
  return `${tally} <span class="sunk-text">${owner} ${sunk.join(" and ")}</span>!`;
}

function describe(result: ShotResult, actor: "You" | "The enemy"): string {
  const where = coordLabel(result.coord);
  if (result.sunk) {
    const verb = actor === "You" ? "sank" : "sank your";
    return `${actor} hit ${where} and <span class="sunk-text">${verb} ${result.sunk.name}</span>!`;
  }
  if (result.hit) return `${actor} <span class="hit-text">hit</span> at ${where}.`;
  return `${actor} missed at ${where}.`;
}

function currentPhase(): Phase {
  return session.phase;
}

function lastShotOf(shots: readonly ShotResult[]): Coord | null {
  return shots.length > 0 ? shots[shots.length - 1]!.coord : null;
}

function render(): void {
  const salvo = session.mode === "salvo";
  paintBoard(playerCells, session.playerBoard, true, lastShotOf(session.aiShots));
  // The enemy fleet is only revealed once the game is over. In salvo mode the
  // outcome of each shot stays hidden until the ship it belongs to sinks.
  paintBoard(
    aiCells,
    session.aiBoard,
    session.phase === "gameover",
    lastShotOf(session.playerShots),
    salvo,
  );
  if (salvo) showTargets(aiCells, session.pendingTargets);
  paintFleet(dom.playerFleet, session.playerBoard.ships);
  paintFleet(dom.aiFleet, session.aiBoard.ships);

  const placing = session.phase === "placement";
  dom.placementPanel.classList.toggle("hidden", !placing);
  dom.aiBoard.classList.toggle("targetable", session.phase === "playing" && session.turn === "human");
  dom.startBattle.disabled = !isFleetComplete(session.playerBoard);

  if (placing) {
    const next = nextShipToPlace(session);
    dom.placementPrompt.textContent = next
      ? `Place your ${next.name} (${next.length} cells, ${orientation}).`
      : "Fleet ready. Start the battle!";
  }

  const playerTurn = session.phase === "playing" && session.turn === "human" && !aiThinking;
  for (const cell of aiCells) {
    const fired = cell.classList.contains("fired");
    cell.disabled = !playerTurn || fired;
  }

  dom.salvoBar.classList.toggle("hidden", !salvo || session.phase !== "playing");
  if (salvo) {
    const picked = session.pendingTargets.length;
    dom.salvoCount.textContent = `Targets ${picked}/${playerSalvoSize(session)}`;
    dom.fireSalvo.disabled = !playerTurn || picked === 0;
    if (!playerTurn) dom.salvoTimer.textContent = "--";
  }
  for (const cell of playerCells) {
    cell.disabled = session.phase !== "placement";
  }

  dom.gameover.classList.toggle("hidden", session.phase !== "gameover");
  if (session.phase === "gameover") {
    const playerWon = session.winner === "human";
    dom.gameoverTitle.textContent = playerWon ? "Victory!" : "Defeat";
    const shots = shotsFired(session.aiBoard);
    const acc = Math.round(accuracy(session.aiBoard) * 100);
    dom.gameoverStats.textContent = playerWon
      ? `You won in ${shots} shots (${acc}% accuracy).`
      : `The enemy sank your fleet in ${shotsFired(session.playerBoard)} shots. You fired ${shots} (${acc}% accuracy).`;
    dom.rematch.focus();
  }

  save(session);
}

function handlePlacementClick(coord: Coord): void {
  if (session.phase !== "placement") return;
  const spec = nextShipToPlace(session);
  if (!spec) return;
  if (!canPlace(session.playerBoard, spec, coord, orientation)) {
    setStatus(`The ${spec.name} does not fit there.`);
    return;
  }
  session.playerBoard = placeShip(session.playerBoard, spec, coord, orientation);
  const next = nextShipToPlace(session);
  setStatus(next ? `${spec.name} placed. Next: ${next.name}.` : "Fleet ready — start the battle.");
  clearPreview(playerCells);
  render();
}

function previewAt(coord: Coord): void {
  if (session.phase !== "placement") return;
  const spec = nextShipToPlace(session);
  if (!spec) return;
  const cells = shipCells(coord, spec.length, orientation).filter(inBounds);
  showPreview(playerCells, cells, canPlace(session.playerBoard, spec, coord, orientation));
}

function stopClock(): void {
  if (clockTimer !== null) window.clearInterval(clockTimer);
  clockTimer = null;
}

function tickClock(): void {
  const left = Math.max(0, Math.ceil((clockEndsAt - Date.now()) / 1000));
  dom.salvoTimer.textContent = `${left}s`;
  dom.salvoTimer.classList.toggle("urgent", left <= 5);
  if (left > 0) return;
  stopClock();
  // Out of time: the rest of the salvo is fired blind.
  fillTargets(session);
  fireSalvo(true);
}

/** Starts the shot clock for the human's salvo turn. */
function startClock(): void {
  stopClock();
  if (session.mode !== "salvo" || session.phase !== "playing" || session.turn !== "human") return;
  clockEndsAt = Date.now() + TURN_SECONDS * 1000;
  tickClock();
  clockTimer = window.setInterval(tickClock, 200);
}

function fireSalvo(timedOut = false): void {
  if (session.phase !== "playing" || session.turn !== "human" || aiThinking) return;
  if (session.pendingTargets.length === 0) return;
  stopClock();

  const results = playerSalvo(session);
  const prefix = timedOut ? "Time! " : "";
  setStatus(prefix + describeSalvo(results, "Your"));
  render();

  if (currentPhase() === "gameover") return;
  scheduleAiTurn();
}

function handleFireClick(coord: Coord): void {
  if (session.phase !== "playing" || session.turn !== "human" || aiThinking) return;

  if (session.mode === "salvo") {
    toggleTarget(session, coord);
    render();
    return;
  }

  let result: ShotResult;
  try {
    result = playerFire(session, coord);
  } catch {
    return;
  }
  setStatus(describe(result, "You"));
  render();

  if (currentPhase() === "gameover") return;
  scheduleAiTurn();
}

function scheduleAiTurn(): void {
  aiThinking = true;
  render();
  window.setTimeout(() => {
    aiThinking = false;
    // Read through a helper so a stale narrowing from before the timeout does
    // not convince the compiler the phase cannot have changed.
    if (currentPhase() !== "playing" || session.turn !== "ai") {
      render();
      return;
    }
    if (session.mode === "salvo") {
      setStatus(describeSalvo(aiSalvo(session), "Enemy"));
      render();
      startClock();
      return;
    }
    const result = aiFire(session);
    setStatus(describe(result, "The enemy"));
    render();
  }, AI_THINK_MS);
}

function resetGame(
  difficulty: Difficulty = session.difficulty,
  mode: Mode = session.mode,
): void {
  clearSaved();
  stopClock();
  session = newSession(difficulty, mode);
  aiThinking = false;
  orientation = "horizontal";
  setStatus("Place your fleet to begin.");
  render();
}

dom.rotate.addEventListener("click", () => {
  orientation = orientation === "horizontal" ? "vertical" : "horizontal";
  previewAt(cursor);
  render();
});

dom.randomFleet.addEventListener("click", () => {
  if (session.phase !== "placement") return;
  session.playerBoard = randomFleet();
  setStatus("Fleet placed at random — start the battle.");
  render();
});

dom.resetFleet.addEventListener("click", () => {
  if (session.phase !== "placement") return;
  session.playerBoard = emptyBoard();
  setStatus("Fleet cleared.");
  render();
});

dom.startBattle.addEventListener("click", () => {
  if (session.phase !== "placement" || !isFleetComplete(session.playerBoard)) return;
  startBattle(session);
  setStatus(
    session.mode === "salvo"
      ? "Battle stations — pick one target per surviving ship, then fire."
      : "Battle stations — fire at the enemy waters.",
  );
  render();
  startClock();
});

dom.fireSalvo.addEventListener("click", () => fireSalvo());

dom.mode.addEventListener("change", () => {
  const mode = dom.mode.value as Mode;
  if (session.phase === "placement") {
    session.mode = mode;
    setStatus(
      mode === "salvo"
        ? "Salvo mode: one shot per surviving ship each turn, on a 20 second clock."
        : "Classic mode: one shot per turn.",
    );
    render();
  } else {
    resetGame(session.difficulty, mode);
  }
});

dom.newGame.addEventListener("click", () =>
  resetGame(dom.difficulty.value as Difficulty, dom.mode.value as Mode),
);
dom.rematch.addEventListener("click", () => resetGame());

dom.difficulty.addEventListener("change", () => {
  const difficulty = dom.difficulty.value as Difficulty;
  if (session.phase === "placement") {
    session.difficulty = difficulty;
    session.ai = createAi(difficulty);
    setStatus(`Difficulty set to ${difficulty}.`);
    render();
  } else {
    resetGame(difficulty);
  }
});

for (const [cells, onEnter] of [
  [playerCells, (c: Coord) => previewAt(c)],
  [aiCells, () => clearPreview(playerCells)],
] as const) {
  cells.forEach((cell, index) => {
    const coord: Coord = { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
    cell.addEventListener("mouseenter", () => {
      cursor = coord;
      onEnter(coord);
    });
    cell.addEventListener("focus", () => {
      cursor = coord;
      onEnter(coord);
    });
  });
}

dom.playerBoard.addEventListener("mouseleave", () => clearPreview(playerCells));

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && session.phase === "placement") {
    dom.rotate.click();
    return;
  }
  if (event.key.toLowerCase() === "f" && session.mode === "salvo") {
    fireSalvo();
    return;
  }
  const deltas: Record<string, Coord> = {
    ArrowUp: { row: -1, col: 0 },
    ArrowDown: { row: 1, col: 0 },
    ArrowLeft: { row: 0, col: -1 },
    ArrowRight: { row: 0, col: 1 },
  };
  const delta = deltas[event.key];
  if (!delta) return;
  const active = document.activeElement as HTMLElement | null;
  if (!active?.classList.contains("cell")) return;
  event.preventDefault();
  const next: Coord = {
    row: Math.min(BOARD_SIZE - 1, Math.max(0, cursor.row + delta.row)),
    col: Math.min(BOARD_SIZE - 1, Math.max(0, cursor.col + delta.col)),
  };
  const board = active.closest("#player-board") ? playerCells : aiCells;
  board[cellIndex(next)]!.focus();
});

setStatus(
  session.phase === "placement"
    ? "Place your fleet to begin."
    : session.phase === "playing"
      ? "Game restored — fire at the enemy waters."
      : "Game over.",
);
render();

// A game saved while the AI's shot was still pending would otherwise reload
// with the board locked and nothing left to trigger the AI's turn.
if (session.phase === "playing" && session.turn === "ai") {
  scheduleAiTurn();
} else {
  // The shot clock is not persisted; a reload hands back a full turn.
  startClock();
}
