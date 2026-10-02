import { DateTime } from "luxon";
import type { DropRule } from "./types.js";

/**
 * Returns the next instant (as a Luxon DateTime in the rule's timezone) at which
 * this restaurant's reservations open, or null if the rule is manual.
 */
export function computeNextFire(
  rule: DropRule,
  now: DateTime
): DateTime | null {
  if (rule.kind === "manual") return null;

  const [hour, minute] = parseHHMM(rule.releaseTime);
  const nowInZone = now.setZone(rule.timezone);

  if (rule.kind === "rolling") {
    let release = nowInZone.set({
      hour,
      minute,
      second: 0,
      millisecond: 0,
    });
    if (release <= nowInZone) {
      release = release.plus({ days: 1 });
    }
    return release;
  }

  // monthly
  let release = atDayOfMonth(nowInZone, rule.dayOfMonth).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
  if (release <= nowInZone) {
    release = atDayOfMonth(
      nowInZone.plus({ months: 1 }),
      rule.dayOfMonth
    ).set({ hour, minute, second: 0, millisecond: 0 });
  }
  return release;
}

// The exact moment a given dining date's tables unlock, for a rolling rule.
// (dining date - bookingWindowDays) at releaseTime, in the rule's timezone.
export function dropMomentForDiningDate(
  rule: DropRule,
  diningDateIso: string
): DateTime | null {
  if (rule.kind !== "rolling") return null;
  const [hour, minute] = parseHHMM(rule.releaseTime);
  const dine = DateTime.fromISO(diningDateIso, { zone: rule.timezone });
  if (!dine.isValid) return null;
  return dine
    .minus({ days: rule.bookingWindowDays })
    .set({ hour, minute, second: 0, millisecond: 0 });
}

// For a rolling rule, the dining date that a drop landing on `fire` unlocks.
export function unlocksDateFor(rule: DropRule, fire: DateTime): string | null {
  if (rule.kind !== "rolling") return null;
  return fire.plus({ days: rule.bookingWindowDays }).toISODate();
}

function parseHHMM(value: string): [number, number] {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid releaseTime: ${value}`);
  return [Number(match[1]), Number(match[2])];
}

// Sets the day of month, clamping to the last valid day (e.g. 31 -> 30 in June).
function atDayOfMonth(dt: DateTime, dayOfMonth: number): DateTime {
  const clamped = Math.min(dayOfMonth, dt.daysInMonth ?? 28);
  return dt.set({ day: clamped });
}
