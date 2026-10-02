import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeNextFire } from "../src/core/dropRule.js";
import type { DropRule } from "../src/core/types.js";

const monthly: DropRule = {
  kind: "monthly",
  releaseTime: "15:00",
  timezone: "America/New_York",
  dayOfMonth: 1,
};

describe("computeNextFire — monthly", () => {
  it("returns this month's release when it is still ahead", () => {
    const now = DateTime.fromISO("2026-06-01T14:00:00", {
      zone: "America/New_York",
    });
    const fire = computeNextFire(monthly, now);
    expect(fire?.toISODate()).toBe("2026-06-01");
    expect(fire?.hour).toBe(15);
  });

  it("advances to next month after this month's release passes", () => {
    const now = DateTime.fromISO("2026-06-01T15:00:01", {
      zone: "America/New_York",
    });
    const fire = computeNextFire(monthly, now);
    expect(fire?.toISODate()).toBe("2026-07-01");
  });

  it("clamps an out-of-range day to the last day of the month", () => {
    const now = DateTime.fromISO("2026-02-15T09:00:00", {
      zone: "America/New_York",
    });
    const fire = computeNextFire(
      { kind: "monthly", releaseTime: "12:00", timezone: "America/New_York", dayOfMonth: 31 },
      now
    );
    // February 2026 has 28 days.
    expect(fire?.toISODate()).toBe("2026-02-28");
  });
});
