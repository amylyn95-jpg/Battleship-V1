import { describe, expect, it } from "vitest";
import { CAMERA_RIGS } from "../src/three/scene.js";

describe("3D camera rigs", () => {
  it("keeps distinct cameras above the water and looking ahead", () => {
    const rigs = Object.values(CAMERA_RIGS);
    expect(new Set(rigs.map((rig) => rig.position.join(","))).size).toBe(rigs.length);
    for (const rig of rigs) {
      expect(rig.position[1]).toBeGreaterThan(0);
      expect(rig.target[2]).toBeLessThan(rig.position[2]);
    }
  });
});
