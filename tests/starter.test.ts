import { describe, it, expect } from "vitest";
import { buildStarterList, diffStarter } from "../src/core/starter.js";
import type { Restaurant } from "../src/core/types.js";

const r = (id: string, city: string, extra: Partial<Restaurant> = {}): Restaurant => ({
  id, name: id, city, platform: "Resy", platformUrl: "https://resy.com/x",
  dropRule: { kind: "rolling", releaseTime: "09:00", timezone: "America/New_York", bookingWindowDays: 20 },
  tier: "alert", verifiedOn: "2026-10-01", ...extra,
});

describe("buildStarterList", () => {
  it("keeps only verified restaurants, strips personal fields, sorts by city then name", () => {
    const list = buildStarterList([
      r("zeta", "Paris", { pinned: true, targetDate: "2026-11-01" }),
      r("alpha", "Paris"),
      r("mid", "New York"),
      r("unverified", "Paris", { verifiedOn: undefined }),
    ]);
    expect(list.map((x) => x.id)).toEqual(["mid", "alpha", "zeta"]);
    expect(list.every((x) => !("pinned" in x) && !("targetDate" in x))).toBe(true);
  });
});

describe("diffStarter", () => {
  it("reports added, updated, and removed restaurants", () => {
    const before = [r("same", "Paris"), r("changed", "Paris"), r("gone", "Paris")];
    const after = [r("same", "Paris"), r("changed", "Paris", { verifiedOn: "2026-11-01" }), r("new", "Paris")];
    const d = diffStarter(before, after);
    expect(d.added.map((x) => x.id)).toEqual(["new"]);
    expect(d.updated.map((x) => x.id)).toEqual(["changed"]);
    expect(d.removed.map((x) => x.id)).toEqual(["gone"]);
  });

  it("ignores key order", () => {
    const a = r("x", "Paris");
    const reordered = JSON.parse(JSON.stringify({ verifiedOn: a.verifiedOn, tier: a.tier, dropRule: a.dropRule,
      platformUrl: a.platformUrl, platform: a.platform, city: a.city, name: a.name, id: a.id }));
    expect(diffStarter([reordered], [a]).updated).toEqual([]);
  });
});
