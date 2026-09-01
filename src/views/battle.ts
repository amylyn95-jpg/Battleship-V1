import { isSunk } from "../board.js";
import { accuracy, longestHitStreak, shotsFired } from "../game.js";
import type { Coord, ShotResult } from "../types.js";
import type { Session } from "../session.js";
import {
  clearPreview,
  coordLabel,
  paintBoard,
  paintEnemyFleet,
  paintOwnFleet,
  showTargets,
} from "../ui.js";

export interface BattleViewDom {
  root: HTMLElement;
  playerBoard: HTMLElement;
  aiBoard: HTMLElement;
  playerFleet: HTMLElement;
  aiFleet: HTMLElement;
  status: HTMLElement;
  turnBanner: HTMLElement;
  targetReadout: HTMLElement;
  battleLog: HTMLElement;
  salvoBar: HTMLElement;
  salvoCount: HTMLElement;
  salvoTimer: HTMLElement;
  fireSalvo: HTMLButtonElement;
  stepFire: HTMLElement;
}

function lastShotOf(shots: readonly ShotResult[]): Coord | null {
  return shots.length > 0 ? shots[shots.length - 1]!.coord : null;
}

export function describeSalvo(results: readonly ShotResult[], actor: "Your" | "Enemy"): string {
  const hits = results.filter((r) => r.hit).length;
  const sunk = results.filter((r) => r.sunk).map((r) => r.sunk!.name);
  const tally =
    hits === 0
      ? `${actor} salvo of ${results.length}: all misses.`
      : `${actor} salvo of ${results.length}: <span class="hit-text">${hits} hit${hits === 1 ? "" : "s"}</span>!`;
  if (sunk.length === 0) return tally;
  const owner = actor === "Your" ? "Sank the" : "They sank your";
  return `${tally} <span class="sunk-text">${owner} ${sunk.join(" and ")}</span>!`;
}

export function describe(result: ShotResult, actor: "You" | "The enemy"): string {
  const where = coordLabel(result.coord);
  if (result.sunk) {
    const verb = actor === "You" ? "sank" : "sank your";
    return `${actor} hit ${where} and <span class="sunk-text">${verb} ${result.sunk.name}</span>!`;
  }
  if (result.hit) return `${actor} <span class="hit-text">hit</span> at ${where}.`;
  return `${actor} missed at ${where}.`;
}

export function logText(results: readonly ShotResult[], actor: "you" | "enemy", salvo: boolean): string {
  if (salvo) return describeSalvo(results, actor === "you" ? "Your" : "Enemy");
  return describe(results[0]!, actor === "you" ? "You" : "The enemy");
}

function formatLogTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function renderBattle(
  dom: BattleViewDom,
  session: Session,
  playerCells: readonly HTMLButtonElement[],
  aiCells: readonly HTMLButtonElement[],
  aiThinking: boolean,
  aiming: Coord | null,
  visible: boolean,
  incomingFire: boolean,
): void {
  dom.root.classList.toggle("hidden", !visible);
  if (!visible) return;
  const salvo = session.mode === "salvo";
  paintBoard(playerCells, session.playerBoard, true, lastShotOf(session.aiShots));
  paintBoard(aiCells, session.aiBoard, false, lastShotOf(session.playerShots), salvo);
  if (salvo) showTargets(aiCells, session.pendingTargets);
  else clearPreview(aiCells);
  paintOwnFleet(dom.playerFleet, session.playerBoard.ships);
  paintEnemyFleet(dom.aiFleet, session.aiBoard.ships);
  const playerTurn = session.turn === "human" && !aiThinking;
  dom.turnBanner.textContent = incomingFire ? "INCOMING FIRE" : playerTurn ? "YOUR TURN — SELECT TARGET" : "ENEMY ANALYZING";
  dom.turnBanner.classList.toggle("incoming", incomingFire);
  dom.aiBoard.classList.toggle("targetable", playerTurn);
  for (const cell of aiCells) {
    const fired = cell.classList.contains("fired");
    cell.disabled = !playerTurn || fired;
    cell.classList.toggle("aiming", playerTurn && aiming !== null && cell.dataset.row === String(aiming.row) && cell.dataset.col === String(aiming.col) && !fired);
  }
  dom.targetReadout.textContent = aiming && playerTurn ? `TARGET LOCK — ${coordLabel(aiming)}` : "TARGET LOCK — —";
  dom.salvoBar.classList.toggle("hidden", !salvo);
  if (salvo) {
    const picked = session.pendingTargets.length;
    dom.salvoCount.textContent = `Targets ${picked}/${session.playerBoard.ships.filter((ship) => !isSunk(ship)).length}`;
    dom.fireSalvo.disabled = !playerTurn || picked === 0;
    if (!playerTurn) dom.salvoTimer.textContent = "--";
  }
  dom.stepFire.classList.add("active");
  dom.battleLog.textContent = "";
  for (const entry of session.log.slice(-30).reverse()) {
    const item = document.createElement("li");
    item.innerHTML = `<time>${formatLogTime(entry.at)}</time> — ${entry.text}`;
    item.dataset.actor = entry.actor;
    dom.battleLog.append(item);
  }
}

export function shotSummary(session: Session): {
  shots: number;
  hits: number;
  accuracy: number;
  streak: number;
} {
  return {
    shots: shotsFired(session.aiBoard),
    hits: session.playerShots.filter((shot) => shot.hit).length,
    accuracy: accuracy(session.aiBoard),
    streak: longestHitStreak(session.playerShots),
  };
}
