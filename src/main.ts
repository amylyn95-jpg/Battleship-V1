import { canPlace, emptyBoard, inBounds, isFleetComplete, placeShip, randomFleet, shipCells } from "./board.js";
import { createAi } from "./ai.js";
import { appendLog, aiFire, aiSalvo, clearSaved, fillTargets, load, newSession, nextShipToPlace, playerFire, playerSalvo, save, startBattle, toggleTarget } from "./session.js";
import { BOARD_SIZE, FLEET } from "./types.js";
import type { Coord, Difficulty, Mode, Orientation, Phase, ShipId, ShotResult } from "./types.js";
import { buildGrid, cellIndex, clearPreview, showPreview } from "./ui.js";
import { isMuted, playFire, playHit, playLose, playMiss, playSunk, playWin, setMuted } from "./sound.js";
import { renderCommand } from "./views/command.js";
import { renderDeploy, setupDeployDrag } from "./views/deploy.js";
import { describe, describeSalvo, logText, renderBattle } from "./views/battle.js";
import { renderDebrief } from "./views/debrief.js";
import type { Session } from "./session.js";

const AI_THINK_MS = 550;
const TURN_SECONDS = 20;
const SHAKE_MS = 420;
type Screen = "command" | "deploy" | "battle" | "debrief";

function required<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const dom = {
  command: required<HTMLElement>("command-screen"),
  commandDifficulty: required<HTMLSelectElement>("difficulty"),
  commandMode: required<HTMLSelectElement>("mode"),
  difficultyButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-difficulty]")],
  modeButtons: [...document.querySelectorAll<HTMLButtonElement>("[data-mode]")],
  deploy: required<HTMLElement>("deploy-screen"),
  battle: required<HTMLElement>("battle-screen"),
  boardArea: required<HTMLElement>("board-area"),
  playerWrap: required<HTMLElement>("player-wrap"),
  aiWrap: required<HTMLElement>("ai-wrap"),
  playerBoard: required<HTMLDivElement>("player-board"),
  aiBoard: required<HTMLDivElement>("ai-board"),
  playerFleet: required<HTMLUListElement>("player-fleet"),
  aiFleet: required<HTMLUListElement>("ai-fleet"),
  status: required<HTMLParagraphElement>("status"),
  placementPrompt: required<HTMLParagraphElement>("placement-prompt"),
  rotate: required<HTMLButtonElement>("rotate"),
  randomFleet: required<HTMLButtonElement>("random-fleet"),
  resetFleet: required<HTMLButtonElement>("reset-fleet"),
  engage: required<HTMLButtonElement>("engage-enemy"),
  startHint: required<HTMLParagraphElement>("start-hint"),
  dock: required<HTMLUListElement>("dock"),
  steps: required<HTMLElement>("steps"),
  stepPlace: required<HTMLLIElement>("step-place"),
  stepStart: required<HTMLLIElement>("step-start"),
  stepFire: required<HTMLLIElement>("step-fire"),
  mute: required<HTMLButtonElement>("mute"),
  muteIcon: required<HTMLSpanElement>("mute-icon"),
  muteLabel: required<HTMLSpanElement>("mute-label"),
  salvoBar: required<HTMLElement>("salvo-bar"),
  salvoCount: required<HTMLSpanElement>("salvo-count"),
  salvoTimer: required<HTMLSpanElement>("salvo-timer"),
  fireSalvo: required<HTMLButtonElement>("fire-salvo"),
  newGame: required<HTMLButtonElement>("new-game"),
  gameover: required<HTMLDivElement>("gameover"),
  gameoverTitle: required<HTMLHeadingElement>("gameover-title"),
  gameoverStats: required<HTMLDListElement>("gameover-stats"),
  gameoverRating: required<HTMLElement>("gameover-rating"),
  rematch: required<HTMLButtonElement>("rematch"),
  newBattle: required<HTMLButtonElement>("new-battle"),
  changeDifficulty: required<HTMLButtonElement>("change-difficulty"),
  turnBanner: required<HTMLElement>("turn-banner"),
  targetReadout: required<HTMLElement>("target-readout"),
  battleLog: required<HTMLUListElement>("battle-log"),
};

const saved = load();
let session: Session = saved ?? newSession("normal");
let screen: Screen = saved ? (saved.phase === "placement" ? "deploy" : saved.phase === "playing" ? "battle" : "debrief") : "command";
let orientation: Orientation = "horizontal";
let selectedShipId: ShipId | null = nextShipToPlace(session)?.id ?? null;
let cursor: Coord = { row: 0, col: 0 };
let aiming: Coord | null = null;
let aiThinking = false;
let incomingFire = false;
let clockTimer: number | null = null;
let clockEndsAt = 0;
let aiTimer: number | null = null;
let incomingTimer: number | null = null;

const playerCells = buildGrid(dom.playerBoard, handlePlacementClick);
const aiCells = buildGrid(dom.aiBoard, handleFireClick);

function setStatus(html: string): void {
  dom.status.innerHTML = html;
}

function showMuteState(): void {
  const muted = isMuted();
  dom.mute.setAttribute("aria-pressed", String(muted));
  dom.muteIcon.textContent = muted ? "\u{1F507}" : "\u{1F50A}";
  dom.muteLabel.textContent = muted ? "Sound off" : "Sound on";
}

function shake(): void {
  document.body.classList.add("shake");
  window.setTimeout(() => document.body.classList.remove("shake"), SHAKE_MS);
}

function playResults(results: readonly ShotResult[]): void {
  playFire();
  if (results.some((result) => result.sunk)) {
    playSunk();
    shake();
  } else if (results.some((result) => result.hit)) {
    playHit();
  } else {
    playMiss();
  }
  if (results.some((result) => result.fleetDestroyed)) {
    window.setTimeout(() => (session.winner === "human" ? playWin() : playLose()), 450);
  }
}

function appendResultsLog(results: readonly ShotResult[], actor: "you" | "enemy"): void {
  appendLog(session, actor, logText(results, actor, session.mode === "salvo"));
  for (const result of results) {
    if (result.sunk) {
      appendLog(session, actor, actor === "you" ? `You sank the ${result.sunk.name}.` : `The enemy sank your ${result.sunk.name}.`);
    }
  }
}

function currentPhase(): Phase {
  return session.phase;
}

function syncScreenToPhase(): void {
  if (session.phase === "gameover") {
    screen = "debrief";
    aiming = null;
  }
}

function render(): void {
  renderCommand(
    {
      root: dom.command,
      difficulty: dom.commandDifficulty,
      mode: dom.commandMode,
      mute: dom.mute,
      difficultyButtons: dom.difficultyButtons,
      modeButtons: dom.modeButtons,
    },
    screen === "command",
    session.difficulty,
    session.mode,
  );
  renderDeploy(
    {
      root: dom.deploy,
      playerBoard: dom.playerBoard,
      playerFleet: dom.playerFleet,
      placementPrompt: dom.placementPrompt,
      rotate: dom.rotate,
      randomFleet: dom.randomFleet,
      resetFleet: dom.resetFleet,
      engage: dom.engage,
      startHint: dom.startHint,
      dock: dom.dock,
      stepPlace: dom.stepPlace,
      stepStart: dom.stepStart,
      stepFire: dom.stepFire,
    },
    {
      board: session.playerBoard,
      cells: playerCells,
      orientation,
      selectedShipId,
      preview: previewPlacement,
      clearPreview: () => clearPreview(playerCells),
    },
    screen === "deploy",
  );
  renderBattle(
    {
      root: dom.battle,
      playerBoard: dom.playerBoard,
      aiBoard: dom.aiBoard,
      playerFleet: dom.playerFleet,
      aiFleet: dom.aiFleet,
      status: dom.status,
      turnBanner: dom.turnBanner,
      targetReadout: dom.targetReadout,
      battleLog: dom.battleLog,
      salvoBar: dom.salvoBar,
      salvoCount: dom.salvoCount,
      salvoTimer: dom.salvoTimer,
      fireSalvo: dom.fireSalvo,
      stepFire: dom.stepFire,
    },
    session,
    playerCells,
    aiCells,
    aiThinking,
    aiming,
    screen === "battle" || screen === "debrief",
    incomingFire,
  );
  dom.boardArea.classList.toggle("hidden", screen === "command");
  dom.playerWrap.classList.toggle("hidden", screen === "command");
  dom.aiWrap.classList.toggle("hidden", screen === "command" || screen === "deploy");
  dom.steps.classList.toggle("hidden", screen === "command");
  dom.status.classList.toggle("hidden", screen === "command");
  renderDebrief(
    {
      root: dom.gameover,
      title: dom.gameoverTitle,
      stats: dom.gameoverStats,
      rating: dom.gameoverRating,
      rematch: dom.rematch,
      newBattle: dom.newBattle,
      changeDifficulty: dom.changeDifficulty,
    },
    session,
    screen === "debrief",
  );
  if (screen !== "command") save(session);
}

function selectShip(id: ShipId): void {
  if (session.playerBoard.ships.some((ship) => ship.id === id)) return;
  selectedShipId = id;
  render();
}

function placementSpec(id: ShipId | null = selectedShipId) {
  return FLEET.find((spec) => spec.id === (id ?? nextShipToPlace(session)?.id));
}

function placeSelected(coord: Coord, id: ShipId | null = selectedShipId): void {
  if (session.phase !== "placement") return;
  const spec = placementSpec(id);
  if (!spec) return;
  if (!canPlace(session.playerBoard, spec, coord, orientation)) {
    setStatus(`The ${spec.name} does not fit there.`);
    return;
  }
  session.playerBoard = placeShip(session.playerBoard, spec, coord, orientation);
  selectedShipId = nextShipToPlace(session)?.id ?? null;
  setStatus(selectedShipId ? `${spec.name} placed. Next: ${placementSpec()?.name}.` : "Fleet ready — engage the enemy.");
  clearPreview(playerCells);
  render();
}

function handlePlacementClick(coord: Coord): void {
  placeSelected(coord);
}

function previewPlacement(coord: Coord, id: ShipId | null = selectedShipId): void {
  if (session.phase !== "placement") return;
  const spec = placementSpec(id);
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
  fillTargets(session);
  fireSalvo(true);
}

function startClock(): void {
  stopClock();
  if (session.mode !== "salvo" || session.phase !== "playing" || session.turn !== "human") return;
  clockEndsAt = Date.now() + TURN_SECONDS * 1000;
  tickClock();
  clockTimer = window.setInterval(tickClock, 200);
}

function fireSalvo(timedOut = false): void {
  if (session.phase !== "playing" || session.turn !== "human" || aiThinking || session.pendingTargets.length === 0) return;
  stopClock();
  const results = playerSalvo(session);
  appendResultsLog(results, "you");
  playResults(results);
  setStatus(`${timedOut ? "Time! " : ""}${describeSalvo(results, "Your")}`);
  syncScreenToPhase();
  render();
  if (currentPhase() !== "gameover") scheduleAiTurn();
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
  appendResultsLog([result], "you");
  playResults([result]);
  setStatus(describe(result, "You"));
  syncScreenToPhase();
  render();
  if (currentPhase() !== "gameover") scheduleAiTurn();
}

function scheduleAiTurn(): void {
  aiThinking = true;
  incomingFire = false;
  render();
  incomingTimer = window.setTimeout(() => {
    incomingFire = true;
    render();
  }, Math.floor(AI_THINK_MS * 0.65));
  aiTimer = window.setTimeout(() => {
    aiThinking = false;
    incomingFire = false;
    if (currentPhase() !== "playing" || session.turn !== "ai") {
      render();
      return;
    }
    if (session.mode === "salvo") {
      const volley = aiSalvo(session);
      appendResultsLog(volley, "enemy");
      playResults(volley);
      setStatus(describeSalvo(volley, "Enemy"));
      syncScreenToPhase();
      render();
      startClock();
      return;
    }
    const result = aiFire(session);
    appendResultsLog([result], "enemy");
    playResults([result]);
    setStatus(describe(result, "The enemy"));
    syncScreenToPhase();
    render();
    startClock();
  }, AI_THINK_MS);
}

function resetGame(difficulty: Difficulty = session.difficulty, mode: Mode = session.mode, nextScreen: Screen = "deploy"): void {
  clearSaved();
  stopClock();
  if (aiTimer !== null) window.clearTimeout(aiTimer);
  if (incomingTimer !== null) window.clearTimeout(incomingTimer);
  session = newSession(difficulty, mode);
  screen = nextScreen;
  aiThinking = false;
  incomingFire = false;
  orientation = "horizontal";
  selectedShipId = nextShipToPlace(session)?.id ?? null;
  aiming = null;
  setStatus("Place your fleet to begin.");
  render();
}

setupDeployDrag(dom.dock, playerCells, {
  select: selectShip,
  preview: (id, coord) => previewPlacement(coord, id),
  drop: (id, coord) => placeSelected(coord, id),
  clear: () => clearPreview(playerCells),
});

dom.commandDifficulty.addEventListener("change", () => {
  session.difficulty = dom.commandDifficulty.value as Difficulty;
  session.ai = createAi(session.difficulty);
  render();
});
dom.commandMode.addEventListener("change", () => {
  session.mode = dom.commandMode.value as Mode;
  render();
});
for (const button of dom.difficultyButtons) {
  button.addEventListener("click", () => {
    session.difficulty = button.dataset.difficulty as Difficulty;
    session.ai = createAi(session.difficulty);
    render();
  });
}
for (const button of dom.modeButtons) {
  button.addEventListener("click", () => {
    session.mode = button.dataset.mode as Mode;
    render();
  });
}
dom.command.querySelector<HTMLButtonElement>("[data-action='deploy']")!.addEventListener("click", () => {
  screen = "deploy";
  setStatus("Place your fleet to begin.");
  render();
});
dom.rotate.addEventListener("click", () => {
  orientation = orientation === "horizontal" ? "vertical" : "horizontal";
  previewPlacement(cursor);
  render();
});
dom.randomFleet.addEventListener("click", () => {
  if (session.phase !== "placement") return;
  session.playerBoard = randomFleet();
  selectedShipId = null;
  setStatus("Fleet placed at random — engage the enemy.");
  render();
});
dom.resetFleet.addEventListener("click", () => {
  if (session.phase !== "placement") return;
  session.playerBoard = emptyBoard();
  selectedShipId = nextShipToPlace(session)?.id ?? null;
  setStatus("Fleet cleared.");
  render();
});
dom.engage.addEventListener("click", () => {
  if (session.phase !== "placement" || !isFleetComplete(session.playerBoard)) return;
  startBattle(session);
  appendLog(session, "system", "Battle started.");
  screen = "battle";
  setStatus(session.mode === "salvo" ? "Battle stations — pick one target per surviving ship, then fire." : "Battle stations — fire at the enemy waters.");
  render();
  startClock();
});
dom.fireSalvo.addEventListener("click", () => fireSalvo());
dom.mute.addEventListener("click", () => {
  setMuted(!isMuted());
  showMuteState();
});
dom.newGame.addEventListener("click", () => resetGame(dom.commandDifficulty.value as Difficulty, dom.commandMode.value as Mode, "command"));
dom.rematch.addEventListener("click", () => resetGame(session.difficulty, session.mode));
dom.newBattle.addEventListener("click", () => resetGame("normal", "classic", "command"));
dom.changeDifficulty.addEventListener("click", () => {
  resetGame(session.difficulty, session.mode, "command");
  window.setTimeout(() => dom.difficultyButtons[0]?.focus(), 0);
});

for (const [cells, onEnter] of [
  [playerCells, (coord: Coord) => previewPlacement(coord)],
  [aiCells, (coord: Coord) => {
    aiming = coord;
    clearPreview(playerCells);
  }],
] as const) {
  cells.forEach((cell, index) => {
    const coord: Coord = { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
    cell.addEventListener("mouseenter", () => {
      cursor = coord;
      onEnter(coord);
      render();
    });
    cell.addEventListener("focus", () => {
      cursor = coord;
      onEnter(coord);
      render();
    });
    cell.addEventListener("mouseleave", () => {
      if (cells === aiCells) {
        aiming = null;
        render();
      }
    });
    cell.addEventListener("blur", () => {
      if (cells === aiCells) {
        aiming = null;
        render();
      }
    });
  });
}
dom.playerBoard.addEventListener("mouseleave", () => clearPreview(playerCells));
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && screen === "deploy") {
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
  const cells = active.closest("#player-board") ? playerCells : aiCells;
  cells[cellIndex(next)]!.focus();
});

showMuteState();
setStatus(saved ? (session.phase === "playing" ? "Game restored — fire at the enemy waters." : "Game over.") : "Choose your mission parameters.");
render();
if (session.phase === "playing" && session.turn === "ai") scheduleAiTurn();
else startClock();
