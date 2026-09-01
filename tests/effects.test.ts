import { describe, expect, it } from "vitest";
import { cellCenter, intensityLevel, prefersReducedMotion } from "../src/effects.js";

describe("cinematic effect helpers", () => {
  it("raises intensity as either fleet takes losses", () => {
    expect(intensityLevel(0, 0)).toBe(0);
    expect(intensityLevel(1, 0)).toBe(1);
    expect(intensityLevel(0, 2)).toBe(2);
    expect(intensityLevel(3, 1)).toBe(2);
    expect(intensityLevel(4, 0)).toBe(3);
    expect(intensityLevel(0, 5)).toBe(3);
  });

  it("finds percentage cell centres", () => {
    expect(cellCenter({ row: 0, col: 0 })).toEqual({ x: 5, y: 5 });
    expect(cellCenter({ row: 6, col: 2 })).toEqual({ x: 25, y: 65 });
  });

  it("guards reduced-motion detection when matchMedia is unavailable", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
