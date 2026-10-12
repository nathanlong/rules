import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  ROUNDS,
  bidScore,
  clampRound,
  emptyRound,
  leaders,
  roundScore,
  runningTotals,
  total,
  type Player,
  type Round,
} from "./scoring";

const OFFICIAL = { bonusRequiresBid: true, zeroBidPenaltyPerCard: true };

const player = (id: string, rounds: Partial<Round>[]): Player => ({
  id,
  name: id,
  rounds: Array.from({ length: ROUNDS }, (_, i) => ({ ...emptyRound(), ...rounds[i] })),
});

describe("bidScore — worked examples from the rules page", () => {
  it("successful bid of 3 → 60", () => expect(bidScore(3, 3, 4)).toBe(60));
  it("bid 2, won 4 → −20", () => expect(bidScore(2, 4, 4)).toBe(-20));
  it("successful zero bid in round 7 → 70", () => expect(bidScore(0, 0, 6)).toBe(70));

  it("failed zero bid in round 9 → −90 with the official rule", () => {
    expect(bidScore(0, 2, 8, OFFICIAL)).toBe(-90);
  });

  it("failed zero bid keeps the original scorecard's −10 per trick by default", () => {
    expect(bidScore(0, 2, 8, DEFAULT_RULES)).toBe(-20);
  });
});

describe("roundScore", () => {
  it("is null until both bid and won are entered", () => {
    expect(roundScore(emptyRound(), 0)).toBeNull();
    expect(roundScore({ bid: 1, won: null, bonus: 0 }, 0)).toBeNull();
  });

  it("adds the bonus to a made bid", () => {
    expect(roundScore({ bid: 2, won: 2, bonus: 30 }, 3)).toBe(70);
  });

  it("adds the bonus to a missed bid by default, and not with the official rule", () => {
    const missed = { bid: 2, won: 3, bonus: 20 };
    expect(roundScore(missed, 3)).toBe(10);
    expect(roundScore(missed, 3, OFFICIAL)).toBe(-10);
  });
});

describe("totals", () => {
  const alice = player("alice", [{ bid: 1, won: 1 }, { bid: 0, won: 0 }, {}, { bid: 2, won: 1, bonus: 10 }]);

  it("keeps a running total and skips rounds not entered", () => {
    // Round 4: missed bid (−10) plus a 10-point bonus, which counts by default.
    expect(runningTotals(alice)).toEqual([20, 40, null, 40, null, null, null, null, null, null]);
    expect(total(alice)).toBe(40);
    expect(total(alice, OFFICIAL)).toBe(30);
  });
});

describe("leaders", () => {
  it("is empty before anyone has scored", () => {
    expect(leaders([player("a", []), player("b", [])]).size).toBe(0);
  });

  it("shares the lead on a tie", () => {
    const a = player("a", [{ bid: 1, won: 1 }]);
    const b = player("b", [{ bid: 1, won: 1 }]);
    expect([...leaders([a, b])]).toEqual(["a", "b"]);
  });

  it("still finds a leader when every score is negative", () => {
    const a = player("a", [{ bid: 1, won: 0 }]);
    const b = player("b", [{ bid: 0, won: 1 }]);
    expect([...leaders([a, b])]).toEqual(["a", "b"]);
    const c = player("c", [{ bid: 3, won: 0 }]);
    expect([...leaders([a, c])]).toEqual(["a"]);
  });
});

describe("clampRound", () => {
  it("keeps the round between 1 and 10", () => {
    expect(clampRound(-1)).toBe(0);
    expect(clampRound(10)).toBe(9);
    expect(clampRound(4)).toBe(4);
  });
});
