// Schedules a one-time "wake test" ~5 minutes out so you can verify the laptop
// wakes from sleep and launches the app. Run it, then put the laptop to sleep.
//
// This goes through the app's REAL registration path (buildRegisterScript +
// launcherPath), so a passing test vouches for exactly what the app schedules.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DateTime } from "luxon";
import { buildRegisterScript, taskDateTime } from "../src/server/wakeSchedule.js";
import { launcherPath } from "../src/server/wake.js";

const run = promisify(execFile);

const when = DateTime.now().plus({ minutes: 5 });
const { bat, root } = launcherPath();
const script = buildRegisterScript("TableDrop_WAKETEST", taskDateTime(when), bat, root);

await run(
  "powershell.exe",
  ["-NoProfile", "-NonInteractive", "-Command", script],
  { windowsHide: true }
);

console.log("");
console.log(`  Wake test scheduled for ${when.toFormat("h:mm:ss a")} (via the app's real registration path).`);
console.log("  NOW put the laptop to SLEEP (Start > Power > Sleep), plugged in.");
console.log("  In about 5 minutes it should wake and open the app.");
console.log("  (The test task cleans itself up about an hour after firing.)");
console.log("");
