import type { Difficulty, Mode } from "./types.js";

/** Win/loss tally, used for the combined record and each breakdown row. */
export interface Tally {
  wins: number;
  losses: number;
}

export interface Stats {
  /** Combined record across every difficulty and mode. */
  wins: number;
  losses: number;
  /** Fewest shots taken in a win, null until the first win. */
  bestShots: number | null;
  /** Best accuracy in a win, 0..1. */
  bestAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byDifficulty: { [key in Difficulty]: Tally };
  byMode: { [key in Mode]: Tally };
}

export interface GameOutcome {
  won: boolean;
  difficulty: Difficulty;
  mode: Mode;
  /** Shots the human fired this game. */
  shots: number;
  /** The human's accuracy this game, 0..1. */
  accuracy: number;
}

const STORAGE_KEY = "battleship.stats.v1";

export function emptyStats(): Stats {
  return {
    wins: 0,
    losses: 0,
    bestShots: null,
    bestAccuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    byDifficulty: {
      easy: { wins: 0, losses: 0 },
      normal: { wins: 0, losses: 0 },
      hard: { wins: 0, losses: 0 },
    },
    byMode: {
      classic: { wins: 0, losses: 0 },
      salvo: { wins: 0, losses: 0 },
    },
  };
}

/** Folds a finished game into the running record. Pure, so it is easy to test. */
export function applyOutcome(stats: Stats, outcome: GameOutcome): Stats {
  const next = structuredClone(stats);
  const difficulty = next.byDifficulty[outcome.difficulty];
  const mode = next.byMode[outcome.mode];

  if (outcome.won) {
    next.wins++;
    difficulty.wins++;
    mode.wins++;
    next.currentStreak++;
    next.bestStreak = Math.max(next.bestStreak, next.currentStreak);
    next.bestShots =
      next.bestShots === null ? outcome.shots : Math.min(next.bestShots, outcome.shots);
    next.bestAccuracy = Math.max(next.bestAccuracy, outcome.accuracy);
  } else {
    next.losses++;
    difficulty.losses++;
    mode.losses++;
    next.currentStreak = 0;
  }
  return next;
}

export function gamesPlayed(stats: Stats): number {
  return stats.wins + stats.losses;
}

/** Win rate as a percentage, 0 when nothing has been played yet. */
export function winRate(stats: Stats): number {
  const played = gamesPlayed(stats);
  return played === 0 ? 0 : Math.round((stats.wins / played) * 100);
}

/**
 * Older or hand-edited saves may be missing fields, so every value is checked
 * rather than trusted; anything unreadable falls back to an empty record.
 */
function reviveStats(raw: string): Stats {
  const data = JSON.parse(raw) as Partial<Stats>;
  const tally = (value: Tally | undefined): Tally => ({
    wins: Number(value?.wins) || 0,
    losses: Number(value?.losses) || 0,
  });
  return {
    wins: Number(data.wins) || 0,
    losses: Number(data.losses) || 0,
    bestShots: typeof data.bestShots === "number" ? data.bestShots : null,
    bestAccuracy: Number(data.bestAccuracy) || 0,
    currentStreak: Number(data.currentStreak) || 0,
    bestStreak: Number(data.bestStreak) || 0,
    byDifficulty: {
      easy: tally(data.byDifficulty?.easy),
      normal: tally(data.byDifficulty?.normal),
      hard: tally(data.byDifficulty?.hard),
    },
    byMode: {
      classic: tally(data.byMode?.classic),
      salvo: tally(data.byMode?.salvo),
    },
  };
}

export function loadStats(storage: Storage = localStorage): Stats {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    return reviveStats(raw);
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: Stats, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Private browsing or a full quota should never break the game.
  }
}

export function clearStats(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
