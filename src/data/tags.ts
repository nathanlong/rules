/** The only tags a game may use. A typo fails the build instead of creating a stray tag page. */
export const GAME_TAGS = [
  "Standard Cards",
  "Dominoes",
  "Dice",
  "Low/No Component",
  "Specialty Components",
  "Solitaire",
  "Party",
  "Trick-taking",
  "Climbing Card Game",
  "Fishing Card Game",
  "Kid-friendly",
] as const;

export type GameTag = (typeof GAME_TAGS)[number];

/** Given automatically to every entry in the tools collection. */
export const TOOLS_TAG = "Tools";
