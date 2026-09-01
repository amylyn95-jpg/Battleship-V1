import {
  alreadyFiredAt,
  coordKey,
  emptyBoard,
  isFleetComplete,
  randomFleet,
  sameCoord,
} from "./board.js";
import { createAi, nextShot, recordResult } from "./ai.js";
import { fire, salvoSize } from "./game.js";
import { BOARD_SIZE, FLEET } from "./types.js";
import type { AiState } from "./ai.js";
import type {
  Board,
  Coord,
  Difficulty,
  LogEntry,
  Mode,
  Phase,
  Player,
  ShipSpec,
  ShotResult,
} from "./types.js";

export interface Session {
  phase: Phase;
  difficulty: Difficulty;
  mode: Mode;
  turn: Player;
  /** Salvo mode only: cells the human has picked but not yet fired. */
  pendingTargets: Coord[];
  /** The human's board; the AI fires at this one. */
  playerBoard: Board;
  /** The AI's board; the human fires at this one. */
  aiBoard: Board;
  ai: AiState;
  playerShots: ShotResult[];
  aiShots: ShotResult[];
  winner: Player | null;
  turns: number;
  startedAt: number | null;
  endedAt: number | null;
  log: LogEntry[];
}

export function newSession(difficulty: Difficulty, mode: Mode = "classic"): Session {
  return {
    phase: "placement",
    difficulty,
    mode,
    turn: "human",
    pendingTargets: [],
    playerBoard: emptyBoard(),
    aiBoard: randomFleet(),
    ai: createAi(difficulty),
    playerShots: [],
    aiShots: [],
    winner: null,
    turns: 0,
    startedAt: null,
    endedAt: null,
    log: [],
  };
}

export function nextShipToPlace(session: Session): ShipSpec | null {
  return FLEET.find((spec) => !session.playerBoard.ships.some((s) => s.id === spec.id)) ?? null;
}

export function startBattle(session: Session): void {
  if (!isFleetComplete(session.playerBoard)) {
    throw new Error("Cannot start battle before the whole fleet is placed");
  }
  session.phase = "playing";
  session.turn = "human";
  session.pendingTargets = [];
  session.startedAt = Date.now();
  session.endedAt = null;
  session.turns = 0;
  session.log = [];
}

export function appendLog(session: Session, actor: LogEntry["actor"], text: string): void {
  session.log.push({ at: Date.now(), actor, text });
}

/** How many shots the human gets this turn; always 1 outside salvo mode. */
export function playerSalvoSize(session: Session): number {
  return session.mode === "salvo" ? salvoSize(session.playerBoard) : 1;
}

/** How many shots the AI gets this turn; always 1 outside salvo mode. */
export function aiSalvoSize(session: Session): number {
  return session.mode === "salvo" ? salvoSize(session.aiBoard) : 1;
}

/** Adds or removes one of the human's salvo targets. */
export function toggleTarget(session: Session, coord: Coord): void {
  if (session.phase !== "playing" || session.turn !== "human") return;
  if (alreadyFiredAt(session.aiBoard, coord)) return;

  const existing = session.pendingTargets.findIndex((c) => sameCoord(c, coord));
  if (existing >= 0) {
    session.pendingTargets = session.pendingTargets.filter((_, i) => i !== existing);
    return;
  }
  if (session.pendingTargets.length >= playerSalvoSize(session)) return;
  session.pendingTargets = [...session.pendingTargets, coord];
}

/**
 * Tops the human's salvo up to full size with random unfired cells, used when
 * the shot clock expires mid-selection.
 */
export function fillTargets(session: Session, random: () => number = Math.random): void {
  const wanted = playerSalvoSize(session);
  const taken = new Set(session.pendingTargets.map(coordKey));
  const free: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const coord = { row, col };
      if (!alreadyFiredAt(session.aiBoard, coord) && !taken.has(coordKey(coord))) free.push(coord);
    }
  }
  while (session.pendingTargets.length < wanted && free.length > 0) {
    const [choice] = free.splice(Math.floor(random() * free.length), 1);
    session.pendingTargets = [...session.pendingTargets, choice!];
  }
}

/** Resolves every cell the human selected, in one volley. */
export function playerSalvo(session: Session): ShotResult[] {
  if (session.phase !== "playing") throw new Error("Not in the playing phase");
  if (session.turn !== "human") throw new Error("Not the player's turn");
  if (session.pendingTargets.length === 0) throw new Error("No targets selected");
  if (session.pendingTargets.length > playerSalvoSize(session)) {
    throw new Error("More targets than surviving ships");
  }

  const results: ShotResult[] = [];
  for (const coord of session.pendingTargets) {
    const { board, result } = fire(session.aiBoard, coord);
    session.aiBoard = board;
    session.playerShots.push(result);
    results.push(result);
    if (result.fleetDestroyed) break;
  }
  session.pendingTargets = [];
  session.turns++;

  if (results.some((r) => r.fleetDestroyed)) {
    session.phase = "gameover";
    session.winner = "human";
    session.endedAt = Date.now();
  } else {
    session.turn = "ai";
  }
  return results;
}

/**
 * The AI commits to its whole salvo before seeing any outcome, the same
 * constraint the human plays under. Provisional entries stop it spending two
 * shots of one salvo on the same cell.
 */
function chooseSalvo(state: AiState, count: number, random: () => number): Coord[] {
  const probe: AiState = { ...state, tried: new Map(state.tried), queue: [...state.queue] };
  const coords: Coord[] = [];
  for (let i = 0; i < count; i++) {
    let coord: Coord;
    try {
      coord = nextShot(probe, random);
    } catch {
      break;
    }
    coords.push(coord);
    probe.tried.set(coordKey(coord), false);
    probe.queue = probe.queue.filter((c) => !sameCoord(c, coord));
  }
  return coords;
}

export function aiSalvo(session: Session, random: () => number = Math.random): ShotResult[] {
  if (session.phase !== "playing") throw new Error("Not in the playing phase");
  if (session.turn !== "ai") throw new Error("Not the AI's turn");

  const results: ShotResult[] = [];
  for (const coord of chooseSalvo(session.ai, aiSalvoSize(session), random)) {
    const { board, result } = fire(session.playerBoard, coord);
    session.playerBoard = board;
    session.aiShots.push(result);
    recordResult(session.ai, result);
    results.push(result);
    if (result.fleetDestroyed) break;
  }

  if (results.some((r) => r.fleetDestroyed)) {
    session.phase = "gameover";
    session.winner = "ai";
    session.endedAt = Date.now();
  } else {
    session.turn = "human";
  }
  return results;
}

/** Resolves the human's shot at the AI's board. */
export function playerFire(session: Session, coord: Coord): ShotResult {
  if (session.phase !== "playing") throw new Error("Not in the playing phase");
  if (session.turn !== "human") throw new Error("Not the player's turn");

  const { board, result } = fire(session.aiBoard, coord);
  session.aiBoard = board;
  session.playerShots.push(result);
  session.turns++;

  if (result.fleetDestroyed) {
    session.phase = "gameover";
    session.winner = "human";
    session.endedAt = Date.now();
  } else {
    session.turn = "ai";
  }
  return result;
}

/** Resolves the AI's shot at the human's board. */
export function aiFire(session: Session, random: () => number = Math.random): ShotResult {
  if (session.phase !== "playing") throw new Error("Not in the playing phase");
  if (session.turn !== "ai") throw new Error("Not the AI's turn");

  const coord = nextShot(session.ai, random);
  const { board, result } = fire(session.playerBoard, coord);
  session.playerBoard = board;
  session.aiShots.push(result);
  recordResult(session.ai, result);

  if (result.fleetDestroyed) {
    session.phase = "gameover";
    session.winner = "ai";
    session.endedAt = Date.now();
  } else {
    session.turn = "human";
  }
  return result;
}

const STORAGE_KEY = "battleship.session.v1";

export interface SerializedSession {
  phase: Phase;
  difficulty: Difficulty;
  /** Absent in saves written before salvo mode existed. */
  mode?: Mode;
  pendingTargets?: Coord[];
  turn: Player;
  playerBoard: Board;
  aiBoard: Board;
  playerShots: ShotResult[];
  aiShots: ShotResult[];
  winner: Player | null;
  turns?: number;
  startedAt?: number | null;
  endedAt?: number | null;
  log?: LogEntry[];
  ai: {
    difficulty: Difficulty;
    tried: [string, boolean][];
    activeHits: Coord[];
    queue: Coord[];
    axis: AiState["axis"];
    remainingShips: AiState["remainingShips"];
  };
}

export function serialize(session: Session): string {
  const payload: SerializedSession = {
    phase: session.phase,
    difficulty: session.difficulty,
    mode: session.mode,
    pendingTargets: session.pendingTargets,
    turn: session.turn,
    playerBoard: session.playerBoard,
    aiBoard: session.aiBoard,
    playerShots: session.playerShots,
    aiShots: session.aiShots,
    winner: session.winner,
    turns: session.turns,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    log: session.log,
    ai: {
      difficulty: session.ai.difficulty,
      tried: [...session.ai.tried.entries()],
      activeHits: session.ai.activeHits,
      queue: session.ai.queue,
      axis: session.ai.axis,
      remainingShips: session.ai.remainingShips,
    },
  };
  return JSON.stringify(payload);
}

export function deserialize(raw: string): Session {
  const data = JSON.parse(raw) as SerializedSession;
  return {
    phase: data.phase,
    difficulty: data.difficulty,
    mode: data.mode ?? "classic",
    pendingTargets: data.pendingTargets ?? [],
    turn: data.turn,
    playerBoard: data.playerBoard,
    aiBoard: data.aiBoard,
    playerShots: data.playerShots,
    aiShots: data.aiShots,
    winner: data.winner,
    turns: data.turns ?? 0,
    startedAt: data.startedAt ?? null,
    endedAt: data.endedAt ?? null,
    log: data.log ?? [],
    ai: {
      difficulty: data.ai.difficulty,
      tried: new Map(data.ai.tried),
      activeHits: data.ai.activeHits,
      queue: data.ai.queue,
      axis: data.ai.axis,
      remainingShips: data.ai.remainingShips,
    },
  };
}

export function save(session: Session, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, serialize(session));
  } catch {
    // Private browsing or a full quota should never break the game.
  }
}

export function load(storage: Storage = localStorage): Session | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function clearSaved(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
