import { expect, test } from "@playwright/test";

const consoleErrors = new WeakMap<object, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(test.info(), errors);
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  // Clear once after the first load rather than with addInitScript, which would
  // also wipe the saved game on the reload the persistence test relies on.
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test.afterEach(() => {
  expect(consoleErrors.get(test.info()) ?? []).toEqual([]);
});

test("random fleet, start battle, fire and see feedback", async ({ page }) => {
  await page.getByRole("button", { name: "Random fleet" }).click();
  const start = page.getByRole("button", { name: "Start battle" });
  await expect(start).toBeEnabled();
  await start.click();

  await expect(page.getByText("Battle stations")).toBeVisible();
  const enemy = page.locator("#ai-board .cell");
  await enemy.nth(0).click();
  await expect(page.locator("#status")).toContainText(/You (hit|missed)/);
  await expect(enemy.nth(0)).toHaveClass(/hit|miss/);
});

test("cannot fire twice at the same cell", async ({ page }) => {
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();
  const cell = page.locator("#ai-board .cell").nth(12);
  await cell.click();
  await expect(cell).toHaveClass(/fired/);
  await expect(cell).toBeDisabled();
});

test("manual placement rejects an overlapping ship", async ({ page }) => {
  const own = page.locator("#player-board .cell");
  await own.nth(0).click(); // Carrier at A1 horizontally
  await expect(page.locator("#placement-prompt")).toContainText("Battleship");
  await own.nth(1).click(); // overlaps the carrier
  await expect(page.locator("#status")).toContainText("does not fit");
});

test("plays a full game to a result screen", async ({ page }) => {
  // A full game is up to ~100 turns, each waiting on the AI's think delay.
  test.setTimeout(180_000);
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();

  const cells = page.locator("#ai-board .cell");
  for (let i = 0; i < 100; i++) {
    if (await page.locator("#gameover:not(.hidden)").isVisible()) break;
    const cell = cells.nth(i);
    if (await cell.isEnabled()) {
      await cell.click();
      await page.waitForTimeout(650); // let the AI take its turn
    }
  }
  const overlay = page.locator("#gameover");
  await expect(overlay).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#gameover-title")).toHaveText(/Victory!|Defeat/);

  await page.getByRole("button", { name: "Rematch" }).click();
  await expect(overlay).toBeHidden();
  await expect(page.locator("#placement-prompt")).toContainText("Carrier");
});

test("resumes the AI turn when reloaded mid-think", async ({ page }) => {
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();
  // Reload during the AI's think delay, so the saved game is mid-AI-turn.
  await page.locator("#ai-board .cell").nth(0).click();
  await page.reload();

  await expect(page.locator("#status")).toContainText(/The enemy (hit|missed|hit .*sank)/, {
    timeout: 10_000,
  });
  // The player must get control back rather than staring at a dead board.
  await expect(page.locator("#ai-board .cell").nth(99)).toBeEnabled();
});

test("salvo mode fires five shots at once and reports only a hit count", async ({ page }) => {
  await page.getByLabel("Game mode").selectOption("salvo");
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();

  const bar = page.locator("#salvo-bar");
  await expect(bar).toBeVisible();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 0/5");

  const enemy = page.locator("#ai-board .cell");
  for (let col = 0; col < 5; col++) await enemy.nth(col).click();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 5/5");
  // A sixth pick is refused: one shot per surviving ship.
  await enemy.nth(5).click();
  await expect(page.locator("#salvo-count")).toHaveText("Targets 5/5");

  await page.getByRole("button", { name: /Fire salvo/ }).click();
  await expect(page.locator("#status")).toContainText(/salvo of 5: (all misses|\d+ hits?)/);
  // Individual outcomes stay hidden, so no cell is painted hit or miss.
  for (let col = 0; col < 5; col++) {
    await expect(enemy.nth(col)).toHaveClass(/fired/);
    await expect(enemy.nth(col)).not.toHaveClass(/\bhit\b|\bmiss\b/);
  }
  await expect(page.locator("#status")).toContainText(/Enemy salvo of 5/, { timeout: 10_000 });
});

test("draws placed ships as hulls and keeps them under damage", async ({ page }) => {
  const own = page.locator("#player-board .cell");
  await own.nth(0).click(); // Carrier at A1, horizontal
  await expect(own.nth(0)).toHaveClass(/hull-bow/);
  await expect(own.nth(2)).toHaveClass(/hull-mid/);
  await expect(own.nth(4)).toHaveClass(/hull-stern/);
  await expect(own.nth(0)).toHaveClass(/hull-h/);

  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();

  // Trade shots until the enemy lands one, then check the struck cell still
  // shows its hull rather than being replaced by a bare orange square.
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
  await expect(page.locator("#start-battle")).toBeDisabled();
  await expect(page.locator("#start-hint")).toContainText("5 ships left to place");
  await expect(page.locator("#step-place")).toHaveClass(/active/);
  await expect(page.locator("#dock li.current")).toContainText("Carrier");

  await page.getByRole("button", { name: "Random fleet" }).click();
  await expect(page.locator("#start-battle")).toBeEnabled();
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
  await page.getByRole("button", { name: "Random fleet" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.locator("#ai-board .cell").nth(5).click();
  await page.waitForTimeout(700);

  await page.reload();
  await expect(page.locator("#placement-panel")).toBeHidden();
  await expect(page.locator("#ai-board .cell").nth(5)).toHaveClass(/fired/);
});
