/** Player-count filter: "6+" means 6 or more; otherwise an exact count within the game's range. */
export function matchesPlayers(value: string, min: number, max: number): boolean {
  if (!value) return true;
  if (value.endsWith("+")) return max >= Number.parseInt(value, 10);
  const n = Number(value);
  return min <= n && n <= max;
}
