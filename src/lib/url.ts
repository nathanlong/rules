const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/rules"

/** Prefix a root-relative path with the site base: `/games/` → `/rules/games/`. */
export const withBase = (path: string) => `${BASE}/${path.replace(/^\//, "")}`;

/** Absolute URL for a root-relative path, including the base. */
export const absoluteUrl = (path: string, site: URL | undefined) => {
  if (!site) throw new Error("`site` must be set in astro.config.ts");
  return new URL(withBase(path), site).href;
};
