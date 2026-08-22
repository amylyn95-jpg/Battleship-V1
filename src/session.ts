import { emptyBoard, isFleetComplete, randomFleet } from "./board.js";
import { createAi, nextShot, recordResult } from "./ai.js";
import { fire } from "./game.js";
import { FLEET } from "./types.js";
import type { AiState } from "./ai.js";
import type { Board, Coord, Difficulty, Phase, Player, ShipSpec, ShotResult } from "./types.js";

export interface Session {
  phase: Phase;
  difficulty: Difficulty;
  turn: Player;
  /** The human's board; the AI fires at this one. */
  playerBoard: Board;
  /** The AI's board; the human fires at this one. */
  aiBoard: Board;
  ai: AiState;
  playerShots: ShotResult[];
  aiShots: ShotResult[];
  winner: Player | null;
}

export function newSession(difficulty: Difficulty): Session {
  return {
    phase: "placement",
    difficulty,
    turn: "human",
    playerBoard: emptyBoard(),
    aiBoard: randomFleet(),
    ai: createAi(difficulty),
    playerShots: [],
    aiShots: [],
    winner: null,
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
}

/** Resolves the human's shot at the AI's board. */
export function playerFire(session: Session, coord: Coord): ShotResult {
  if (session.phase !== "playing") throw new Error("Not in the playing phase");
  if (session.turn !== "human") throw new Error("Not the player's turn");

  const { board, result } = fire(session.aiBoard, coord);
  session.aiBoard = board;
  session.playerShots.push(result);

  if (result.fleetDestroyed) {
    session.phase = "gameover";
    session.winner = "human";
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
  } else {
    session.turn = "human";
  }
  return result;
}

const STORAGE_KEY = "battleship.session.v1";

interface SerializedSession {
  phase: Phase;
  difficulty: Difficulty;
  turn: Player;
  playerBoard: Board;
  aiBoard: Board;
  playerShots: ShotResult[];
  aiShots: ShotResult[];
  winner: Player | null;
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
    turn: session.turn,
    playerBoard: session.playerBoard,
    aiBoard: session.aiBoard,
    playerShots: session.playerShots,
    aiShots: session.aiShots,
    winner: session.winner,
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
    turn: data.turn,
    playerBoard: data.playerBoard,
    aiBoard: data.aiBoard,
    playerShots: data.playerShots,
    aiShots: data.aiShots,
    winner: data.winner,
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
