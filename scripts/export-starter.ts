// Builds src/data/starter.json — the public site's built-in list — from
// VERIFIED restaurants only, with personal fields (pins, target dates) removed.
// Non-interactive; for the confirm-and-commit flow use publish-starter.ts
// ("Publish verified restaurants.bat").
// Usage: npx tsx scripts/export-starter.ts [path-to-list.json]
//   default source: the desktop app's store (~/.reservation-tool/store.json)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildStarterList } from "../src/core/starter.js";
import { storePath } from "../src/server/store-path.js";

const source = process.argv[2] ?? storePath();
const raw = JSON.parse(readFileSync(source, "utf8"));
const starter = buildStarterList(Array.isArray(raw) ? raw : (raw.restaurants ?? []));

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "starter.json");
writeFileSync(out, JSON.stringify({ restaurants: starter }, null, 2) + "\n");
console.log(`Wrote ${starter.length} verified restaurant(s) to src/data/starter.json (from ${source}).`);
