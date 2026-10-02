import { DateTime } from "luxon";
import type { Restaurant } from "../../core/types.js";
import { windowFromFurthestDate } from "./calibrate.js";

// Only rolling-window restaurants have a window to measure.
export function needsVerification(r: Restaurant): boolean {
  return r.dropRule.kind === "rolling" && !r.verifiedOn;
}

// "9:00" -> "09:00"; returns null for anything that isn't a valid 24h time.
export function normalizeTime(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export type VerifyResult =
  | { ok: true; restaurant: Restaurant; window: number }
  | { ok: false; error: string };

// Turns two first-hand observations (stated release time + furthest bookable
// date) into a corrected, verified restaurant.
export function applyVerification(
  r: Restaurant,
  input: { releaseTime: string; furthestIso: string },
  now: DateTime
): VerifyResult {
  if (r.dropRule.kind !== "rolling") {
    return { ok: false, error: "Only daily-rolling restaurants can be verified here — use Edit for others." };
  }
  const releaseTime = normalizeTime(input.releaseTime);
  if (!releaseTime) return { ok: false, error: "Release time must be 24-hour HH:MM, e.g. 09:00." };
  const window = windowFromFurthestDate(input.furthestIso, r.dropRule.timezone, now, releaseTime);
  if (!window) return { ok: false, error: "The furthest bookable date must be in the future." };
  return {
    ok: true,
    window,
    restaurant: {
      ...r,
      dropRule: { ...r.dropRule, releaseTime, bookingWindowDays: window },
      verifiedOn: now.toISODate()!,
    },
  };
}
