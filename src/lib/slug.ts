import slugify from "slugify";

/** Matches Eleventy's `slug` filter, so tag URLs stay the same (`Low/No Component` → `lowno-component`). */
export const tagSlug = (tag: string) => slugify(tag, { replacement: "-", lower: true });

export const tagUrl = (tag: string) => `/tags/${tagSlug(tag)}/`;
