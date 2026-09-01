import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEATRE,
  THEATRE_LIST,
  isTheatreId,
  loadTheatre,
  saveTheatre,
  shipName,
  theatre,
} from "../src/theatre.js";
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

describe("theatres", () => {
  it("names every hull in the fleet, differently per theatre", () => {
    for (const scene of THEATRE_LIST) {
      for (const spec of FLEET) {
        expect(shipName(scene.id, spec.id)).toBeTruthy();
      }
    }
    expect(shipName("sail", "carrier")).toBe("Ship of the Line");
    expect(shipName("mekong", "cruiser")).toBe("Patrol Boat");
    expect(shipName("pacific", "carrier")).not.toBe(shipName("sail", "carrier"));
  });

  it("gives each theatre its own wording for the boards and shots", () => {
    const words = THEATRE_LIST.map((scene) => `${scene.hitWord}|${scene.enemyWaters}`);
    expect(new Set(words).size).toBe(THEATRE_LIST.length);
    for (const scene of THEATRE_LIST) {
      expect(scene.place).toBeTruthy();
      expect(scene.opponent).toBeTruthy();
      expect(scene.scanNote).toBeTruthy();
      expect(scene.missWord).toBeTruthy();
      expect(scene.volley).toBeTruthy();
    }
  });

  it("round-trips the choice through storage", () => {
    const storage = new MemoryStorage();
    expect(loadTheatre(storage)).toBe(DEFAULT_THEATRE);
    saveTheatre("atlantic", storage);
    expect(loadTheatre(storage)).toBe("atlantic");
  });

  it("falls back to the default for an unknown saved theatre", () => {
    const storage = new MemoryStorage();
    storage.setItem("battleship.theatre", "trafalgar");
    expect(loadTheatre(storage)).toBe(DEFAULT_THEATRE);
    expect(isTheatreId("trafalgar")).toBe(false);
    expect(isTheatreId("mekong")).toBe(true);
  });

  it("keeps the engine's ship ids and lengths identical in every theatre", () => {
    for (const scene of THEATRE_LIST) {
      expect(Object.keys(theatre(scene.id).ships).sort()).toEqual(
        FLEET.map((spec) => spec.id).sort(),
      );
    }
  });
});
