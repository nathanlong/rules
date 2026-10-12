import { createToolStorage, storageKey, type ToolStorage } from "~/lib/tools/storage";
import { ROUNDS, clampRound, emptyRound, type Player, type Round } from "./scoring";

export const SAVE_KEY = storageKey("skull-king", 1);

/** Keys written by the old Alpine.js scorecard (`$persist` prefixes keys with `_x_`). */
export const LEGACY_KEYS = {
  players: "_x_playerList",
  started: "_x_started",
  darkMode: "_x_darkMode",
} as const;

export interface SavedGame {
  version: 1;
  players: Player[];
  started: boolean;
  currentRound: number;
}

export const newGame = (): SavedGame => ({ version: 1, players: [], started: false, currentRound: 0 });

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const asInt = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : v;
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : null;
};

function parseRound(value: unknown): Round {
  if (!isRecord(value)) return emptyRound();
  return { bid: asInt(value.bid), won: asInt(value.won), bonus: asInt(value.bonus) ?? 0 };
}

function parsePlayer(value: unknown): Player | null {
  if (!isRecord(value) || typeof value.name !== "string" || !Array.isArray(value.rounds)) return null;
  const saved: unknown[] = value.rounds;
  const rounds = Array.from({ length: ROUNDS }, (_, i) => parseRound(saved[i]));
  return { id: typeof value.id === "string" ? value.id : newId(), name: value.name, rounds };
}

/** Validate saved data. Anything unexpected returns `null`, so the caller starts fresh. */
export function parseSavedGame(value: unknown): SavedGame | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.players)) return null;
  const players = value.players.map(parsePlayer);
  if (players.some((p) => p === null)) return null;
  return {
    version: 1,
    players: players as Player[],
    started: value.started === true,
    currentRound: clampRound(asInt(value.currentRound) ?? 0),
  };
}

/**
 * Convert the Alpine scorecard's data. It stored zeros for rounds nobody had
 * entered, and recalculated `bidResult` when a round was saved, so a round
 * counts as entered when anything in it is non-zero. (Every real result has a
 * non-zero `bidResult`.)
 */
export function migrateLegacy(players: unknown, started: unknown): SavedGame | null {
  if (!Array.isArray(players)) return null;
  const migrated: Player[] = [];
  for (const p of players) {
    if (!isRecord(p) || typeof p.name !== "string" || !Array.isArray(p.rounds)) return null;
    const legacyRounds: unknown[] = p.rounds;
    const rounds = Array.from({ length: ROUNDS }, (_, i): Round => {
      const r = legacyRounds[i];
      if (!isRecord(r)) return emptyRound();
      const [bid, won, bonus, bidResult] = [r.bid, r.won, r.bonus, r.bidResult].map((v) => asInt(v) ?? 0);
      const entered = bidResult !== 0 || bid !== 0 || won !== 0 || bonus !== 0;
      return entered ? { bid, won, bonus } : emptyRound();
    });
    migrated.push({ id: newId(), name: p.name, rounds });
  }
  return { version: 1, players: migrated, started: started === true, currentRound: 0 };
}

export function loadGame(storage: ToolStorage = createToolStorage()): SavedGame {
  const saved = parseSavedGame(storage.read(SAVE_KEY));
  if (saved) return saved;

  const legacy = migrateLegacy(storage.read(LEGACY_KEYS.players), storage.read(LEGACY_KEYS.started));
  if (legacy) {
    // Only remove the old keys once the new copy is safely written.
    if (storage.write(SAVE_KEY, legacy)) Object.values(LEGACY_KEYS).forEach((k) => storage.remove(k));
    return legacy;
  }
  return newGame();
}

export const saveGame = (game: SavedGame, storage: ToolStorage = createToolStorage()) => storage.write(SAVE_KEY, game);
