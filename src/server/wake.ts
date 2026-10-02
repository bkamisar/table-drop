import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DateTime } from "luxon";
import type { Restaurant } from "../core/types.js";
import { WAKE_LEAD_MINUTES } from "../core/types.js";
import {
  wakeMomentFor, taskNameFor, taskDateTime,
  buildRegisterScript, buildUnregisterScript, buildStatusScript, buildListScript,
} from "./wakeSchedule.js";

const run = promisify(execFile);

function projectRoot(): string {
  // src/server/wake.ts -> project root is two levels up.
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

// The single source of truth for what a wake task launches. The test tool
// (scripts/test-wake.ts) uses this too, so it exercises the real path.
export function launcherPath(): { bat: string; root: string } {
  const root = projectRoot();
  return { bat: join(root, "Start Table Drop.bat"), root };
}

async function ps(script: string): Promise<string> {
  // execFile (no shell): the script is passed as a single argument, and all
  // interpolated values (sanitized task name, ISO datetime, known bat path)
  // are constrained, so there is no shell-injection surface.
  const { stdout } = await run(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true }
  );
  return stdout.trim();
}

type Result = { ok: true; wakeAt?: string } | { ok: false; error: string };

export async function scheduleWake(r: Restaurant): Promise<Result> {
  if (process.platform !== "win32") return { ok: false, error: "Wake-up is only available on Windows." };
  const wake = wakeMomentFor(r, WAKE_LEAD_MINUTES, DateTime.now());
  if (!wake) return { ok: false, error: "Set a future target date on this restaurant first." };
  const { bat, root } = launcherPath();
  // The task bakes in an absolute path; fail loudly NOW rather than silently
  // at 3 AM if the launcher was renamed or moved.
  if (!existsSync(bat)) {
    return { ok: false, error: `Launcher not found: ${bat}. Was "Start Table Drop.bat" renamed or moved?` };
  }
  try {
    await ps(buildRegisterScript(taskNameFor(r.id), taskDateTime(wake), bat, root));
    return { ok: true, wakeAt: wake.toISO()! };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function cancelWake(id: string): Promise<Result> {
  if (process.platform !== "win32") return { ok: false, error: "Wake-up is only available on Windows." };
  try {
    await ps(buildUnregisterScript(taskNameFor(id)));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function wakeStatus(id: string): Promise<{ scheduled: boolean; nextRun: string | null }> {
  if (process.platform !== "win32") return { scheduled: false, nextRun: null };
  try {
    const out = await ps(buildStatusScript(taskNameFor(id)));
    if (out === "NONE" || out === "") return { scheduled: false, nextRun: null };
    return { scheduled: true, nextRun: out };
  } catch {
    return { scheduled: false, nextRun: null };
  }
}

// Status for every restaurant in ONE PowerShell spawn (instead of one per
// card). Returns a map of restaurant id -> next-run ISO for scheduled wakes.
export async function wakeStatusAll(ids: string[]): Promise<Record<string, string>> {
  if (process.platform !== "win32") return {};
  try {
    const out = await ps(buildListScript());
    const byTask = new Map<string, string>();
    for (const line of out.split(/\r?\n/)) {
      const sep = line.indexOf("|");
      if (sep > 0) byTask.set(line.slice(0, sep).trim(), line.slice(sep + 1).trim());
    }
    const result: Record<string, string> = {};
    for (const id of ids) {
      const nextRun = byTask.get(taskNameFor(id));
      if (nextRun) result[id] = nextRun;
    }
    return result;
  } catch {
    return {};
  }
}
