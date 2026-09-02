export type ViewMode = "classic" | "3d";
const VIEW_KEY = "battleship.view.v1";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function webglSupported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function readViewMode(storage?: Storage): ViewMode | null {
  try {
    const source = storage ?? (typeof localStorage === "undefined" ? undefined : localStorage);
    const value = source?.getItem(VIEW_KEY);
    return value === "classic" || value === "3d" ? value : null;
  } catch {
    return null;
  }
}

export function writeViewMode(mode: ViewMode, storage?: Storage): void {
  try {
    const source = storage ?? (typeof localStorage === "undefined" ? undefined : localStorage);
    source?.setItem(VIEW_KEY, mode);
  } catch {
    // Storage can be unavailable in private or blocked browsing contexts.
  }
}

export function defaultViewMode(): ViewMode {
  return !prefersReducedMotion() && webglSupported() ? "3d" : "classic";
}
