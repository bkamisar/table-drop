// Builds src/data/starter.json — the public site's built-in list — from
// VERIFIED restaurants only, with personal fields (pins, target dates) removed.
// Usage: npx tsx scripts/export-starter.ts [path-to-list.json]
//   default source: the desktop app's store (~/.reservation-tool/store.json)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateRestaurant } from "../src/core/validate.js";
import { storePath } from "../src/server/store-path.js";
import type { Restaurant } from "../src/core/types.js";

const source = process.argv[2] ?? storePath();
const raw = JSON.parse(readFileSync(source, "utf8"));
const items: unknown[] = Array.isArray(raw) ? raw : (raw.restaurants ?? []);

const starter: Restaurant[] = [];
for (const item of items) {
  const v = validateRestaurant(item);
  if (!v.ok || !v.value.verifiedOn) continue;
  const { pinned: _pinned, targetDate: _target, ...publicFields } = v.value;
  void _pinned;
  void _target;
  starter.push(publicFields);
}
starter.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "starter.json");
writeFileSync(out, JSON.stringify({ restaurants: starter }, null, 2) + "\n");
console.log(`Wrote ${starter.length} verified restaurant(s) to src/data/starter.json (from ${source}).`);
