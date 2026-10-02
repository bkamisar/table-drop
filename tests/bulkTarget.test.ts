import { describe, it, expect } from "vitest";
import { applyTargetDate } from "../src/core/bulkTarget.js";
import type { Restaurant } from "../src/core/types.js";

const rolling = (id: string): Restaurant => ({
  id, name: id, city: "Paris", platform: "Resy", platformUrl: "https://resy.com/x",
  dropRule: { kind: "rolling", releaseTime: "09:00", timezone: "Europe/Paris", bookingWindowDays: 21 },
  tier: "alert",
});
const manual = (id: string): Restaurant => ({ ...rolling(id), dropRule: { kind: "manual" } });

describe("applyTargetDate", () => {
  it("sets the date only on matching rolling restaurants", () => {
    const { list, updated } = applyTargetDate([rolling("a"), rolling("b"), manual("c")], ["a", "c"], "2026-08-07");
    expect(updated).toBe(1);
    expect(list.find((r) => r.id === "a")!.targetDate).toBe("2026-08-07");
    expect(list.find((r) => r.id === "b")!.targetDate).toBeUndefined();
    expect(list.find((r) => r.id === "c")!.targetDate).toBeUndefined();
  });

  it("clears the date when targetDate is undefined", () => {
    const { list, updated } = applyTargetDate([{ ...rolling("a"), targetDate: "2026-08-07" }], ["a"], undefined);
    expect(updated).toBe(1);
    expect("targetDate" in list[0]).toBe(false);
  });
});
