import { describe, expect, it } from "vitest";
import { arcPoint } from "../src/three/projectiles.js";

describe("3D projectile arcs", () => {
  it("starts at the source and ends at the target", () => {
    const from = { x: 0, y: 2, z: 0 };
    const to = { x: 10, y: 4, z: -8 };
    expect(arcPoint(from, to, 20, 0)).toEqual(from);
    expect(arcPoint(from, to, 20, 1)).toEqual(to);
  });

  it("reaches its highest point at the midpoint", () => {
    const from = { x: 0, y: 0, z: 0 };
    const to = { x: 10, y: 0, z: 0 };
    const midpoint = arcPoint(from, to, 20, 0.5);
    expect(midpoint.y).toBeGreaterThan(arcPoint(from, to, 20, 0.25).y);
    expect(midpoint.y).toBeGreaterThan(arcPoint(from, to, 20, 0.75).y);
  });
});
