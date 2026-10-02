import { DateTime } from "luxon";
import { join } from "node:path";
import { homedir } from "node:os";
import { loadStore } from "./store.js";
import { upcomingDrops } from "./upcoming.js";

const STORE_PATH =
  process.env.RESERVATION_STORE ??
  join(homedir(), ".reservation-tool", "store.json");

function main(): void {
  const restaurants = loadStore(STORE_PATH);
  if (restaurants.length === 0) {
    console.log(`No restaurants in store (${STORE_PATH}).`);
    console.log("Import the seed or add restaurants first.");
    return;
  }
  const drops = upcomingDrops(restaurants, DateTime.now());
  console.log(`Upcoming drops (${drops.length}):\n`);
  for (const d of drops) {
    const when = DateTime.fromISO(d.fireAtIso).toLocal().toFormat("ccc LLL d, HH:mm");
    const hrs = (d.secondsUntil / 3600).toFixed(1);
    console.log(`  ${d.restaurant.name.padEnd(24)} ${when}  (in ${hrs}h)  ${d.restaurant.platform}`);
  }
}

main();
