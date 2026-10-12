// Snapshot every page/feed URL in a build output folder, with its title and description.
// Usage: node scripts/snapshot-urls.mjs <outDir> > snapshot.json
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node scripts/snapshot-urls.mjs <outDir>");
  process.exit(1);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const pages = {};
for await (const file of walk(outDir)) {
  if (!/\.(html|xml)$/.test(file)) continue;
  const rel = "/" + path.relative(outDir, file).split(path.sep).join("/");
  const url = rel.replace(/index\.html$/, "");
  const entry = {};
  if (file.endsWith(".html")) {
    const html = await readFile(file, "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/);
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    if (title) entry.title = decode(title[1]);
    if (desc) entry.description = decode(desc[1]);
  }
  pages[url] = entry;
}

const sorted = Object.fromEntries(Object.entries(pages).sort(([a], [b]) => a.localeCompare(b)));
console.log(JSON.stringify(sorted, null, 2));
