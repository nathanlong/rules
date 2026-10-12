// Compare two URL snapshots from snapshot-urls.mjs. Exits non-zero if any old URL is missing.
// Usage: node scripts/compare-urls.mjs <baseline.json> <current.json>
import { readFile } from "node:fs/promises";

/** Old URLs that are intentionally gone. */
const EXPECTED_MISSING = new Set([]);

const [baselinePath, currentPath] = process.argv.slice(2);
if (!baselinePath || !currentPath) {
  console.error("Usage: node scripts/compare-urls.mjs <baseline.json> <current.json>");
  process.exit(1);
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const current = JSON.parse(await readFile(currentPath, "utf8"));

const missing = Object.keys(baseline).filter((url) => !(url in current) && !EXPECTED_MISSING.has(url));
const added = Object.keys(current).filter((url) => !(url in baseline));

const changed = [];
for (const [url, before] of Object.entries(baseline)) {
  const after = current[url];
  if (!after) continue;
  for (const field of ["title", "description"]) {
    if (before[field] !== after[field]) changed.push({ url, field, before: before[field], after: after[field] });
  }
}

console.log(`Baseline: ${Object.keys(baseline).length} URLs. Current: ${Object.keys(current).length} URLs.\n`);
if (added.length) console.log(`New URLs (fine):\n${added.map((u) => `  + ${u}`).join("\n")}\n`);
if (changed.length) {
  console.log("Title/description changes (review):");
  for (const c of changed) console.log(`  ${c.url} [${c.field}]\n    - ${c.before}\n    + ${c.after}`);
  console.log();
}
if (missing.length) {
  console.error(`MISSING URLs:\n${missing.map((u) => `  - ${u}`).join("\n")}`);
  process.exit(1);
}
console.log("✓ Every baseline URL still exists.");
