import { canPlace, inBounds, placeShip, randomFleet, shipCells, emptyBoard, isFleetComplete } from "./board.js";
import { candidateCells, createAi } from "./ai.js";
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
import { BOARD_SIZE, FLEET } from "./types.js";
import type { Coord, Difficulty, Mode, Orientation, Phase, ShotResult } from "./types.js";
import {
  buildGrid,
  cellIndex,
  clearPreview,
  coordLabel,
  paintBoard,
  paintDock,
  paintFleet,
  showPreview,
  showTargets,
} from "./ui.js";
import {
  isMuted,
  playFire,
  playHit,
  playLose,
  playMiss,
  playSunk,
  playWin,
  setMuted,
} from "./sound.js";
import {
  applyOutcome,
  clearStats,
  gamesPlayed,
  loadStats,
  saveStats,
  winRate,
} from "./stats.js";
import type { Session } from "./session.js";
import type { Stats } from "./stats.js";

/** Pause between the enemy settling on a cell and the shot landing. */
const AI_THINK_MS = 160;
/** Gap between the cells the enemy visibly weighs before it fires. */
const SCAN_STEP_MS = 130;
/** How many cells the enemy is shown weighing; the last one is its lead. */
const SCAN_CELLS = 3;
/** Salvo mode shot clock. */
const TURN_SECONDS = 20;
const SHAKE_MS = 420;

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
  startHint: required<HTMLParagraphElement>("start-hint"),
  dock: required<HTMLUListElement>("dock"),
  stepPlace: required<HTMLLIElement>("step-place"),
  stepStart: required<HTMLLIElement>("step-start"),
  stepFire: required<HTMLLIElement>("step-fire"),
  mute: required<HTMLButtonElement>("mute"),
  muteIcon: required<HTMLSpanElement>("mute-icon"),
  muteLabel: required<HTMLSpanElement>("mute-label"),
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
  gameoverRecord: required<HTMLParagraphElement>("gameover-record"),
  rematch: required<HTMLButtonElement>("rematch"),
  statsSummary: required<HTMLElement>("stats-summary"),
  statsToggle: required<HTMLButtonElement>("stats-toggle"),
  statsBreakdown: required<HTMLDivElement>("stats-breakdown"),
  statsRows: required<HTMLTableSectionElement>("stats-rows"),
  statsReset: required<HTMLButtonElement>("stats-reset"),
};

let session: Session = load() ?? newSession("normal");
let stats: Stats = loadStats();
let orientation: Orientation = "horizontal";
let cursor: Coord = { row: 0, col: 0 };
/** True while the AI's delayed shot is pending, to lock out player input. */
let aiThinking = false;
/** Salvo mode: id of the shot-clock interval, and when the clock runs out. */
let clockTimer: number | null = null;
let clockEndsAt = 0;
/** Pending timers for the enemy's visible scan, so a reset can cancel them. */
let scanTimers: number[] = [];

const playerCells = buildGrid(dom.playerBoard, handlePlacementClick);
const aiCells = buildGrid(dom.aiBoard, handleFireClick);

dom.difficulty.value = session.difficulty;
dom.mode.value = session.mode;

function setStatus(html: string): void {
  dom.status.innerHTML = html;
}

/** Adds to the status without wiping what just happened to the player's shot. */
function appendStatus(html: string): void {
  dom.status.innerHTML += ` <span class="scan-note">${html}</span>`;
}

function statLine(label: string, value: string): HTMLElement[] {
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  return [term, detail];
}

/** Combined record up top; the per-difficulty and per-mode split is opt-in. */
function renderStats(): void {
  const played = gamesPlayed(stats);
  dom.statsSummary.textContent = "";
  dom.statsSummary.append(
    ...statLine("Record", `${stats.wins}W - ${stats.losses}L`),
    ...statLine("Win rate", played === 0 ? "--" : `${winRate(stats)}%`),
    ...statLine("Streak", `${stats.currentStreak} (best ${stats.bestStreak})`),
    ...statLine("Best win", stats.bestShots === null ? "--" : `${stats.bestShots} shots`),
    ...statLine(
      "Best accuracy",
      stats.bestAccuracy === 0 ? "--" : `${Math.round(stats.bestAccuracy * 100)}%`,
    ),
  );

  dom.statsRows.textContent = "";
  const rows: [string, { wins: number; losses: number }][] = [
    ["Easy", stats.byDifficulty.easy],
    ["Normal", stats.byDifficulty.normal],
    ["Hard", stats.byDifficulty.hard],
    ["Classic", stats.byMode.classic],
    ["Salvo", stats.byMode.salvo],
  ];
  for (const [label, tally] of rows) {
    const tr = document.createElement("tr");
    for (const text of [label, String(tally.wins), String(tally.losses)]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    }
    dom.statsRows.append(tr);
  }
}

/**
 * Records the finished game once, at the moment it ends. Doing this on the
 * transition rather than in render() keeps a reload on the game-over screen
 * from counting the same game twice.
 */
function recordFinishedGame(): void {
  stats = applyOutcome(stats, {
    won: session.winner === "human",
    difficulty: session.difficulty,
    mode: session.mode,
    shots: shotsFired(session.aiBoard),
    accuracy: accuracy(session.aiBoard),
  });
  saveStats(stats);
  renderStats();
}

function showMuteState(): void {
  const muted = isMuted();
  dom.mute.setAttribute("aria-pressed", String(muted));
  dom.muteIcon.textContent = muted ? "\u{1F507}" : "\u{1F50A}";
  dom.muteLabel.textContent = muted ? "Sound off" : "Sound on";
}

function clearScan(): void {
  for (const timer of scanTimers) window.clearTimeout(timer);
  scanTimers = [];
  for (const cell of playerCells) cell.classList.remove("scanning", "scanning-lock");
}

/**
 * Shows the cells the enemy is weighing, one at a time, ending on its strongest
 * lead. Built from the opponent's own shot history, so it reveals nothing about
 * where the player's ships actually are. Returns how long the build-up runs.
 */
function showScan(): number {
  clearScan();
  const wanted = session.mode === "salvo" ? SCAN_CELLS + 1 : SCAN_CELLS;
  const candidates = candidateCells(session.ai, wanted);
  candidates.forEach((coord, index) => {
    const cell = playerCells[cellIndex(coord)]!;
    const last = index === candidates.length - 1;
    scanTimers.push(
      window.setTimeout(() => {
        cell.classList.add("scanning");
        if (last) cell.classList.add("scanning-lock");
      }, index * SCAN_STEP_MS),
    );
  });
  return candidates.length * SCAN_STEP_MS;
}

function shake(): void {
  document.body.classList.add("shake");
  window.setTimeout(() => document.body.classList.remove("shake"), SHAKE_MS);
}

/** Plays the loudest thing that happened in a volley, and shakes on a sinking. */
function playResults(results: readonly ShotResult[]): void {
  playFire();
  if (results.some((r) => r.sunk)) {
    playSunk();
    shake();
  } else if (results.some((r) => r.hit)) {
    playHit();
  } else {
    playMiss();
  }
  const destroyed = results.find((r) => r.fleetDestroyed);
  if (destroyed) window.setTimeout(() => (session.winner === "human" ? playWin() : playLose()), 450);
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

/** True when the game just ended, after folding the result into the record. */
function finishedNow(): boolean {
  if (currentPhase() !== "gameover") return false;
  recordFinishedGame();
  return true;
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
  const ready = isFleetComplete(session.playerBoard);
  dom.startBattle.disabled = !ready;

  // Step strip: highlight what the player has to do next, so "Start battle"
  // never looks like a dead button with no explanation.
  dom.stepPlace.classList.toggle("active", placing && !ready);
  dom.stepPlace.classList.toggle("done", ready || !placing);
  dom.stepStart.classList.toggle("active", placing && ready);
  dom.stepStart.classList.toggle("done", !placing);
  dom.stepFire.classList.toggle("active", !placing);

  if (placing) {
    const next = nextShipToPlace(session);
    dom.placementPrompt.textContent = next
      ? `Place your ${next.name} (${next.length} cells, ${orientation}) — click a square on your waters.`
      : "Fleet ready. Start the battle!";
    paintDock(dom.dock, session.playerBoard, next?.id ?? null);
    const left = FLEET.length - session.playerBoard.ships.length;
    dom.startHint.textContent = ready
      ? ""
      : `${left} ship${left === 1 ? "" : "s"} left to place — or use Random fleet.`;
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
    dom.gameoverRecord.textContent = `Record: ${stats.wins}W - ${stats.losses}L | streak ${stats.currentStreak} (best ${stats.bestStreak}).`;
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
  playResults(results);
  const prefix = timedOut ? "Time! " : "";
  setStatus(prefix + describeSalvo(results, "Your"));
  if (finishedNow()) {
    render();
    return;
  }
  render();
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
  playResults([result]);
  setStatus(describe(result, "You"));
  if (finishedNow()) {
    render();
    return;
  }
  render();
  scheduleAiTurn();
}

function scheduleAiTurn(): void {
  aiThinking = true;
  render();
  const scanMs = showScan();
  appendStatus("The enemy is scanning your waters&hellip;");
  window.setTimeout(() => {
    aiThinking = false;
    clearScan();
    // Read through a helper so a stale narrowing from before the timeout does
    // not convince the compiler the phase cannot have changed.
    if (currentPhase() !== "playing" || session.turn !== "ai") {
      render();
      return;
    }
    if (session.mode === "salvo") {
      const volley = aiSalvo(session);
      playResults(volley);
      setStatus(describeSalvo(volley, "Enemy"));
      finishedNow();
      render();
      startClock();
      return;
    }
    const result = aiFire(session);
    playResults([result]);
    setStatus(describe(result, "The enemy"));
    finishedNow();
    render();
  }, AI_THINK_MS + scanMs);
}

function resetGame(
  difficulty: Difficulty = session.difficulty,
  mode: Mode = session.mode,
): void {
  clearSaved();
  stopClock();
  clearScan();
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

dom.statsToggle.addEventListener("click", () => {
  const open = dom.statsBreakdown.classList.toggle("hidden");
  dom.statsToggle.setAttribute("aria-expanded", String(!open));
  dom.statsToggle.textContent = open ? "Show breakdown" : "Hide breakdown";
});

dom.statsReset.addEventListener("click", () => {
  clearStats();
  stats = loadStats();
  renderStats();
  setStatus("Record cleared.");
});

dom.mute.addEventListener("click", () => {
  setMuted(!isMuted());
  showMuteState();
});

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

showMuteState();
renderStats();
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
