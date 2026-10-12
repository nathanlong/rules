# Rules

Game rules for quick reference on the go, plus small tools for the table. Live at
[nathan-long.com/rules](https://nathan-long.com/rules/).

Built with [Astro](https://astro.build). Interactive tools are [Svelte](https://svelte.dev) islands.

## Development

Requires the Node version in `.nvmrc`.

```sh
npm install
npm run dev        # local dev server at http://localhost:4321/rules/
npm run build      # type-check (astro check) and build to dist/
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end + accessibility tests (Playwright + axe); run `npm run build` first
npm run parity     # check every URL from the old Eleventy site still exists in dist/
npm run format     # Prettier
```

The site is served from `/rules`, so internal links in components go through `withBase()` from
`src/lib/url.ts`. Root-relative links in Markdown (`/img/…`, `/games/wizard`) are prefixed automatically.

## Project layout

| Path                    | What it is                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| `src/content/games/`    | One Markdown file per game                                        |
| `src/content/tools/`    | Metadata and "How to use" text for each tool                      |
| `src/content.config.ts` | Schemas for games and tools (the build fails on invalid content)  |
| `src/data/`             | Site settings, navigation, and the allowed tag list               |
| `src/lib/`              | Shared helpers (URLs, slugs, player counts, filter, tool storage) |
| `src/layouts/`          | `BaseLayout`, `GameLayout`, and the standalone `ToolLayout`       |
| `src/components/`       | Site components; `components/tools/` holds shared tool UI         |
| `src/tools/<id>/`       | Each tool's island components, logic, styles, and tests           |
| `src/pages/`            | Routes                                                            |
| `tests/e2e/`            | Playwright tests                                                  |
| `tests/parity/`         | URL snapshot of the old Eleventy build                            |

## Adding a game

Create `src/content/games/<slug>.md`. The file name becomes the URL (`/games/<slug>/`).

```yaml
---
title: Skull King
description: Trick-taking on the high seas. Meet your bid to please the Skull King.
minplayers: 2
maxplayers: 8
bestplayers: 4-6 # optional: a number or a range
time: 30 # optional, in minutes
equipment: Specialty card deck. # optional
designer: Brent Beck, Jeffrey Beck # optional
date: 2024-02-28 # date added; drives "Latest additions" and the feed
modified: 2024-09-18 # optional
tags:
  - Specialty Components
  - Trick-taking
tools: # optional: ids of entries in src/content/tools/
  - skull-king
---
```

Tags must come from `src/data/tags.ts`. To add a new tag, add it there first. Tag pages are created
automatically. Quote any front matter value that contains `: `.

## Adding a tool

Tools are standalone, full-screen pages, such as the Skull King scorecard.

1. **Metadata:** `src/content/tools/<id>.md` with `title`, `description`, `date`, and a "How to use" body.
2. **Code:** `src/tools/<id>/` holds the island component(s), pure logic with `*.test.ts` tests, and styles.
   Shared pieces are in `src/components/tools/` (fullscreen toggle, confirm dialog, number stepper) and
   `src/lib/tools/storage.ts` (safe, namespaced `localStorage`).
3. **Route:** `src/pages/tools/<id>.astro`. Copy `skull-king.astro` and change the import.
4. **Link it** from games by adding `tools: [<id>]` to their front matter. The tool's "back to rules" link
   and the game page's "Tools" entry come from that.
5. Run `npm test`. A test checks that every tool has both a metadata entry and a route.

`ToolLayout` handles the `<head>`, skip link, `<noscript>` note, help text, and back link.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`. It runs the tests, builds, checks URL parity, and
publishes `dist/` to the `gh-pages` branch. Pull requests run the same checks plus the Playwright suite
(`.github/workflows/ci.yml`).
