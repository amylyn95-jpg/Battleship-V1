import { describe, expect, it } from "vitest";
import {
  applyOutcome,
  clearStats,
  emptyStats,
  loadStats,
  saveStats,
  winRate,
} from "../src/stats.js";
import type { GameOutcome } from "../src/stats.js";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function outcome(over: Partial<GameOutcome> = {}): GameOutcome {
  return { won: true, difficulty: "normal", mode: "classic", shots: 40, accuracy: 0.5, ...over };
}

describe("stats", () => {
  it("counts a win in the combined record and in both breakdowns", () => {
    const stats = applyOutcome(emptyStats(), outcome({ difficulty: "hard", mode: "salvo" }));
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(0);
    expect(stats.byDifficulty.hard).toEqual({ wins: 1, losses: 0 });
    expect(stats.byMode.salvo).toEqual({ wins: 1, losses: 0 });
    expect(stats.byDifficulty.easy).toEqual({ wins: 0, losses: 0 });
  });

  it("keeps the best win and best accuracy, not the latest", () => {
    let stats = applyOutcome(emptyStats(), outcome({ shots: 40, accuracy: 0.42 }));
    stats = applyOutcome(stats, outcome({ shots: 31, accuracy: 0.3 }));
    stats = applyOutcome(stats, outcome({ shots: 55, accuracy: 0.61 }));
    expect(stats.bestShots).toBe(31);
    expect(stats.bestAccuracy).toBeCloseTo(0.61);
  });

  it("tracks the current streak and remembers the longest one", () => {
    let stats = emptyStats();
    for (let i = 0; i < 3; i++) stats = applyOutcome(stats, outcome());
    expect(stats.currentStreak).toBe(3);

    stats = applyOutcome(stats, outcome({ won: false }));
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(3);
    expect(stats.losses).toBe(1);

    stats = applyOutcome(stats, outcome());
    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(3);
  });

  it("reports a rounded win rate, and zero before anything is played", () => {
    expect(winRate(emptyStats())).toBe(0);
    let stats = applyOutcome(emptyStats(), outcome());
    stats = applyOutcome(stats, outcome({ won: false }));
    stats = applyOutcome(stats, outcome({ won: false }));
    expect(winRate(stats)).toBe(33);
  });

  it("round-trips through storage and can be cleared", () => {
    const storage = new MemoryStorage();
    const stats = applyOutcome(emptyStats(), outcome({ shots: 27 }));
    saveStats(stats, storage);
    expect(loadStats(storage)).toEqual(stats);

    clearStats(storage);
    expect(loadStats(storage)).toEqual(emptyStats());
  });

  it("falls back to an empty record for unreadable or partial saves", () => {
    const storage = new MemoryStorage();
    storage.setItem("battleship.stats.v1", "not json");
    expect(loadStats(storage)).toEqual(emptyStats());

    storage.setItem("battleship.stats.v1", JSON.stringify({ wins: 4 }));
    const revived = loadStats(storage);
    expect(revived.wins).toBe(4);
    expect(revived.bestShots).toBeNull();
    expect(revived.byMode.classic).toEqual({ wins: 0, losses: 0 });
  });
});
