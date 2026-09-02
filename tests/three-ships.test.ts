import { describe, expect, it } from "vitest";
import { damageStage, sinkEasing } from "../src/three/ships.js";

describe("3D ship damage", () => {
  it("progresses from fire to heavy smoke to sunk", () => {
    expect(damageStage(0, 4)).toBe(0);
    expect(damageStage(1, 4)).toBe(1);
    expect(damageStage(2, 4)).toBe(2);
    expect(damageStage(4, 4)).toBe(3);
  });

  it("clamps and eases the sink animation", () => {
    expect(sinkEasing(-1)).toBe(0);
    expect(sinkEasing(0)).toBe(0);
    expect(sinkEasing(0.5)).toBeCloseTo(0.5);
    expect(sinkEasing(1)).toBe(1);
    expect(sinkEasing(2)).toBe(1);
  });
});
