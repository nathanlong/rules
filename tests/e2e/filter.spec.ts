import { expect, test } from "@playwright/test";

test.describe("game filter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("games/");
  });

  const visible = (page: import("@playwright/test").Page) =>
    page.locator("[data-filter-entry]:not([hidden]) [data-filter-entry-text]");

  test("searches by title and announces the count", async ({ page }) => {
    await page.getByLabel("Search by title").fill("sk");
    await expect(visible(page)).toHaveText(["Skull", "Skull King"]);
    await expect(page.getByRole("status")).toHaveText(/Showing 2 of \d+/);
  });

  test("filters 6+ players numerically, including 2–12 player games", async ({ page }) => {
    await page.getByLabel("Filter by player count").selectOption({ label: "6+" });
    await expect(visible(page).filter({ hasText: "Chickenfoot" })).toHaveCount(1);
    await expect(visible(page).filter({ hasText: "Crisps" })).toHaveCount(0);
  });

  test("filters by tag and clears", async ({ page }) => {
    await page.getByLabel("Filter by tag").selectOption({ label: "Dominoes" });
    await expect(visible(page)).toHaveText(["All Fives", "Chickenfoot", "Texas Demons"]);
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByRole("status")).toHaveText("");
    expect(await visible(page).count()).toBeGreaterThan(20);
  });
});

test("three-player page doesn't list two-player-only games", async ({ page }) => {
  await page.goto("three-player/");
  await expect(page.getByRole("link", { name: "Crisps" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "East-West" })).toHaveCount(0);
});

test("four-player page lists games best at a range including 4", async ({ page }) => {
  await page.goto("four-player/");
  const best = page.locator("h2:has-text('Best at 4') + ul");
  await expect(best.getByRole("link", { name: "Skull King", exact: true })).toBeVisible();
});
