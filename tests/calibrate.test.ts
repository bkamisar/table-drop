import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { windowFromFurthestDate } from "../src/renderer/lib/calibrate.js";

describe("windowFromFurthestDate", () => {
  const jul6Paris = DateTime.fromISO("2026-07-06T15:00:00", { zone: "Europe/Paris" });
  const jul6ET = DateTime.fromISO("2026-07-06T10:00:00", { zone: "America/New_York" });

  it("derives La Renommée's window (Aug 4 max on Jul 6 = 29)", () => {
    expect(windowFromFurthestDate("2026-08-04", "Europe/Paris", jul6Paris)).toBe(29);
  });

  it("derives Septime's window (Jul 27 max on Jul 6 = 21)", () => {
    expect(windowFromFurthestDate("2026-07-27", "Europe/Paris", jul6Paris)).toBe(21);
  });

  it("derives 4 Charles' window (Jul 26 max on Jul 6 = 20)", () => {
    expect(windowFromFurthestDate("2026-07-26", "America/New_York", jul6ET)).toBe(20);
  });

  it("returns null for a past or same-day furthest date", () => {
    expect(windowFromFurthestDate("2026-07-06", "America/New_York", jul6ET)).toBeNull();
    expect(windowFromFurthestDate("2026-07-01", "America/New_York", jul6ET)).toBeNull();
  });

  it("returns null for an unparseable date", () => {
    expect(windowFromFurthestDate("not-a-date", "America/New_York", jul6ET)).toBeNull();
  });
});

describe("windowFromFurthestDate with release time", () => {
  it("4 Charles: before the 9:00 drop, furthest Jul 25 still means window 20", () => {
    const before = DateTime.fromISO("2026-07-06T08:00:00", { zone: "America/New_York" });
    expect(windowFromFurthestDate("2026-07-25", "America/New_York", before, "09:00")).toBe(20);
  });

  it("4 Charles: after the 9:00 drop, furthest Jul 26 means window 20", () => {
    const after = DateTime.fromISO("2026-07-06T10:00:00", { zone: "America/New_York" });
    expect(windowFromFurthestDate("2026-07-26", "America/New_York", after, "09:00")).toBe(20);
  });

  it("La Renommée: before 9:00 Paris, furthest Aug 3 means window 29", () => {
    const before = DateTime.fromISO("2026-07-06T07:00:00", { zone: "Europe/Paris" });
    expect(windowFromFurthestDate("2026-08-03", "Europe/Paris", before, "09:00")).toBe(29);
  });

  it("ignores a malformed release time (treats today as the last drop)", () => {
    const now = DateTime.fromISO("2026-07-06T08:00:00", { zone: "America/New_York" });
    expect(windowFromFurthestDate("2026-07-26", "America/New_York", now, "9am")).toBe(20);
  });
});
