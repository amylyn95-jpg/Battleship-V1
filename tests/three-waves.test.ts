import { describe, expect, it } from "vitest";
import { GERSTNER_WAVES, OCEAN_VERTEX_SHADER, waveHeight } from "../src/three/ocean.js";

describe("3D ocean waves", () => {
  it("uses one four-wave table for the shared surface model", () => {
    expect(GERSTNER_WAVES).toHaveLength(4);
    for (const wave of GERSTNER_WAVES) {
      expect(wave.direction).toHaveLength(2);
      expect(wave.wavelength).toBeGreaterThan(0);
      expect(wave.amplitude).toBeGreaterThan(0);
      expect(wave.speed).toBeGreaterThan(0);
    }
    expect(OCEAN_VERTEX_SHADER).toContain("uniform vec4 uWaves[4]");
    expect(OCEAN_VERTEX_SHADER).toContain("uWaveSpeeds[i]");
  });

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
