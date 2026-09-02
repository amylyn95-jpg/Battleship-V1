import { describe, expect, it } from "vitest";
import {
  arcPoint,
  createProjectile,
  createProjectileTrail,
  updateProjectileTrail,
} from "../src/three/projectiles.js";

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

  it("caps vapour trail puffs and clears them after the flight", () => {
    const trail = createProjectileTrail();
    for (let now = 0; now <= 1920; now += 60) {
      updateProjectileTrail(trail, { x: 0, y: now / 100, z: 0 }, now, now >= 1200);
      expect(trail.puffs.length).toBeLessThanOrEqual(24);
    }
    expect(trail.puffs).toHaveLength(0);
  });

  it("raises and lengthens each projectile presentation", () => {
    const from = { x: 0, y: 8, z: 0 };
    const to = { x: 0, y: 0.8, z: -20 };
    expect(createProjectile("cannonball", from, to, 0)).toMatchObject({ apex: 38, duration: 1500 });
    expect(createProjectile("bolt", from, to, 0)).toMatchObject({ apex: 30, duration: 1250 });
    expect(createProjectile("bomb", from, to, 0)).toMatchObject({ apex: 44, duration: 1900 });
  });
});
