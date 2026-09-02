import { describe, expect, it } from "vitest";
import { emptyBoard, placeShip } from "../src/board.js";
import { fire } from "../src/game.js";
import { FLEET } from "../src/types.js";
import { paintEnemyFleet, paintOwnFleet } from "../src/ui.js";

class FakeElement {
  textContent = "";
  className = "";
  children: FakeElement[] = [];
  classList = {
    toggle: (name: string, enabled: boolean) => {
      const names = new Set(this.className.split(" ").filter(Boolean));
      if (enabled) names.add(name);
      else names.delete(name);
      this.className = [...names].join(" ");
    },
  };
  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }
  setAttribute(): void {}
  querySelectorAll(selector: string): FakeElement[] {
    const found = this.children.flatMap((child) => child.querySelectorAll(selector));
    if (selector === ".damage-pip.filled" && this.className.split(" ").includes("damage-pip") && this.className.split(" ").includes("filled")) {
      return [this, ...found];
    }
    if (selector === ".damage-pip" && this.className.split(" ").includes("damage-pip")) return [this, ...found];
    return found;
  }
}

function fakeDocument(): void {
  (globalThis as Record<string, unknown>).document = { createElement: () => new FakeElement() };
}

describe("fleet status rendering", () => {
  it("shows own damage pips and destroyed state", () => {
    fakeDocument();
    let board = placeShip(emptyBoard(), FLEET[4]!, { row: 0, col: 0 }, "horizontal");
    board = fire(board, { row: 0, col: 0 }).board;
    const list = new FakeElement();
    paintOwnFleet(list as unknown as HTMLElement, board.ships);
    expect(list.querySelectorAll(".damage-pip.filled")).toHaveLength(1);
    expect(list.children[0]?.children[0]?.textContent).toBe("Destroyer");
  });

  it("never exposes partial enemy damage", () => {
    fakeDocument();
    let board = placeShip(emptyBoard(), FLEET[4]!, { row: 0, col: 0 }, "horizontal");
    board = fire(board, { row: 0, col: 0 }).board;
    const list = new FakeElement();
    paintEnemyFleet(list as unknown as HTMLElement, board.ships);
    expect(list.children[0]?.children[1]?.textContent).toBe("ACTIVE");
    expect(list.children[0]?.children[1]?.textContent).not.toContain("1 of");
    expect(list.querySelectorAll(".damage-pip")).toHaveLength(0);
  });
});
