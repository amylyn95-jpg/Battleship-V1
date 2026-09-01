import type { Difficulty } from "./types.js";

export type VossEvent =
  | { kind: "battle-start"; difficulty: Difficulty }
  | { kind: "player-shot"; hit: boolean; sunk: string | null; streak: number }
  | { kind: "enemy-shot"; hit: boolean; sunk: string | null }
  | { kind: "victory" }
  | { kind: "defeat" };

function difficultyLabel(difficulty: Difficulty): string {
  return { easy: "Recruit", normal: "Tactical", hard: "Admiral" }[difficulty];
}

export function vossLine(event: VossEvent): string {
  switch (event.kind) {
    case "battle-start":
      return `Conn, all stations — ${difficultyLabel(event.difficulty)} posture. Let's put the enemy under.`;
    case "player-shot":
      if (event.sunk) return `Conn, sonar — ${event.sunk} is burning. She's going under.`;
      if (event.streak >= 3) return `Conn, we're on a ${event.streak}-shot run. Keep the pressure on.`;
      if (event.hit) return "Conn, direct hit. Their line is buckling.";
      return "Conn, splash only. Walk the fire onto the contact.";
    case "enemy-shot":
      if (event.sunk) return `Damage control, the enemy sank our ${event.sunk}. Keep us in the fight.`;
      if (event.hit) return "Damage report — enemy steel found us. Hold the line.";
      return "Conn, enemy splash. They missed clean.";
    case "victory":
      return "Conn, enemy fleet destroyed. Bring us about and mark the win.";
    case "defeat":
      return "Conn, we've lost the fleet. Stand down and recover the crew.";
  }
}
