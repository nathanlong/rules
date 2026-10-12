import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Every tool needs metadata (src/content/tools/<id>.md) and a route (src/pages/tools/<id>.astro).
const ids = (dir: string, ext: string) =>
  readdirSync(new URL(`../${dir}`, import.meta.url))
    .filter((f) => f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length))
    .sort();

describe("tools", () => {
  it("each tool entry has a page and each tool page has an entry", () => {
    expect(ids("src/pages/tools", ".astro")).toEqual(ids("src/content/tools", ".md"));
  });
});
