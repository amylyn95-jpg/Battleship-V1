import { describe, expect, it } from "vitest";
import { vossLine } from "../src/commander.js";

describe("Commander Voss comms", () => {
  it("reports every event branch", () => {
    const lines = [
      vossLine({ kind: "battle-start", difficulty: "easy" }),
      vossLine({ kind: "battle-start", difficulty: "normal" }),
      vossLine({ kind: "battle-start", difficulty: "hard" }),
      vossLine({ kind: "player-shot", hit: true, sunk: null, streak: 1 }),
      vossLine({ kind: "player-shot", hit: false, sunk: null, streak: 0 }),
      vossLine({ kind: "player-shot", hit: true, sunk: "Cruiser", streak: 1 }),
      vossLine({ kind: "player-shot", hit: true, sunk: null, streak: 3 }),
      vossLine({ kind: "enemy-shot", hit: true, sunk: null }),
      vossLine({ kind: "enemy-shot", hit: false, sunk: null }),
      vossLine({ kind: "enemy-shot", hit: true, sunk: "Destroyer" }),
      vossLine({ kind: "victory" }),
      vossLine({ kind: "defeat" }),
    ];
    expect(lines.every((line) => line.length > 0)).toBe(true);
  });

  it("names ships in sinking reports", () => {
    expect(vossLine({ kind: "player-shot", hit: true, sunk: "Cruiser", streak: 1 })).toContain("Cruiser");
    expect(vossLine({ kind: "enemy-shot", hit: true, sunk: "Destroyer" })).toContain("Destroyer");
  });

  it("escalates a hit streak", () => {
    const plain = vossLine({ kind: "player-shot", hit: true, sunk: null, streak: 2 });
    const streak = vossLine({ kind: "player-shot", hit: true, sunk: null, streak: 3 });
    expect(streak).not.toBe(plain);
  });
});
