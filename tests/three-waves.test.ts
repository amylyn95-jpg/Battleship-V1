import { describe, expect, it } from "vitest";
import { waveHeight } from "../src/three/ocean.js";

describe("3D ocean waves", () => {
  it("is deterministic and frozen at t=0", () => {
    expect(waveHeight(12, -8, 0, 0.8)).toBe(waveHeight(12, -8, 0, 0.8));
    expect(waveHeight(12, -8, 0, 0.8)).not.toBe(waveHeight(12, -8, 1, 0.8));
  });

  it("stays bounded across representative samples", () => {
    for (let index = 0; index < 30; index++) {
      expect(Math.abs(waveHeight(index * 7, index * -3, index / 5, 1))).toBeLessThan(3);
    }
  });

  it("changes continuously for small movements", () => {
    const first = waveHeight(10, 20, 1, 0.8);
    const second = waveHeight(10.01, 20.01, 1, 0.8);
    expect(Math.abs(second - first)).toBeLessThan(0.02);
  });
});
