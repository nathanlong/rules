// Serve dist/ the way GitHub Pages serves this site: under /rules/, with
// directory index pages, a redirect to add a missing trailing slash, and 404.html.
// Used by Playwright (`astro preview` backgrounds itself in non-interactive shells).
// Usage: node scripts/serve-dist.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const BASE = "/rules";
const ROOT = path.resolve("dist");
const PORT = Number(process.argv[2] ?? 4329);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const isFile = (p) =>
  stat(p).then(
    (s) => s.isFile(),
    () => false,
  );
const isDir = (p) =>
  stat(p).then(
    (s) => s.isDirectory(),
    () => false,
  );

async function send(res, status, file) {
  res.writeHead(status, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const notFound = () => send(res, 404, path.join(ROOT, "404.html"));

  if (!url.pathname.startsWith(`${BASE}/`)) return notFound();

  const file = path.join(ROOT, decodeURIComponent(url.pathname.slice(BASE.length)));
  if (!file.startsWith(ROOT)) return notFound();

  if (await isDir(file)) {
    if (!url.pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    const index = path.join(file, "index.html");
    return (await isFile(index)) ? send(res, 200, index) : notFound();
  }
  return (await isFile(file)) ? send(res, 200, file) : notFound();
}).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}/`));
