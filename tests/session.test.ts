import { describe, expect, it } from "vitest";
import {
  aiFire,
  clearSaved,
  deserialize,
  load,
  newSession,
  nextShipToPlace,
  playerFire,
  save,
  serialize,
  startBattle,
} from "../src/session.js";
import { placeShip, randomFleet } from "../src/board.js";
import { FLEET } from "../src/types.js";

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

function readySession() {
  const session = newSession("normal");
  session.playerBoard = randomFleet();
  startBattle(session);
  return session;
}

describe("session flow", () => {
  it("walks the fleet in order during placement", () => {
    const session = newSession("normal");
    expect(nextShipToPlace(session)!.id).toBe("carrier");
    session.playerBoard = placeShip(session.playerBoard, FLEET[0]!, { row: 0, col: 0 }, "horizontal");
    expect(nextShipToPlace(session)!.id).toBe("battleship");
  });

  it("refuses to start with an incomplete fleet", () => {
    expect(() => startBattle(newSession("normal"))).toThrow();
  });

  it("alternates turns and rejects out-of-turn shots", () => {
    const session = readySession();
    playerFire(session, { row: 0, col: 0 });
    expect(session.turn).toBe("ai");
    expect(() => playerFire(session, { row: 0, col: 1 })).toThrow();
    aiFire(session);
    expect(session.turn).toBe("human");
    expect(() => aiFire(session)).toThrow();
  });

  it("declares the player the winner when the enemy fleet sinks", () => {
    const session = readySession();
    const targets = session.aiBoard.ships.flatMap((s) => s.cells);
    const over = () => session.phase === "gameover";
    for (const coord of targets) {
      playerFire(session, coord);
      if (over()) break;
      aiFire(session);
      if (over()) break;
    }
    expect(session.phase).toBe("gameover");
    expect(session.winner).toBe("human");
  });

  it("stops accepting shots after the game ends", () => {
    const session = readySession();
    session.phase = "gameover";
    expect(() => playerFire(session, { row: 9, col: 9 })).toThrow();
  });
});

describe("persistence", () => {
  it("round-trips a mid-game session including AI memory", () => {
    const session = readySession();
    playerFire(session, { row: 3, col: 3 });
    aiFire(session);

    const restored = deserialize(serialize(session));
    expect(restored.phase).toBe(session.phase);
    expect(restored.turn).toBe(session.turn);
    expect(restored.aiBoard).toEqual(session.aiBoard);
    expect(restored.playerBoard).toEqual(session.playerBoard);
    expect([...restored.ai.tried.entries()]).toEqual([...session.ai.tried.entries()]);
    expect(restored.ai.remainingShips).toEqual(session.ai.remainingShips);
  });

  it("saves, loads and clears through storage", () => {
    const storage = new MemoryStorage();
    const session = readySession();
    save(session, storage);
    expect(load(storage)!.phase).toBe("playing");
    clearSaved(storage);
    expect(load(storage)).toBeNull();
  });

  it("returns null instead of throwing on corrupt saved data", () => {
    const storage = new MemoryStorage();
    storage.setItem("battleship.session.v1", "{not json");
    expect(load(storage)).toBeNull();
  });
});
