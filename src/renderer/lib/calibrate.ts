import { DateTime } from "luxon";

const HHMM = /^(\d{2}):(\d{2})$/;

// Back-computes a rolling booking window from the furthest date currently
// bookable: window = furthestDate - (day of the most recent drop), in the
// venue's timezone. If releaseTime ("HH:MM") is given and today's release
// hasn't happened yet, the most recent drop was yesterday — so checking
// before the drop no longer comes out a day short.
// Returns null for an invalid date or a non-positive window.
export function windowFromFurthestDate(
  furthestIso: string,
  timezone: string,
  now: DateTime,
  releaseTime?: string
): number | null {
  const furthest = DateTime.fromISO(furthestIso, { zone: timezone }).startOf("day");
  if (!furthest.isValid) return null;
  const local = now.setZone(timezone);
  let lastDropDay = local.startOf("day");
  const m = releaseTime ? releaseTime.match(HHMM) : null;
  if (m) {
    const release = local.set({ hour: Number(m[1]), minute: Number(m[2]), second: 0, millisecond: 0 });
    if (local < release) lastDropDay = lastDropDay.minus({ days: 1 });
  }
  const days = Math.round(furthest.diff(lastDropDay, "days").days);
  return days >= 1 ? days : null;
}
