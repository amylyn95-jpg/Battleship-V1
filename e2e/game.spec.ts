import { expect, test, type Page } from "@playwright/test";

const consoleErrors = new WeakMap<object, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(test.info(), errors);
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test.afterEach(() => {
  expect(consoleErrors.get(test.info()) ?? []).toEqual([]);
});

async function enterDeployment(page: Page): Promise<void> {
  await page.getByRole("button", { name: "DEPLOY FLEET" }).click();
  await expect(page.locator("#deploy-screen")).toBeVisible();
  await expect(page.locator("#ai-wrap")).toBeHidden();
  await expect(page.locator("#footer-hint")).toBeHidden();
}

async function engage(page: Page): Promise<void> {
  await enterDeployment(page);
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "ENGAGE ENEMY" }).click();
  await expect(page.locator("#ai-wrap")).toBeVisible();
  await expect(page.locator("#footer-hint")).toBeVisible();
}

test("passes through the command screen", async ({ page }) => {
  await expect(page.locator("#command-screen")).toBeVisible();
  await expect(page.locator("#stage canvas")).toHaveCount(1);
  await expect(page.locator("#app-title")).toBeHidden();
  await expect(page.locator("#new-game")).toBeHidden();
  await expect(page.locator("#footer-hint")).toBeHidden();
  await page.getByRole("button", { name: "ADMIRAL" }).click();
  await expect(page.locator("#difficulty-description")).toContainText("Probability targeting");
  await expect(page.locator("#mode-description")).toContainText("Classic engagement");
  await page.getByRole("button", { name: /MIDWAY/ }).click();
  await expect(page.locator("#theatre-description")).toContainText("Carrier range");
  await page.getByRole("button", { name: "CLASSIC VIEW" }).click();
  await expect(page.locator("#stage canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "3D VIEW" }).click();
  await expect(page.locator("#stage canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "DEPLOY FLEET" }).click();
  await expect(page.locator("#app-title")).toBeVisible();
  await expect(page.locator("#new-game")).toBeVisible();
  await expect(page.locator("#placement-prompt")).toContainText("Carrier");
});

test("random fleet, engage, fire and see feedback", async ({ page }) => {
  await engage(page);
  await expect(page.locator("#player-board .cell:not([disabled])")).toHaveCount(0);
  await expect(page.getByText("Battle stations")).toBeVisible();
  await expect(page.locator("#ai-wrap .coordinate-labels-top span")).toHaveCount(10);
  await expect(page.locator("#ai-wrap .coordinate-labels-top span").first()).toHaveText("A");
  await expect(page.locator("#ai-wrap .coordinate-labels-top span").last()).toHaveText("J");
  await expect(page.locator("#ai-wrap .coordinate-labels-side span").first()).toHaveText("1");
  await expect(page.locator("#ai-wrap .coordinate-labels-side span").last()).toHaveText("10");
  const enemy = page.locator("#ai-board .cell");
  await enemy.nth(0).click();
  await expect(page.locator("#status")).toContainText(/You (hit|missed)/);
  await expect(enemy.nth(0)).toHaveClass(/hit|miss/);
  await expect(page.locator("#battle-log li")).not.toHaveCount(0);
});

test("shows radar and Commander Voss comms during battle", async ({ page }) => {
  await expect(page.locator("#ai-wrap .fx-layer .radar")).toHaveCount(0);
  await engage(page);
  await expect(page.locator("#ai-wrap .fx-layer .radar")).toHaveCount(1);
  const line = await page.locator("#comms-line").textContent();
  expect(line).toBeTruthy();
  await page.locator("#ai-board .cell").nth(0).click();
  await expect(page.locator("#comms-line")).not.toHaveText(line ?? "");
});

test("cleans up transient cinematic effects", async ({ page }) => {
  await engage(page);
  await page.locator("#ai-board .cell").nth(0).click();
  await page.waitForTimeout(2_000);
  await expect(page.locator("#ai-wrap .torpedo, #ai-wrap .impact, #ai-wrap .sonar-pulse")).toHaveCount(0);
});

test("cannot fire twice at the same cell", async ({ page }) => {
  await engage(page);
  const cell = page.locator("#ai-board .cell").nth(12);
  await cell.click();
  await expect(cell).toHaveClass(/fired/);
  await expect(cell).toBeDisabled();
});

test("manual placement rejects an overlapping ship", async ({ page }) => {
  await enterDeployment(page);
  const own = page.locator("#player-board .cell");
  await own.nth(0).click();
  await expect(page.locator("#placement-prompt")).toContainText("Battleship");
  await own.nth(1).click();
  await expect(page.locator("#deploy-status")).toBeVisible();
  await expect(page.locator("#deploy-status")).toContainText("does not fit");
});

test("drag-and-drop placement selects the dragged ship", async ({ page }) => {
  await enterDeployment(page);
  const destroyer = page.locator("#dock li[data-ship='destroyer']");
  await destroyer.dragTo(page.locator("#player-board .cell").nth(0));
  await expect(page.locator("#player-board .cell").nth(0)).toHaveClass(/ship/);
  await expect(destroyer).toHaveClass(/placed/);
});

test("plays a full game to debrief and rematch", async ({ page }) => {
  test.setTimeout(180_000);
  await engage(page);
  for (let i = 0; i < 100; i++) {
    if (await page.locator("#gameover:not(.hidden)").isVisible()) break;
    const available = page.locator("#ai-board .cell:not([disabled]):not(.fired)");
    await expect(available.first()).toBeEnabled({ timeout: 10_000 });
    await available.first().click();
    await page.waitForTimeout(650);
  }
  await expect(page.locator("#gameover")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#gameover-title")).toHaveText(/ENEMY FLEET DESTROYED|MISSION FAILED — FLEET LOST/);
  await expect(page.locator("#ai-board .cell.ship").first()).toBeVisible();
  await expect(page.locator("#ai-board .cell:not([disabled])")).toHaveCount(0);
  await expect(page.locator("#gameover-stats")).toContainText("Shots fired");
  await expect(page.locator("#gameover-stats")).toContainText("Elapsed time");
  await expect(page.getByRole("button", { name: "REMATCH" })).toBeFocused();
  await page.getByRole("button", { name: "REMATCH" }).click();
  await expect(page.locator("#gameover")).toBeHidden();
  await expect(page.locator("#placement-prompt")).toContainText("Carrier");
});

test("resumes the AI turn when reloaded mid-think", async ({ page }) => {
  await engage(page);
  await page.locator("#ai-board .cell").nth(0).click();
  await page.reload();
  await expect(page.locator("#comms-line")).not.toHaveText("");
  await expect(page.locator("#status")).toContainText(/The enemy (hit|missed|hit .*sank)/, { timeout: 10_000 });
  await expect(page.locator("#ai-board .cell").nth(99)).toBeEnabled();
});

test("salvo mode fires five shots at once and reports only a hit count", async ({ page }) => {
  await page.getByRole("button", { name: "SALVO" }).click();
  await engage(page);
  await expect(page.locator("#salvo-bar")).toBeVisible();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 0/5");
  const enemy = page.locator("#ai-board .cell");
  for (let col = 0; col < 5; col++) await enemy.nth(col).click();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 5/5");
  await enemy.nth(5).click();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 5/5");
  await page.getByRole("button", { name: /Fire salvo/ }).click();
  await expect(page.locator("#status")).toContainText(/salvo of 5: (all misses|\d+ hits?)/);
  for (let col = 0; col < 5; col++) {
    await expect(enemy.nth(col)).toHaveClass(/fired/);
    await expect(enemy.nth(col)).not.toHaveClass(/\bhit\b|\bmiss\b/);
  }
  await expect(page.locator("#status")).toContainText(/Enemy salvo of \d+: (all misses|\d+ hits?)/, { timeout: 10_000 });
});

test("draws placed ships as hulls and keeps them under damage", async ({ page }) => {
  await enterDeployment(page);
  const own = page.locator("#player-board .cell");
  await own.nth(0).click();
  await expect(own.nth(0)).toHaveClass(/hull-bow/);
  await expect(own.nth(2)).toHaveClass(/hull-mid/);
  await expect(own.nth(4)).toHaveClass(/hull-stern/);
  await expect(own.nth(0)).toHaveClass(/hull-h/);
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "ENGAGE ENEMY" }).click();
  const struck = page.locator("#player-board .cell.hit");
  const enemy = page.locator("#ai-board .cell");
  for (let i = 0; i < 40 && (await struck.count()) === 0; i++) {
    const cell = enemy.nth(i);
    if (await cell.isEnabled()) {
      await cell.click();
      await page.waitForTimeout(650);
    }
  }
  await expect(struck.first()).toHaveClass(/ship/);
  await expect(struck.first()).toHaveClass(/hull-(bow|mid|stern)/);
});

test("setup screen explains what is blocking the start", async ({ page }) => {
  await enterDeployment(page);
  await expect(page.locator("#engage-enemy")).toBeDisabled();
  await expect(page.locator("#start-hint")).toContainText("5 ships left to place");
  await expect(page.locator("#step-place")).toHaveClass(/active/);
  await expect(page.locator("#dock li.current")).toContainText("Carrier");
  await page.getByRole("button", { name: "Random fleet" }).click();
  await expect(page.getByRole("button", { name: "ENGAGE ENEMY" })).toBeEnabled();
  await expect(page.locator("#start-hint")).toHaveText("");
  await expect(page.locator("#step-start")).toHaveClass(/active/);
});

test("sound toggle flips and survives a reload", async ({ page }) => {
  const mute = page.locator("#mute");
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await mute.click();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect(mute).toContainText("Sound off");
  await page.reload();
  await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true");
});

test("restores an in-progress game after reload", async ({ page }) => {
  await engage(page);
  await page.locator("#ai-board .cell").nth(5).click();
  await page.waitForTimeout(700);
  await page.reload();
  await expect(page.locator("#deploy-screen")).toBeHidden();
  await expect(page.locator("#ai-board .cell").nth(5)).toHaveClass(/fired/);
});

test("enemy fleet status does not show partial damage during battle", async ({ page }) => {
  await engage(page);
  await page.locator("#ai-board .cell").nth(0).click();
  await expect(page.locator("#ai-fleet")).not.toContainText(/\d+ of \d+ damage/);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("plays through turns with cinematic animations suppressed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.locator("#stage canvas")).toHaveCount(0);
    await engage(page);
    await expect(page.locator("#ai-wrap .fx-layer .radar")).toHaveCount(1);
    await page.locator("#ai-board .cell").nth(0).click();
    await expect(page.locator("#ai-board .cell").nth(0)).toHaveClass(/fired/);
    await expect(page.locator("#turn-banner")).toContainText("YOUR TURN", { timeout: 10_000 });
    await expect(page.locator("#ai-wrap .torpedo, #ai-wrap .impact, #ai-wrap .sonar-pulse")).toHaveCount(0);
    const next = page.locator("#ai-board .cell").nth(1);
    await expect(next).toBeEnabled({ timeout: 10_000 });
    await next.click();
    await expect(next).toHaveClass(/fired/, { timeout: 10_000 });
  });
});
