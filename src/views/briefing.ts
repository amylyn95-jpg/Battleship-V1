import type { Difficulty, Mode, TheatreId } from "../types.js";
import { theatreConfig } from "../three/theatres.js";

export interface BriefingViewDom {
  root: HTMLElement;
  art: HTMLImageElement;
  label: HTMLElement;
  years: HTMLElement;
  enemy: HTMLElement;
  intro: readonly HTMLElement[];
  difficultyButtons: readonly HTMLButtonElement[];
  modeButtons: readonly HTMLButtonElement[];
  difficultyDescription: HTMLElement;
  modeDescription: HTMLElement;
}

const difficultyDescriptions: Record<Difficulty, string> = {
  easy: "Random fire — unpredictable contacts, lighter pressure.",
  normal: "Hunts systematically — closes the net by pattern.",
  hard: "Probability targeting — every shot is calculated.",
};

const modeDescriptions: Record<Mode, string> = {
  classic: "Classic engagement — one target per turn.",
  salvo: "Salvo engagement — one target per surviving ship.",
};

export function renderBriefing(
  dom: BriefingViewDom,
  visible: boolean,
  difficulty: Difficulty,
  mode: Mode,
  theatre: TheatreId,
): void {
  dom.root.classList.toggle("hidden", !visible);
  if (!visible) return;
  const selected = theatreConfig(theatre);
  dom.art.src = selected.art;
  dom.label.textContent = selected.label;
  dom.years.textContent = selected.years;
  dom.enemy.textContent = `Enemy: ${selected.enemy}`;
  dom.intro.forEach((line, index) => {
    line.textContent = selected.intro[index] ?? "";
  });
  for (const button of dom.difficultyButtons) {
    const active = button.dataset.difficulty === difficulty;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const button of dom.modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  }
  dom.difficultyDescription.textContent = difficultyDescriptions[difficulty];
  dom.modeDescription.textContent = modeDescriptions[mode];
}
