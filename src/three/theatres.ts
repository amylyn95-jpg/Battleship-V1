import type { TheatreId } from "../types.js";
export type TheatreEra = "oar" | "sail" | "steel";
export type ProjectileKind = "bolt" | "cannonball" | "bomb";

export interface Theatre {
  readonly id: TheatreId;
  readonly label: string;
  readonly years: string;
  readonly era: TheatreEra;
  readonly sea: string;
  readonly deep: string;
  readonly sky: string;
  readonly skyTop: string;
  readonly fog: string;
  readonly sun: [number, number, number];
  readonly choppy: number;
  readonly projectile: ProjectileKind;
  readonly art: string;
  readonly blurb: string;
}

export const THEATRES: readonly Theatre[] = [
  {
    id: "trafalgar",
    label: "TRAFALGAR",
    years: "1805",
    era: "sail",
    sea: "#3f7d9c",
    deep: "#173d59",
    sky: "#e6a878",
    skyTop: "#31456b",
    fog: "#c9b49c",
    sun: [0.3, 0.34, -0.9],
    choppy: 0.8,
    projectile: "cannonball",
    art: "/art/trafalgar.png",
    blurb: "Line of battle — sail, smoke and broadside fire.",
  },
  {
    id: "salamis",
    label: "SALAMIS",
    years: "480 BC",
    era: "oar",
    sea: "#31a3b0",
    deep: "#0f5568",
    sky: "#ecdcae",
    skyTop: "#2e86c0",
    fog: "#cfdcc9",
    sun: [0.16, 0.62, -0.76],
    choppy: 0.55,
    projectile: "bolt",
    art: "/art/salamis.png",
    blurb: "Narrow waters — oars, bronze rams and ancient resolve.",
  },
  {
    id: "midway",
    label: "MIDWAY",
    years: "1942",
    era: "steel",
    sea: "#3a83ad",
    deep: "#123c60",
    sky: "#a9c6d8",
    skyTop: "#1d5182",
    fog: "#a8c0cd",
    sun: [-0.34, 0.5, -0.8],
    choppy: 0.45,
    projectile: "bomb",
    art: "/art/midway.png",
    blurb: "Carrier range — steel decks, aircraft and calculated risk.",
  },
];

export function theatreConfig(id: TheatreId): Theatre {
  return THEATRES.find((theatre) => theatre.id === id) ?? THEATRES[0]!;
}
