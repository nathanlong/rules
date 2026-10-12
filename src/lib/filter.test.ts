import { describe, expect, it } from "vitest";
import { matchesPlayers } from "./filter";

describe("matchesPlayers", () => {
  it("matches everything when no count is chosen", () => {
    expect(matchesPlayers("", 2, 4)).toBe(true);
  });

  it("compares numbers, not strings (Chickenfoot plays 2–12)", () => {
    expect(matchesPlayers("6", 2, 12)).toBe(true);
    expect(matchesPlayers("2", 2, 12)).toBe(true);
  });

  it("treats 6+ as six or more", () => {
    expect(matchesPlayers("6+", 2, 12)).toBe(true);
    expect(matchesPlayers("6+", 3, 6)).toBe(true);
    expect(matchesPlayers("6+", 2, 5)).toBe(false);
  });
});
