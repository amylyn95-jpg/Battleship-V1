import type { Difficulty, Mode } from "../types.js";

export interface CommandViewDom {
  root: HTMLElement;
  difficulty: HTMLSelectElement;
  mode: HTMLSelectElement;
  mute: HTMLButtonElement;
  difficultyButtons: readonly HTMLButtonElement[];
  modeButtons: readonly HTMLButtonElement[];
}

export function renderCommand(
  dom: CommandViewDom,
  visible: boolean,
  difficulty: Difficulty,
  mode: Mode,
): void {
  dom.root.classList.toggle("hidden", !visible);
  dom.difficulty.value = difficulty;
  dom.mode.value = mode;
  for (const button of dom.difficultyButtons) {
    button.classList.toggle("selected", button.dataset.difficulty === difficulty);
    button.setAttribute("aria-pressed", String(button.dataset.difficulty === difficulty));
  }
  for (const button of dom.modeButtons) {
    button.classList.toggle("selected", button.dataset.mode === mode);
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
}
