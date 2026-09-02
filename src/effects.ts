import type { Coord } from "./types.js";

export function intensityLevel(playerSunk: number, enemySunk: number): 0 | 1 | 2 | 3 {
  const lost = Math.max(playerSunk, enemySunk);
  if (lost >= 4) return 3;
  if (lost >= 2) return 2;
  if (lost >= 1) return 1;
  return 0;
}

export function cellCenter(coord: Coord): { x: number; y: number } {
  return { x: (coord.col + 0.5) * 10, y: (coord.row + 0.5) * 10 };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function transient(node: SVGElement, duration: number): void {
  let removed = false;
  const remove = (): void => {
    if (removed) return;
    removed = true;
    node.remove();
  };
  node.addEventListener("animationend", remove, { once: true });
  window.setTimeout(remove, duration);
}

export function ensureLayer(wrap: HTMLElement): SVGSVGElement {
  const existing = wrap.querySelector<SVGSVGElement>(".fx-layer");
  if (existing) return existing;
  const layer = svgElement("svg");
  layer.classList.add("fx-layer");
  layer.setAttribute("viewBox", "0 0 100 100");
  layer.setAttribute("preserveAspectRatio", "none");
  layer.setAttribute("aria-hidden", "true");
  const host = wrap.querySelector<HTMLElement>(".board-frame") ?? wrap;
  host.append(layer);
  return layer;
}

export function setRadar(wrap: HTMLElement, active: boolean): void {
  const layer = ensureLayer(wrap);
  const existing = layer.querySelector(".radar");
  if (!active) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const radar = svgElement("g");
  radar.classList.add("radar");
  radar.setAttribute("aria-hidden", "true");
  for (const radius of [46, 31, 16]) {
    const ring = svgElement("circle");
    ring.classList.add("radar-ring");
    ring.setAttribute("cx", "50");
    ring.setAttribute("cy", "50");
    ring.setAttribute("r", String(radius));
    ring.setAttribute("aria-hidden", "true");
    radar.append(ring);
  }
  const sweep = svgElement("path");
  sweep.classList.add("radar-sweep");
  sweep.setAttribute("d", "M 50 50 L 50 3 A 47 47 0 0 1 72 8 Z");
  sweep.setAttribute("aria-hidden", "true");
  radar.append(sweep);
  layer.append(radar);
}

export function sonarPulse(wrap: HTMLElement, coord: Coord): void {
  if (prefersReducedMotion()) return;
  const layer = ensureLayer(wrap);
  const { x, y } = cellCenter(coord);
  const pulse = svgElement("circle");
  pulse.classList.add("sonar-pulse");
  pulse.setAttribute("cx", String(x));
  pulse.setAttribute("cy", String(y));
  pulse.setAttribute("r", "2");
  pulse.setAttribute("aria-hidden", "true");
  layer.append(pulse);
  transient(pulse, 900);
}

export function launchTorpedo(wrap: HTMLElement, from: "top" | "bottom", coord: Coord): void {
  if (prefersReducedMotion()) return;
  const layer = ensureLayer(wrap);
  const { x, y } = cellCenter(coord);
  const startY = from === "top" ? 0 : 100;
  const torpedo = svgElement("path");
  torpedo.classList.add("torpedo");
  torpedo.setAttribute("d", `M ${x} ${startY} L ${x} ${y}`);
  torpedo.setAttribute("pathLength", "100");
  torpedo.setAttribute("aria-hidden", "true");
  layer.append(torpedo);
  transient(torpedo, 700);
}

export function impact(wrap: HTMLElement, coord: Coord, kind: "hit" | "miss" | "sunk"): void {
  if (prefersReducedMotion()) return;
  const layer = ensureLayer(wrap);
  const { x, y } = cellCenter(coord);
  const flash = svgElement("circle");
  flash.classList.add("impact", `impact-${kind}`);
  flash.setAttribute("cx", String(x));
  flash.setAttribute("cy", String(y));
  flash.setAttribute("r", kind === "sunk" ? "5" : "3");
  flash.setAttribute("aria-hidden", "true");
  layer.append(flash);
  transient(flash, kind === "sunk" ? 950 : 550);
}

export function setIntensity(level: number): void {
  if (typeof document === "undefined") return;
  document.body.dataset.intensity = String(Math.min(3, Math.max(0, Math.round(level))));
}

export function shake(strength: "light" | "heavy"): void {
  if (typeof document === "undefined") return;
  const className = strength === "heavy" ? "shake-heavy" : "shake";
  document.body.classList.remove("shake", "shake-heavy");
  document.body.classList.add(className);
  window.setTimeout(() => document.body.classList.remove(className), strength === "heavy" ? 560 : 420);
}
