import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { GAME_TAGS } from "./data/tags";
import { parseRange } from "./lib/players";

const games = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/games" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().min(10, "Write a real description (it's used for the meta description)"),
      minplayers: z.number().int().positive(),
      maxplayers: z.number().int().positive(),
      bestplayers: z
        .union([z.number().int().positive(), z.string().regex(/^\d+(-\d+)?$/)])
        .transform(parseRange)
        .optional(),
      time: z.number().int().positive().optional(),
      equipment: z.string().optional(),
      designer: z.string().optional(),
      date: z.coerce.date(),
      modified: z.coerce.date().optional(),
      tags: z.array(z.enum(GAME_TAGS)).min(1),
      tools: z.array(reference("tools")).default([]),
    })
    .refine((d) => d.maxplayers >= d.minplayers, "maxplayers must be ≥ minplayers"),
});

/**
 * Standalone interactive tools. The entry holds metadata and "How to use" help;
 * the implementation lives in src/tools/<id>/ and the route in src/pages/tools/<id>.astro.
 * Games link to tools (game `tools: [id]`); a tool's games are derived from that.
 */
const tools = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tools" }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(10),
    date: z.coerce.date(),
  }),
});

export const collections = { games, tools };
