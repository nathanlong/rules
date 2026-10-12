import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GAME_TAGS, TOOLS_TAG } from "~/data/tags";
import { tagSlug, tagUrl } from "./slug";

const baseline: Record<string, unknown> = JSON.parse(
  readFileSync(new URL("../../tests/parity/baseline.json", import.meta.url), "utf8"),
);

describe("tagSlug", () => {
  it("matches Eleventy's slugs", () => {
    expect(tagSlug("Low/No Component")).toBe("lowno-component");
    expect(tagSlug("Kid-friendly")).toBe("kid-friendly");
    expect(tagSlug("Standard Cards")).toBe("standard-cards");
  });

  it("produces a tag page URL that existed in the Eleventy build for every tag", () => {
    for (const tag of [...GAME_TAGS, TOOLS_TAG]) {
      expect(baseline, `${tag} → ${tagUrl(tag)}`).toHaveProperty([tagUrl(tag)]);
    }
  });
});
