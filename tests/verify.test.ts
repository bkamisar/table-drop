import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { needsVerification, normalizeTime, applyVerification } from "../src/renderer/lib/verify.js";
import type { Restaurant } from "../src/core/types.js";

const fc: Restaurant = {
  id: "4-charles", name: "4 Charles Prime Rib", city: "New York", platform: "Resy",
  platformUrl: "https://resy.com/cities/new-york-ny/venues/4-charles-prime-rib",
  dropRule: { kind: "rolling", releaseTime: "10:00", timezone: "America/New_York", bookingWindowDays: 21 },
  tier: "alert",
};
const now = DateTime.fromISO("2026-07-06T10:00:00", { zone: "America/New_York" });

describe("needsVerification", () => {
  it("is true for an unverified rolling restaurant", () => expect(needsVerification(fc)).toBe(true));
  it("is false once verified", () => expect(needsVerification({ ...fc, verifiedOn: "2026-07-06" })).toBe(false));
  it("is false for manual rules", () => expect(needsVerification({ ...fc, dropRule: { kind: "manual" } })).toBe(false));
});

describe("normalizeTime", () => {
  it("pads and validates", () => {
    expect(normalizeTime("9:00")).toBe("09:00");
    expect(normalizeTime("12:30")).toBe("12:30");
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("9am")).toBeNull();
  });
});

describe("applyVerification", () => {
  it("sets release time, measured window, and verifiedOn", () => {
    const res = applyVerification(fc, { releaseTime: "9:00", furthestIso: "2026-07-26" }, now);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.window).toBe(20);
    expect(res.restaurant.dropRule).toEqual({ kind: "rolling", releaseTime: "09:00", timezone: "America/New_York", bookingWindowDays: 20 });
    expect(res.restaurant.verifiedOn).toBe("2026-07-06");
  });

  it("rejects a bad release time", () => {
    expect(applyVerification(fc, { releaseTime: "noon", furthestIso: "2026-07-26" }, now).ok).toBe(false);
  });

  it("rejects a furthest date that is not in the future", () => {
    expect(applyVerification(fc, { releaseTime: "09:00", furthestIso: "2026-07-05" }, now).ok).toBe(false);
  });
});
