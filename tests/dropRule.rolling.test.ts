import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeNextFire } from "../src/core/dropRule.js";
import type { DropRule } from "../src/core/types.js";

const rolling: DropRule = {
  kind: "rolling",
  releaseTime: "10:00",
  timezone: "America/New_York",
  bookingWindowDays: 30,
};

describe("computeNextFire — rolling", () => {
  it("returns today's release time when it has not passed yet", () => {
    const now = DateTime.fromISO("2026-06-27T09:00:00", {
      zone: "America/New_York",
    });
    const fire = computeNextFire(rolling, now);
    expect(fire?.toISO()).toBe(
      DateTime.fromISO("2026-06-27T10:00:00", {
        zone: "America/New_York",
      }).toISO()
    );
  });

  it("rolls to tomorrow when today's release has passed", () => {
    const now = DateTime.fromISO("2026-06-27T10:00:01", {
      zone: "America/New_York",
    });
    const fire = computeNextFire(rolling, now);
    expect(fire?.toISODate()).toBe("2026-06-28");
    expect(fire?.hour).toBe(10);
  });

  it("returns null for a manual rule", () => {
    const fire = computeNextFire({ kind: "manual" }, DateTime.now());
    expect(fire).toBeNull();
  });
});
