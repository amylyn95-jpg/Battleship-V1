import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createImpact } from "../src/three/fx.js";
import { disposeObject } from "../src/three/scene.js";

describe("3D impact effects", () => {
  it("adds an airburst to hits and sunk ships", () => {
    for (const kind of ["hit", "sunk"] as const) {
      const impact = createImpact(kind, new THREE.Vector3(), 0);
      expect(impact.group.getObjectByName("airburst-flash")).toBeDefined();
      expect(impact.group.getObjectByName("airburst-shockwave")).toBeDefined();
      disposeObject(impact.group);
    }
  });

  it("keeps misses to the water plume", () => {
    const impact = createImpact("neutral", new THREE.Vector3(), 0);
    expect(impact.group.getObjectByName("airburst-flash")).toBeUndefined();
    expect(impact.group.getObjectByName("airburst-shockwave")).toBeUndefined();
    expect(impact.group.getObjectByName("plume")).toBeDefined();
    disposeObject(impact.group);
  });
});
