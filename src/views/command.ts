import type { Difficulty, Mode, TheatreId } from "../types.js";
import { THEATRES } from "../three/theatres.js";

export interface CommandViewDom {
  root: HTMLElement;
  mute: HTMLButtonElement;
  difficultyButtons: readonly HTMLButtonElement[];
  modeButtons: readonly HTMLButtonElement[];
  difficultyDescription: HTMLElement;
  modeDescription: HTMLElement;
  theatreButtons: readonly HTMLButtonElement[];
  theatreDescription: HTMLElement;
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

export function renderCommand(
  dom: CommandViewDom,
  visible: boolean,
  difficulty: Difficulty,
  mode: Mode,
  theatre: TheatreId,
): void {
  dom.root.classList.toggle("hidden", !visible);
  for (const button of dom.difficultyButtons) {
    button.classList.toggle("selected", button.dataset.difficulty === difficulty);
    button.setAttribute("aria-pressed", String(button.dataset.difficulty === difficulty));
  }
  for (const button of dom.modeButtons) {
    button.classList.toggle("selected", button.dataset.mode === mode);
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
  dom.difficultyDescription.textContent = difficultyDescriptions[difficulty];
  dom.modeDescription.textContent = modeDescriptions[mode];
  for (const button of dom.theatreButtons) {
    button.classList.toggle("selected", button.dataset.theatre === theatre);
    button.setAttribute("aria-pressed", String(button.dataset.theatre === theatre));
  }
  dom.theatreDescription.textContent = THEATRES.find((item) => item.id === theatre)?.blurb ?? "";
}
