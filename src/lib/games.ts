import { getCollection, type CollectionEntry } from "astro:content";
import { TOOLS_TAG } from "~/data/tags";

export type Game = CollectionEntry<"games">;
export type Tool = CollectionEntry<"tools">;
export type ListEntry = Game | Tool;

const byTitle = (a: ListEntry, b: ListEntry) => a.data.title.localeCompare(b.data.title);

export const getGames = async () => (await getCollection("games")).sort(byTitle);
export const getTools = async () => (await getCollection("tools")).sort(byTitle);

/** Newest first. Copies the array, since `sort` works in place. */
export const latest = (games: Game[], n = 3) =>
  [...games].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, n);

export const tagsOf = (entry: ListEntry): string[] =>
  entry.collection === "games" ? [...entry.data.tags] : [TOOLS_TAG];

export const allTags = (entries: ListEntry[]) =>
  [...new Set(entries.flatMap(tagsOf))].sort((a, b) => a.localeCompare(b));

export const gamesUsingTool = (games: Game[], toolId: string) =>
  games.filter((g) => g.data.tools.some((t) => t.id === toolId));

export const entryUrl = (entry: ListEntry) => `/${entry.collection}/${entry.id}/`;
