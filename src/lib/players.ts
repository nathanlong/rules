/** Player-count logic, kept free of `astro:content` so it can be unit tested. */

export interface Range {
  min: number;
  max: number;
  label: string;
}

export interface PlayerInfo {
  minplayers: number;
  maxplayers: number;
  bestplayers?: Range | undefined;
}

/** Parse `4` or `"4-6"` into a range. */
export function parseRange(value: number | string): Range {
  const [min, max = min] = String(value).split("-").map(Number);
  return { min, max, label: String(value) };
}

export const playsAt = (g: PlayerInfo, n: number) => g.minplayers <= n && n <= g.maxplayers;

export const bestAt = (g: PlayerInfo, n: number) => !!g.bestplayers && g.bestplayers.min <= n && n <= g.bestplayers.max;

/** "6+" in the filter means 6 or more players. */
export const playsAtLeast = (g: PlayerInfo, n: number) => g.maxplayers >= n;

/** `2`, `2-5`, with optional best count: `2-5(4)` (lists) or `2-5 (Best at 4)` (game pages). */
export function formatPlayers(g: PlayerInfo, style: "short" | "long" = "short"): string {
  const count = g.minplayers === g.maxplayers ? `${g.minplayers}` : `${g.minplayers}-${g.maxplayers}`;
  if (!g.bestplayers) return count;
  return style === "long" ? `${count} (Best at ${g.bestplayers.label})` : `${count}(${g.bestplayers.label})`;
}
