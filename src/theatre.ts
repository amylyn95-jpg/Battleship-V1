/**
 * Theatres are pure presentation: a palette, a horizon, era ship names and the
 * words the status line uses. The rules, the fleet lengths and the AI are
 * identical in every theatre, so nothing here can change how a game plays.
 */
import type { ShipId } from "./types.js";

export type TheatreId = "pacific" | "sail" | "atlantic" | "mekong";

export interface Theatre {
  readonly id: TheatreId;
  /** Shown in the picker. */
  readonly label: string;
  /** Sub-heading under the title, e.g. "English Channel, 1782". */
  readonly place: string;
  /** Era names for the same five hulls, keyed by the engine's ship ids. */
  readonly ships: Readonly<Record<ShipId, string>>;
  /** How the opponent is referred to in the status line. */
  readonly opponent: string;
  readonly yourWaters: string;
  readonly enemyWaters: string;
  /** Appended while the opponent weighs its next shot. */
  readonly scanNote: string;
  /** Verb for a shot that lands on a hull, e.g. "hit" or "holed". */
  readonly hitWord: string;
  /** Phrase for a shot that lands on open water. */
  readonly missWord: string;
  /** What a salvo is called here, e.g. "salvo" or "broadside". */
  readonly volley: string;
}

const THEATRES: Readonly<Record<TheatreId, Theatre>> = {
  pacific: {
    id: "pacific",
    label: "Pacific, 1944",
    place: "Philippine Sea \u2014 carrier task force",
    ships: {
      carrier: "Carrier",
      battleship: "Battleship",
      cruiser: "Cruiser",
      submarine: "Submarine",
      destroyer: "Destroyer",
    },
    opponent: "The enemy",
    yourWaters: "Your waters",
    enemyWaters: "Enemy waters",
    scanNote: "The enemy is scanning your waters&hellip;",
    hitWord: "hit",
    missWord: "missed",
    volley: "salvo",
  },
  sail: {
    id: "sail",
    label: "Age of Sail, 1782",
    place: "English Channel \u2014 the line of battle",
    ships: {
      carrier: "Ship of the Line",
      battleship: "Frigate",
      cruiser: "Brig",
      submarine: "Sloop",
      destroyer: "Cutter",
    },
    opponent: "The enemy squadron",
    yourWaters: "Your squadron",
    enemyWaters: "Enemy squadron",
    scanNote: "The enemy gun crews are laying their pieces&hellip;",
    hitWord: "raked",
    missWord: "fired wide",
    volley: "broadside",
  },
  atlantic: {
    id: "atlantic",
    label: "North Atlantic, 1941",
    place: "Denmark Strait \u2014 convoy escort",
    ships: {
      carrier: "Escort Carrier",
      battleship: "Battlecruiser",
      cruiser: "Corvette",
      submarine: "U-boat",
      destroyer: "Trawler",
    },
    opponent: "The wolfpack",
    yourWaters: "Your convoy",
    enemyWaters: "Hunting grounds",
    scanNote: "Their radar is sweeping your convoy&hellip;",
    hitWord: "holed",
    missWord: "lost in the swell",
    volley: "salvo",
  },
  mekong: {
    id: "mekong",
    label: "Mekong Delta, 1968",
    place: "Vietnam \u2014 riverine patrol",
    ships: {
      carrier: "Monitor",
      battleship: "Landing Craft",
      cruiser: "Patrol Boat",
      submarine: "Swift Boat",
      destroyer: "Skimmer",
    },
    opponent: "The patrol",
    yourWaters: "Your stretch of river",
    enemyWaters: "Upriver",
    scanNote: "They are working the treeline for your boats&hellip;",
    hitWord: "struck",
    missWord: "went into the water",
    volley: "volley",
  },
};

export const THEATRE_LIST: readonly Theatre[] = [
  THEATRES.pacific,
  THEATRES.sail,
  THEATRES.atlantic,
  THEATRES.mekong,
];

export const DEFAULT_THEATRE: TheatreId = "pacific";

export function isTheatreId(value: unknown): value is TheatreId {
  return typeof value === "string" && value in THEATRES;
}

export function theatre(id: TheatreId): Theatre {
  return THEATRES[id];
}

/** Era name for a hull; the engine keeps its own canonical names untouched. */
export function shipName(id: TheatreId, ship: ShipId): string {
  return THEATRES[id].ships[ship];
}

const STORAGE_KEY = "battleship.theatre";

export function loadTheatre(storage: Storage = localStorage): TheatreId {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    return isTheatreId(saved) ? saved : DEFAULT_THEATRE;
  } catch {
    return DEFAULT_THEATRE;
  }
}

export function saveTheatre(id: TheatreId, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing: the choice just does not persist.
  }
}
