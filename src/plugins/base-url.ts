import { defineHastPlugin } from "satteri";

/** Path with a file extension, e.g. `/img/foo.svg` or `/feed/feed.xml`. */
const hasExtension = (path: string) => /\.[a-z0-9]+$/i.test(path);

/**
 * Prefix the site base onto root-relative links in Markdown, and add the
 * trailing slash that page URLs need (`/games/wizard` → `/rules/games/wizard/`).
 */
export function prefixBase(value: string, base: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return value;
  if (value === base || value.startsWith(`${base}/`)) return value;

  const match = value.match(/^([^?#]*)(.*)$/)!;
  let [, path, rest] = match;
  if (!path.endsWith("/") && !hasExtension(path)) path += "/";
  return `${base}${path}${rest}`;
}

export function baseUrlPlugin(base: string) {
  return defineHastPlugin({
    name: "base-url",
    element: {
      filter: ["a", "img"],
      visit(node, ctx) {
        const key = node.tagName === "a" ? "href" : "src";
        const value = node.properties?.[key];
        if (typeof value !== "string") return;
        const next = prefixBase(value, base);
        if (next !== value) ctx.setProperty(node, key, next);
      },
    },
  });
}
