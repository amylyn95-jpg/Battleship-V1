import { describe, expect, it } from "vitest";
import { currentHitStreak, longestHitStreak, rating } from "../src/game.js";
import type { ShotResult } from "../src/types.js";

function shot(hit: boolean): ShotResult {
  return { coord: { row: 0, col: 0 }, hit, fleetDestroyed: false };
}

describe("battle statistics", () => {
  it("finds the longest consecutive hit streak", () => {
    expect(longestHitStreak([])).toBe(0);
    expect(longestHitStreak([shot(true), shot(true), shot(false), shot(true)])).toBe(2);
    expect(longestHitStreak([shot(false), shot(true), shot(true), shot(true)])).toBe(3);
  });

  it("finds the consecutive hits at the end of the shot history", () => {
    expect(currentHitStreak([])).toBe(0);
    expect(currentHitStreak([shot(true), shot(true)])).toBe(2);
    expect(currentHitStreak([shot(true), shot(true), shot(false)])).toBe(0);
    expect(currentHitStreak([shot(false), shot(true), shot(true)])).toBe(2);
  });

  it("rates losses by accuracy", () => {
    expect(rating({ won: false, accuracy: 0.34, difficulty: "normal" })).toBe("Cadet");
    expect(rating({ won: false, accuracy: 0.35, difficulty: "normal" })).toBe("Lieutenant");
    expect(rating({ won: false, accuracy: 0.35, difficulty: "hard" })).toBe("Commander");
    expect(rating({ won: false, accuracy: 0.35, difficulty: "easy" })).toBe("Cadet");
  });

  it("rates wins by accuracy and difficulty", () => {
    expect(rating({ won: true, accuracy: 0.24, difficulty: "normal" })).toBe("Lieutenant");
    expect(rating({ won: true, accuracy: 0.25, difficulty: "normal" })).toBe("Commander");
    expect(rating({ won: true, accuracy: 0.35, difficulty: "normal" })).toBe("Admiral");
    expect(rating({ won: true, accuracy: 0.35, difficulty: "hard" })).toBe("Admiral");
    expect(rating({ won: true, accuracy: 0.35, difficulty: "easy" })).toBe("Commander");
    expect(rating({ won: true, accuracy: 0, difficulty: "easy" })).toBe("Cadet");
  });
});
