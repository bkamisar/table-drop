import { describe, it, expect } from "vitest";
import { validateRestaurant } from "../src/core/validate.js";

const valid = {
  id: "carbone",
  name: "Carbone",
  city: "New York",
  platform: "Resy",
  platformUrl: "https://resy.com/cities/ny/carbone",
  dropRule: {
    kind: "rolling",
    releaseTime: "10:00",
    timezone: "America/New_York",
    bookingWindowDays: 30,
  },
  tier: "alert",
};

describe("validateRestaurant", () => {
  it("accepts a well-formed record", () => {
    const result = validateRestaurant(valid);
    expect(result.ok).toBe(true);
  });

  it("rejects a platformUrl whose host is not the platform's domain", () => {
    const bad = { ...valid, platformUrl: "https://evil.example.com/carbone" };
    const result = validateRestaurant(bad);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error).toMatch(/domain/i);
  });

  it("rejects an unknown platform", () => {
    const bad = { ...valid, platform: "MysteryApp" };
    const result = validateRestaurant(bad);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-https platformUrl", () => {
    const bad = { ...valid, platformUrl: "http://resy.com/carbone" };
    const result = validateRestaurant(bad);
    expect(result.ok).toBe(false);
  });

  it("accepts a Zenchef booking URL", () => {
    const r = validateRestaurant({
      ...valid, platform: "Zenchef",
      platformUrl: "https://bookings.zenchef.com/results?rid=356354",
    });
    expect(r.ok).toBe(true);
  });

  it("preserves pinned and a valid targetDate", () => {
    const r = validateRestaurant({ ...valid, pinned: true, targetDate: "2026-08-07" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.pinned).toBe(true);
      expect(r.value.targetDate).toBe("2026-08-07");
    }
  });

  it("rejects a malformed targetDate", () => {
    const r = validateRestaurant({ ...valid, targetDate: "Aug 7" });
    expect(r.ok).toBe(false);
  });

  it("rejects an impossible calendar targetDate", () => {
    // Matches the regex but isn't a real date — must not slip through and
    // silently hide the restaurant from the Drops list.
    const r = validateRestaurant({ ...valid, targetDate: "2026-02-30" });
    expect(r.ok).toBe(false);
  });

  it("preserves a valid verifiedOn and rejects an impossible one", () => {
    const ok = validateRestaurant({ ...valid, verifiedOn: "2026-10-01" });
    expect(ok.ok && ok.value.verifiedOn).toBe("2026-10-01");
    expect(validateRestaurant({ ...valid, verifiedOn: "2026-13-01" }).ok).toBe(false);
  });

  it("leaves verifiedOn undefined when absent", () => {
    const r = validateRestaurant(valid);
    expect(r.ok && r.value.verifiedOn).toBeUndefined();
  });

  it("defaults pinned to false and targetDate to undefined", () => {
    const r = validateRestaurant(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.pinned).toBe(false);
      expect(r.value.targetDate).toBeUndefined();
    }
  });
});
