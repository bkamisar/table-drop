import { describe, it, expect } from "vitest";
import { exportList, parseImport } from "../src/renderer/lib/listTransfer.js";
import type { Restaurant } from "../src/core/types.js";

const good: Restaurant = {
  id: "septime", name: "Septime", city: "Paris", platform: "Zenchef",
  platformUrl: "https://bookings.zenchef.com/results?rid=356354&pid=1001&lang=en",
  dropRule: { kind: "rolling", releaseTime: "10:00", timezone: "Europe/Paris", bookingWindowDays: 21 },
  tier: "alert",
};

describe("list transfer", () => {
  it("round-trips an export", () => {
    const res = parseImport(exportList([good]));
    expect(res.ok && res.restaurants.map((r) => r.id)).toEqual(["septime"]);
  });

  it("accepts the desktop store format and a bare array", () => {
    expect(parseImport(JSON.stringify({ restaurants: [good] })).ok).toBe(true);
    expect(parseImport(JSON.stringify([good])).ok).toBe(true);
  });

  it("skips invalid entries with reasons", () => {
    const res = parseImport(JSON.stringify([good, { ...good, id: "x", platformUrl: "javascript:alert(1)" }]));
    expect(res.ok && res.restaurants.length).toBe(1);
    expect(res.ok && res.skipped.length).toBe(1);
  });

  it("explains unreadable files", () => {
    expect(parseImport("not json").ok).toBe(false);
    expect(parseImport(JSON.stringify({ hello: 1 })).ok).toBe(false);
  });
});
