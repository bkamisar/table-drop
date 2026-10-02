// One-click publishing of verified restaurants to the public site's starter
// list. Shows exactly what will change, asks for confirmation, then commits
// src/data/starter.json locally. Pushing is left to GitHub Desktop.
// Usage: npx tsx scripts/publish-starter.ts [path-to-list.json]
//   default source: the desktop app's store (~/.reservation-tool/store.json)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { execFileSync } from "node:child_process";
import { buildStarterList, diffStarter } from "../src/core/starter.js";
import { storePath } from "../src/server/store-path.js";
import type { Restaurant } from "../src/core/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const starterFile = "src/data/starter.json";
const source = process.argv[2] ?? storePath();

function readList(path: string): unknown[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return Array.isArray(raw) ? raw : (raw.restaurants ?? []);
}

function show(title: string, list: Restaurant[]): void {
  if (list.length === 0) return;
  console.log(`\n  ${title} (${list.length}):`);
  for (const r of list) console.log(`    - ${r.name} (${r.city})`);
}

const before = readList(join(root, starterFile)) as Restaurant[];
const after = buildStarterList(readList(source));
const { added, updated, removed } = diffStarter(before, after);

console.log(`\n  Verified restaurants in your list: ${after.length}`);
if (added.length + updated.length + removed.length === 0) {
  console.log("  Nothing new to publish — the website already has all of them.\n");
  process.exit(0);
}
show("NEW on the website", added);
show("UPDATED (re-verified)", updated);
show("REMOVED from the website (no longer verified in your list)", removed);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question("\n  Publish these changes? Type y and press Enter: ")).trim().toLowerCase();
rl.close();
if (answer !== "y" && answer !== "yes") {
  console.log("\n  Cancelled — nothing changed.\n");
  process.exit(0);
}

writeFileSync(join(root, starterFile), JSON.stringify({ restaurants: after }, null, 2) + "\n");
const parts = [
  added.length ? `+${added.length} new` : "",
  updated.length ? `${updated.length} updated` : "",
  removed.length ? `-${removed.length} removed` : "",
].filter(Boolean).join(", ");
const message = `data: publish ${after.length} verified restaurant(s) (${parts})`;
// Commit only the starter file, even if other files have unsaved changes.
execFileSync("git", ["add", "--", starterFile], { cwd: root, stdio: "inherit" });
execFileSync("git", ["commit", "-q", "-m", message, "--", starterFile], { cwd: root, stdio: "inherit" });
console.log(`\n  Saved: "${message}"`);
console.log('  Last step: open GitHub Desktop and click "Push origin". The website updates in about a minute.\n');
