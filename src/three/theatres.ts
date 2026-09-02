export type TheatreId = "salamis" | "trafalgar" | "midway";
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
    sea: "#174b67",
    deep: "#061d34",
    sky: "#d79c6d",
    fog: "#9bb9bf",
    sun: [0.4, 0.8, 0.2],
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
    sea: "#176276",
    deep: "#062d3c",
    sky: "#f0b574",
    fog: "#b4c5b2",
    sun: [0.2, 0.9, -0.2],
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
    sea: "#245572",
    deep: "#071b2d",
    sky: "#91aec0",
    fog: "#91a9b0",
    sun: [-0.3, 0.7, 0.5],
    choppy: 0.45,
    projectile: "bomb",
    art: "/art/midway.png",
    blurb: "Carrier range — steel decks, aircraft and calculated risk.",
  },
];

export function theatreConfig(id: TheatreId): Theatre {
  return THEATRES.find((theatre) => theatre.id === id) ?? THEATRES[0]!;
}
