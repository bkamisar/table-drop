import { DateTime } from "luxon";

// True only for a real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30).
export function isRealIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    DateTime.fromISO(value).isValid
  );
}
