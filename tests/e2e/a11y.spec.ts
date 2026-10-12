import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "",
  "games/",
  "two-player/",
  "tags/",
  "tags/standard-cards/",
  "tags/tools/",
  "games/skull-king/",
  "games/farkle/",
  "games/lamarckian-poker/",
  "games/all-fives/",
  "404.html",
  "tools/skull-king/",
];

for (const path of PAGES) {
  test(`/${path} has no accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("skip link moves focus to the main content", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium");
  await page.goto("games/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
