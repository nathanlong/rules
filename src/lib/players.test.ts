import { describe, expect, it } from "vitest";
import { bestAt, formatPlayers, parseRange, playsAt } from "./players";

const game = (min: number, max: number, best?: number | string) => ({
  minplayers: min,
  maxplayers: max,
  bestplayers: best === undefined ? undefined : parseRange(best),
});

describe("parseRange", () => {
  it("parses single counts and ranges", () => {
    expect(parseRange(4)).toEqual({ min: 4, max: 4, label: "4" });
    expect(parseRange("4-6")).toEqual({ min: 4, max: 6, label: "4-6" });
  });
});

describe("playsAt", () => {
  it("includes both ends of the range", () => {
    expect(playsAt(game(2, 5), 2)).toBe(true);
    expect(playsAt(game(2, 5), 5)).toBe(true);
    expect(playsAt(game(2, 5), 6)).toBe(false);
  });

  it("keeps two-player-only games off the three-player list", () => {
    expect(playsAt(game(2, 2), 3)).toBe(false);
  });
});

describe("bestAt", () => {
  it("handles ranges like 4-6", () => {
    expect(bestAt(game(2, 8, "4-6"), 4)).toBe(true);
    expect(bestAt(game(2, 8, "4-6"), 6)).toBe(true);
    expect(bestAt(game(2, 8, "4-6"), 3)).toBe(false);
  });

  it("is false without a best count", () => {
    expect(bestAt(game(2, 4), 2)).toBe(false);
  });
});

describe("formatPlayers", () => {
  it("formats like the old templates", () => {
    expect(formatPlayers(game(1, 1))).toBe("1");
    expect(formatPlayers(game(2, 5, 4))).toBe("2-5(4)");
    expect(formatPlayers(game(2, 5, 4), "long")).toBe("2-5 (Best at 4)");
  });
});
