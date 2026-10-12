import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "~/data/site";
import { entryUrl, getGames, latest } from "~/lib/games";
import { withBase } from "~/lib/url";

export async function GET(context: APIContext) {
  const games = latest(await getGames(), 10);

  return rss({
    title: site.title,
    description: site.description,
    // The channel link is the /rules/ home page; item links resolve against it.
    site: new URL(import.meta.env.BASE_URL, context.site),
    items: games.map((game) => ({
      title: game.data.title,
      description: game.data.description,
      pubDate: game.data.date,
      link: withBase(entryUrl(game)),
      categories: [...game.data.tags],
    })),
    customData: `<language>${site.lang}</language>`,
  });
}
