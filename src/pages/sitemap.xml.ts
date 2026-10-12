import type { APIContext } from "astro";
import { allTags, entryUrl, getGames, getTools } from "~/lib/games";
import { tagUrl } from "~/lib/slug";
import { absoluteUrl } from "~/lib/url";

const STATIC_PAGES = ["/", "/games/", "/tags/", "/two-player/", "/three-player/", "/four-player/"];

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(context: APIContext) {
  const games = await getGames();
  const tools = await getTools();

  const urls: { path: string; lastmod?: Date }[] = [
    ...STATIC_PAGES.map((path) => ({ path })),
    ...games.map((g) => ({ path: entryUrl(g), lastmod: g.data.modified ?? g.data.date })),
    ...tools.map((t) => ({ path: entryUrl(t), lastmod: t.data.date })),
    ...allTags([...games, ...tools]).map((tag) => ({ path: tagUrl(tag) })),
  ];

  const body = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ path, lastmod }) =>
      `  <url>
    <loc>${absoluteUrl(path, context.site)}</loc>${lastmod ? `\n    <lastmod>${isoDate(lastmod)}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
