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

export function readViewMode(storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage): ViewMode | null {
  const value = storage?.getItem(VIEW_KEY);
  return value === "classic" || value === "3d" ? value : null;
}

export function writeViewMode(mode: ViewMode, storage: Storage | undefined = typeof localStorage === "undefined" ? undefined : localStorage): void {
  storage?.setItem(VIEW_KEY, mode);
}

export function defaultViewMode(): ViewMode {
  return !prefersReducedMotion() && webglSupported() ? "3d" : "classic";
}
