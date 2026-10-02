import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { upcomingDrops } from "../src/core/upcoming.js";
import type { Restaurant } from "../src/core/types.js";
import { dropMomentForDiningDate } from "../src/core/dropRule.js";

const base = {
  city: "New York",
  platform: "Resy" as const,
  platformUrl: "https://resy.com/x",
  tier: "alert" as const,
};

const restaurants: Restaurant[] = [
  {
    ...base,
    id: "late",
    name: "Late",
    dropRule: { kind: "rolling", releaseTime: "15:00", timezone: "America/New_York", bookingWindowDays: 30 },
  },
  {
    ...base,
    id: "early",
    name: "Early",
    dropRule: { kind: "rolling", releaseTime: "10:00", timezone: "America/New_York", bookingWindowDays: 30 },
  },
  {
    ...base,
    id: "unknown",
    name: "Unknown",
    dropRule: { kind: "manual" },
  },
];

describe("upcomingDrops", () => {
  it("sorts by soonest fire time and excludes manual rules", () => {
    const now = DateTime.fromISO("2026-06-27T09:00:00", { zone: "America/New_York" });
    const drops = upcomingDrops(restaurants, now);
    expect(drops.map((d) => d.restaurant.id)).toEqual(["early", "late"]);
    expect(drops[0].secondsUntil).toBe(3600);
  });
});

describe("targeting", () => {
  const rolling = {
    ...base, id: "ren", name: "Renommee", city: "Paris",
    platform: "SevenRooms" as const, platformUrl: "https://sevenrooms.com/x",
    dropRule: { kind: "rolling" as const, releaseTime: "09:00", timezone: "Europe/Paris", bookingWindowDays: 30 },
  };

  it("computes the unlock moment for a target dining date", () => {
    const m = dropMomentForDiningDate(rolling.dropRule, "2026-08-07")!;
    expect(m.toISODate()).toBe("2026-07-08");
    expect(m.hour).toBe(9);
  });

  it("includes unlocksDate for a normal next-daily drop", () => {
    const now = DateTime.fromISO("2026-06-28T06:00:00", { zone: "Europe/Paris" });
    const drops = upcomingDrops([rolling], now);
    // next 09:00 Paris is today; unlocks 30 days later
    expect(drops[0].unlocksDate).toBe("2026-07-28");
    expect(drops[0].forTarget).toBe(false);
  });

  it("retargets the countdown when targetDate is set", () => {
    const now = DateTime.fromISO("2026-06-28T06:00:00", { zone: "Europe/Paris" });
    const withTarget = { ...rolling, targetDate: "2026-08-07" };
    const drops = upcomingDrops([withTarget], now);
    expect(drops[0].forTarget).toBe(true);
    expect(drops[0].unlocksDate).toBe("2026-08-07");
    expect(new Date(drops[0].fireAtIso).getTime()).toBe(
      dropMomentForDiningDate(rolling.dropRule, "2026-08-07")!.toMillis()
    );
  });
});
