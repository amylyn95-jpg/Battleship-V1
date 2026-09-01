import { accuracy, hitCount, longestHitStreak, rating, shotsFired } from "../game.js";
import { isSunk } from "../board.js";
import type { Difficulty, Mode } from "../types.js";
import type { Session } from "../session.js";

export interface DebriefViewDom {
  root: HTMLElement;
  title: HTMLElement;
  stats: HTMLElement;
  rating: HTMLElement;
  rematch: HTMLButtonElement;
  newBattle: HTMLButtonElement;
  changeDifficulty: HTMLButtonElement;
}

function elapsed(session: Session): string {
  if (session.startedAt === null) return "0:00";
  const end = session.endedAt ?? Date.now();
  const seconds = Math.max(0, Math.floor((end - session.startedAt) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function difficultyLabel(difficulty: Difficulty): string {
  return { easy: "Recruit", normal: "Tactical", hard: "Admiral" }[difficulty];
}

export function renderDebrief(dom: DebriefViewDom, session: Session, visible: boolean): void {
  dom.root.classList.toggle("hidden", !visible);
  if (!visible) return;
  const won = session.winner === "human";
  const shots = shotsFired(session.aiBoard);
  const hits = hitCount(session.aiBoard);
  const acc = accuracy(session.aiBoard);
  const destroyed = session.aiBoard.ships.filter(isSunk).length;
  const lost = session.playerBoard.ships.filter(isSunk).length;
  dom.title.textContent = won ? "ENEMY FLEET DESTROYED" : "MISSION FAILED — FLEET LOST";
  dom.rating.textContent = rating({ won, accuracy: acc, difficulty: session.difficulty });
  dom.stats.innerHTML = [
    ["Shots fired", shots],
    ["Hits", hits],
    ["Misses", shots - hits],
    ["Accuracy", `${Math.round(acc * 100)}%`],
    ["Vessels destroyed", destroyed],
    ["Ships lost", lost],
    ["Longest hit streak", longestHitStreak(session.playerShots)],
    ["Total turns", session.turns],
    ["Elapsed time", elapsed(session)],
    ["Difficulty", difficultyLabel(session.difficulty)],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
  dom.rematch.focus();
}

export function selectedBattleSettings(session: Session): { difficulty: Difficulty; mode: Mode } {
  return { difficulty: session.difficulty, mode: session.mode };
}
