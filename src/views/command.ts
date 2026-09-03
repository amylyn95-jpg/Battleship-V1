import type { TheatreId } from "../types.js";
import { THEATRES } from "../three/theatres.js";

export interface CommandViewDom {
  root: HTMLElement;
  theatreButtons: readonly HTMLButtonElement[];
}

export function buildCampaignCards(root: HTMLElement): void {
  root.replaceChildren(
    ...THEATRES.map((theatre) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "campaign-card";
      card.dataset.theatre = theatre.id;
      const image = document.createElement("img");
      image.src = theatre.art;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      const body = document.createElement("span");
      body.className = "campaign-card-body";
      body.innerHTML = `
        <span class="campaign-card-heading"><span>${theatre.label}</span><small>${theatre.years}</small></span>
        <span class="campaign-card-enemy">Enemy: ${theatre.enemy}</span>
        <span class="campaign-card-teaser">${theatre.teaser}</span>
        <span class="campaign-card-cta">TAKE COMMAND</span>
      `;
      card.append(image, body);
      return card;
    }),
  );
}

export function renderCommand(
  dom: CommandViewDom,
  visible: boolean,
  theatre: TheatreId,
): void {
  dom.root.classList.toggle("hidden", !visible);
  for (const button of dom.theatreButtons) {
    button.classList.toggle("selected", button.dataset.theatre === theatre);
  }
}
