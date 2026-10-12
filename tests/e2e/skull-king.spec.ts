import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const axe = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();

async function addPlayers(page: Page, names: string[]) {
  for (const name of names) {
    await page.getByRole("button", { name: "Add Player" }).click();
    await page.keyboard.type(name);
  }
}

test.describe("Skull King scorecard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("tools/skull-king/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("records a round with the keyboard and keeps it after reload", async ({ page }) => {
    await addPlayers(page, ["Ann", "Ben", "Cat"]);
    await page.getByRole("button", { name: "Start Game" }).click();

    await page.getByRole("button", { name: "Record round" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Ann/ })).toBeVisible();

    // Round 1 has one card, so the quick picks are 0 and 1.
    await expect(dialog.getByRole("group", { name: "Choose bid" }).getByRole("button", { name: "2" })).toHaveCount(0);

    // Ann: bid 1, won 1, bonus 0 → 20
    for (const [bid, won] of [
      ["1", "1"],
      ["0", "0"],
      ["1", "0"],
    ]) {
      await dialog
        .getByRole("group", { name: "Choose bid" })
        .getByRole("button", { name: bid, exact: true })
        .press("Enter");
      await dialog
        .getByRole("group", { name: "Choose tricks won" })
        .getByRole("button", { name: won, exact: true })
        .press("Enter");
      await dialog
        .getByRole("group", { name: "Choose bonus and save" })
        .getByRole("button", { name: "0", exact: true })
        .press("Enter");
    }
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole("button", { name: /Ann, round 1: bid 1, won 1, bonus 0, round score 20, total 20/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Ben, round 1: .*round score 10/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Leading: Ann/ })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Cat: round 1 score -10");

    expect((await axe(page)).violations.map((v) => v.id)).toEqual([]);

    await page.reload();
    await expect(page.getByRole("button", { name: /Ann, round 1: .*total 20/ })).toBeVisible();
  });

  test("round controls stay within 1–10", async ({ page }) => {
    await addPlayers(page, ["Ann"]);
    await page.getByRole("button", { name: "Start Game" }).click();
    await expect(page.getByRole("button", { name: "Previous round" })).toBeDisabled();
    for (let i = 0; i < 9; i++) await page.getByRole("button", { name: "Next round" }).click();
    await expect(page.getByText("Round: 10")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next round" })).toBeDisabled();
  });

  test("the editor dialog has no accessibility violations", async ({ page }) => {
    await addPlayers(page, ["Ann", "Ben"]);
    await page.getByRole("button", { name: "Start Game" }).click();
    await page.getByRole("button", { name: /Ben, round 3/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect((await axe(page)).violations.map((v) => v.id)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: /Ben, round 3/ })).toBeFocused();
  });

  test("migrates a game saved by the old Alpine scorecard", async ({ page }) => {
    const round = (bid: number, won: number, bidResult: number) => ({
      bid,
      won,
      bonus: 0,
      bidResult,
      score: bidResult,
      incScore: bidResult,
    });
    const empty = round(0, 0, 0);
    await page.evaluate(
      (players) => {
        localStorage.clear();
        localStorage.setItem("_x_playerList", JSON.stringify(players));
        localStorage.setItem("_x_started", "true");
      },
      [{ name: "Old Timer", rounds: [round(1, 1, 20), ...Array(9).fill(empty)], totalScore: 20 }],
    );
    await page.reload();
    await expect(page.getByRole("button", { name: /Old Timer, round 1: bid 1, won 1/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Old Timer, round 2: not entered/ })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("_x_playerList"))).toBeNull();
  });
});
