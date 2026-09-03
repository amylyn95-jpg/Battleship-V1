import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEATRES } from "../src/three/theatres.js";

describe("battle theatres", () => {
  it("defines three distinct theatres with valid art and projectiles", () => {
    expect(new Set(THEATRES.map((theatre) => theatre.id)).size).toBe(3);
    for (const theatre of THEATRES) {
      expect(theatre.sea).toMatch(/^#/);
      expect(theatre.deep).toMatch(/^#/);
      expect(theatre.sky).toMatch(/^#/);
      expect(theatre.fog).toMatch(/^#/);
      expect(["bolt", "cannonball", "bomb"]).toContain(theatre.projectile);
      expect(theatre.enemy).toBeTruthy();
      expect(theatre.teaser).toBeTruthy();
      expect(theatre.intro.length).toBeGreaterThanOrEqual(3);
      expect(theatre.intro.every((line) => line.trim().length > 0)).toBe(true);
      expect(existsSync(new URL(`../public${theatre.art}`, import.meta.url))).toBe(true);
    }
  });
});
