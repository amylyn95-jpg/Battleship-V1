import { describe, expect, it } from "vitest";
import {
  aiSalvo,
  deserialize,
  fillTargets,
  newSession,
  playerSalvo,
  playerSalvoSize,
  serialize,
  startBattle,
  toggleTarget,
} from "../src/session.js";
import { coordKey, randomFleet } from "../src/board.js";
import { cellIndex, cellStates } from "../src/ui.js";
import { BOARD_SIZE } from "../src/types.js";
import type { Coord } from "../src/types.js";

function salvoSession(difficulty: "easy" | "normal" | "hard" = "normal") {
  const session = newSession(difficulty, "salvo");
  session.playerBoard = randomFleet();
  startBattle(session);
  return session;
}

describe("salvo mode", () => {
  it("is off by default", () => {
    expect(newSession("normal").mode).toBe("classic");
    expect(playerSalvoSize(newSession("normal"))).toBe(1);
  });

  it("grants one shot per surviving ship", () => {
    const session = salvoSession();
    expect(playerSalvoSize(session)).toBe(5);

    // Sink the player's destroyer to lose one shot.
    const destroyer = session.playerBoard.ships.find((s) => s.id === "destroyer")!;
    session.playerBoard = {
      ...session.playerBoard,
      ships: session.playerBoard.ships.map((s) =>
        s.id === "destroyer" ? { ...s, hits: [...destroyer.cells] } : s,
      ),
    };
    expect(playerSalvoSize(session)).toBe(4);
  });

  it("caps the selection and toggles duplicates off instead of stacking them", () => {
    const session = salvoSession();
    const target: Coord = { row: 0, col: 0 };

    toggleTarget(session, target);
    toggleTarget(session, target);
    expect(session.pendingTargets).toHaveLength(0);

    for (let col = 0; col < BOARD_SIZE; col++) toggleTarget(session, { row: 4, col });
    expect(session.pendingTargets).toHaveLength(5);
    expect(new Set(session.pendingTargets.map(coordKey)).size).toBe(5);
  });

  it("resolves every selected target in one turn and then hands over", () => {
    const session = salvoSession();
    for (let col = 0; col < 5; col++) toggleTarget(session, { row: 0, col });

    const results = playerSalvo(session);
    expect(results).toHaveLength(5);
    expect(session.aiBoard.shots).toHaveLength(5);
    expect(session.pendingTargets).toHaveLength(0);
    expect(session.turn).toBe("ai");
  });

  it("fills the salvo with legal untried cells when the clock runs out", () => {
    const session = salvoSession();
    toggleTarget(session, { row: 0, col: 0 });
    playerSalvo(session);
    aiSalvo(session);

    fillTargets(session);
    expect(session.pendingTargets).toHaveLength(playerSalvoSize(session));
    for (const target of session.pendingTargets) {
      expect(session.aiBoard.shots.some((s) => coordKey(s) === coordKey(target))).toBe(false);
    }
    expect(new Set(session.pendingTargets.map(coordKey)).size).toBe(
      session.pendingTargets.length,
    );
  });

  it("lets the AI fire a full salvo without repeating a cell", () => {
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const session = salvoSession(difficulty);
      toggleTarget(session, { row: 0, col: 0 });
      playerSalvo(session);

      const results = aiSalvo(session);
      expect(results).toHaveLength(5);
      expect(new Set(session.playerBoard.shots.map(coordKey)).size).toBe(
        session.playerBoard.shots.length,
      );
    }
  });

  it("finishes a full salvo game with a winner", () => {
    const session = salvoSession("hard");
    for (let turn = 0; turn < 200 && session.phase === "playing"; turn++) {
      fillTargets(session);
      playerSalvo(session);
      if (session.phase !== "playing") break;
      aiSalvo(session);
    }
    expect(session.phase).toBe("gameover");
    expect(session.winner).not.toBeNull();
  });

  it("stops mid-salvo once the last ship sinks", () => {
    const session = salvoSession();
    const enemyCells = session.aiBoard.ships.flatMap((s) => s.cells);
    while (session.phase === "playing") {
      const remaining = enemyCells.filter(
        (c) => !session.aiBoard.shots.some((s) => coordKey(s) === coordKey(c)),
      );
      for (const coord of remaining.slice(0, playerSalvoSize(session))) {
        toggleTarget(session, coord);
      }
      const results = playerSalvo(session);
      if (session.phase === "playing") {
        expect(results.some((r) => r.fleetDestroyed)).toBe(false);
        aiSalvo(session);
      } else {
        expect(results[results.length - 1]!.fleetDestroyed).toBe(true);
      }
    }
    expect(session.winner).toBe("human");
  });

  it("hides hit-or-miss on the enemy board until a ship sinks", () => {
    const session = salvoSession();
    const carrier = session.aiBoard.ships.find((s) => s.id === "carrier")!;
    toggleTarget(session, carrier.cells[0]!);
    playerSalvo(session);

    const hidden = cellStates(session.aiBoard, false, true)[cellIndex(carrier.cells[0]!)]!;
    expect(hidden.splash).toBe(true);
    expect(hidden.hit).toBe(false);
    expect(hidden.miss).toBe(false);

    const shown = cellStates(session.aiBoard, false, false)[cellIndex(carrier.cells[0]!)]!;
    expect(shown.hit).toBe(true);
  });

  it("round-trips the mode and pending targets, defaulting old saves to classic", () => {
    const session = salvoSession();
    toggleTarget(session, { row: 2, col: 2 });

    const restored = deserialize(serialize(session));
    expect(restored.mode).toBe("salvo");
    expect(restored.pendingTargets).toEqual(session.pendingTargets);

    const legacy = JSON.parse(serialize(session)) as Record<string, unknown>;
    delete legacy.mode;
    delete legacy.pendingTargets;
    const migrated = deserialize(JSON.stringify(legacy));
    expect(migrated.mode).toBe("classic");
    expect(migrated.pendingTargets).toEqual([]);
  });
});
