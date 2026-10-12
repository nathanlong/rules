import { describe, expect, it } from "vitest";
import { createToolStorage } from "~/lib/tools/storage";
import { LEGACY_KEYS, SAVE_KEY, loadGame, migrateLegacy, newGame, parseSavedGame, saveGame } from "./storage";

/** In-memory Storage stand-in. */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const legacyRound = (bid = 0, won = 0, bonus = 0, bidResult = 0) => ({
  bid,
  won,
  bonus,
  bidResult,
  score: bidResult + bonus,
  incScore: 0,
});

/** Shape written by the Alpine.js scorecard via $persist. */
const legacyPlayers = [
  {
    name: "Alice",
    rounds: [legacyRound(1, 1, 0, 20), legacyRound(0, 0, 0, 20), ...Array.from({ length: 8 }, () => legacyRound())],
    totalScore: 40,
  },
  {
    name: "Bob",
    rounds: [legacyRound(0, 1, 0, -10), ...Array.from({ length: 9 }, () => legacyRound())],
    totalScore: -10,
  },
];

describe("migrateLegacy", () => {
  it("keeps entered rounds and blanks untouched ones", () => {
    const game = migrateLegacy(legacyPlayers, true)!;
    expect(game.started).toBe(true);
    expect(game.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(game.players[0].rounds[0]).toEqual({ bid: 1, won: 1, bonus: 0 });
    expect(game.players[0].rounds[1]).toEqual({ bid: 0, won: 0, bonus: 0 });
    expect(game.players[0].rounds[2]).toEqual({ bid: null, won: null, bonus: 0 });
    expect(game.players[1].rounds[0]).toEqual({ bid: 0, won: 1, bonus: 0 });
  });

  it("rejects data that isn't the scorecard's", () => {
    expect(migrateLegacy([{ foo: 1 }], false)).toBeNull();
    expect(migrateLegacy("nope", false)).toBeNull();
  });
});

describe("loadGame", () => {
  it("migrates the Alpine keys once, then removes them", () => {
    const storage = memoryStorage({
      [LEGACY_KEYS.players]: JSON.stringify(legacyPlayers),
      [LEGACY_KEYS.started]: "true",
    });
    const game = loadGame(createToolStorage(storage));
    expect(game.players).toHaveLength(2);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
    expect(storage.getItem(LEGACY_KEYS.players)).toBeNull();
  });

  it("leaves unrelated _x_ keys alone when they aren't scorecard data", () => {
    const storage = memoryStorage({ [LEGACY_KEYS.players]: JSON.stringify({ other: "app" }) });
    expect(loadGame(createToolStorage(storage))).toEqual(newGame());
    expect(storage.getItem(LEGACY_KEYS.players)).not.toBeNull();
  });

  it("starts fresh on corrupt data", () => {
    const storage = memoryStorage({ [SAVE_KEY]: "{not json" });
    expect(loadGame(createToolStorage(storage))).toEqual(newGame());
  });

  it("round-trips a saved game", () => {
    const tool = createToolStorage(memoryStorage());
    const game = migrateLegacy(legacyPlayers, true)!;
    game.currentRound = 3;
    saveGame(game, tool);
    expect(loadGame(tool)).toEqual(game);
  });

  it("works in memory when storage throws", () => {
    const broken = memoryStorage();
    broken.getItem = () => {
      throw new Error("SecurityError");
    };
    broken.setItem = broken.getItem;
    const tool = createToolStorage(broken);
    expect(loadGame(tool)).toEqual(newGame());
    expect(saveGame(newGame(), tool)).toBe(false);
  });
});

describe("parseSavedGame", () => {
  it("clamps an out-of-range round", () => {
    expect(parseSavedGame({ version: 1, players: [], started: false, currentRound: 42 })?.currentRound).toBe(9);
  });

  it("rejects unknown versions", () => {
    expect(parseSavedGame({ version: 2, players: [] })).toBeNull();
  });
});
