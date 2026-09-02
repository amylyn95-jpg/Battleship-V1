import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { gridToWorld, worldToGrid } from "../src/three/grid.js";
import { pickTarget } from "../src/three/director.js";
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

  it("round-trips projected edge cells through the player target plane", () => {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 800);
    const rig = CAMERA_RIGS.player;
    camera.position.fromArray(rig.position);
    camera.lookAt(new THREE.Vector3(...rig.target));
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const raycaster = new THREE.Raycaster();
    for (const coord of [
      { row: 0, col: 0 },
      { row: 0, col: 9 },
      { row: 9, col: 0 },
      { row: 9, col: 9 },
    ]) {
      const point = gridToWorld(coord, "enemy");
      const projected = new THREE.Vector3(point.x, 0.38, point.z).project(camera);
      raycaster.setFromCamera(new THREE.Vector2(projected.x, projected.y), camera);
      expect(pickTarget(raycaster.ray)).toEqual(worldToGrid(point.x, point.z, "enemy"));
    }
  });
});
