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
  readonly enemy: string;
  readonly teaser: string;
  readonly intro: readonly string[];
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
    enemy: "The Combined Fleet",
    teaser: "France and Spain have joined forces. Break their line before they break yours.",
    intro: [
      "The British fleet faces a combined French and Spanish force off Cape Trafalgar.",
      "Their numbers are formidable. Their line is strong.",
      "Break the enemy formation, seize the advantage, and decide the fate of the sea.",
    ],
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
    enemy: "The Persian Empire",
    teaser: "The largest fleet in the ancient world is closing in. Draw them into the straits and survive.",
    intro: [
      "The Persian Empire has brought overwhelming force to the water.",
      "In the narrow straits of Salamis, speed and positioning matter more than size.",
      "Lure the enemy in, outmaneuver the fleet, and fight for survival.",
    ],
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
    enemy: "The Imperial Japanese Fleet",
    teaser: "An enemy carrier force approaches. Find them before they find you.",
    intro: [
      "A decisive confrontation is unfolding in the Pacific.",
      "Enemy carriers are advancing, and the first strike may decide everything.",
      "Locate the fleet, attack with precision, and turn the tide of the war.",
    ],
  },
];

export function theatreConfig(id: TheatreId): Theatre {
  return THEATRES.find((theatre) => theatre.id === id) ?? THEATRES[0]!;
}
