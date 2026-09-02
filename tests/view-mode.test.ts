import { describe, expect, it, vi } from "vitest";
import { defaultViewMode, readViewMode, writeViewMode } from "../src/three/support.js";

describe("3D view support", () => {
  it("falls back to classic when WebGL is unavailable", () => {
    vi.stubGlobal("document", undefined);
    expect(defaultViewMode()).toBe("classic");
  });

  it("uses classic when reduced motion is enabled", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    expect(defaultViewMode()).toBe("classic");
    vi.unstubAllGlobals();
  });

  it("persists valid modes and ignores unknown values", () => {
    const values = new Map<string, string>();
    const storage = {
      get length() {
        return values.size;
      },
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
    } as Storage;
    writeViewMode("3d", storage);
    expect(readViewMode(storage)).toBe("3d");
    values.set("battleship.view.v1", "unknown");
    expect(readViewMode(storage)).toBeNull();
  });
});
