/**
 * Safe localStorage access for tools. Storage can be missing or throw (private
 * browsing, blocked site data), so every call is guarded and callers fall back
 * to in-memory state.
 *
 * Keys are namespaced `rules:<tool>:v<version>`: localStorage is shared by the
 * whole nathan-long.com origin, not just /rules.
 */

export const storageKey = (tool: string, version: number) => `rules:${tool}:v${version}`;

function getStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const probe = "rules:probe";
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export interface ToolStorage {
  /** False when the browser won't let us save (private mode, blocked storage). */
  readonly available: boolean;
  read(key: string): unknown;
  write(key: string, value: unknown): boolean;
  remove(key: string): void;
}

export function createToolStorage(storage: Storage | null = getStorage()): ToolStorage {
  return {
    available: storage !== null,
    read(key) {
      try {
        const raw = storage?.getItem(key);
        return raw == null ? undefined : JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    write(key, value) {
      try {
        storage?.setItem(key, JSON.stringify(value));
        return storage !== null;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        storage?.removeItem(key);
      } catch {
        // Nothing to do: storage is unavailable.
      }
    },
  };
}
