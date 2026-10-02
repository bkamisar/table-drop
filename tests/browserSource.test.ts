import { describe, it, expect } from "vitest";
import { createBrowserSource, STORAGE_KEY, type KeyValueStorage } from "../src/renderer/lib/sources/browser.js";
import type { Restaurant } from "../src/core/types.js";

function memory(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const r = (id: string, extra: Partial<Restaurant> = {}): Restaurant => ({
  id, name: id, city: "Paris", platform: "SevenRooms",
  platformUrl: "https://www.sevenrooms.com/explore/x/reservations/create/search/",
  dropRule: { kind: "rolling", releaseTime: "09:00", timezone: "Europe/Paris", bookingWindowDays: 29 },
  tier: "alert", verifiedOn: "2026-10-01", ...extra,
});

describe("browser data source", () => {
  it("starts with the starter list", async () => {
    const src = createBrowserSource(memory(), [r("a"), r("b")]);
    expect((await src.listRestaurants()).map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("saves, deletes, and remembers a deleted starter (it doesn't come back)", async () => {
    const store = memory();
    const src = createBrowserSource(store, [r("a")]);
    await src.saveRestaurant(r("mine"));
    await src.deleteRestaurant("a");
    expect((await src.listRestaurants()).map((x) => x.id)).toEqual(["mine"]);
    const reopened = createBrowserSource(store, [r("a")]);
    expect((await reopened.listRestaurants()).map((x) => x.id)).toEqual(["mine"]);
  });

  it("adds starters published later, without touching the user's edits", async () => {
    const store = memory();
    const v1 = createBrowserSource(store, [r("a")]);
    await v1.saveRestaurant(r("a", { pinned: true }));
    const v2 = createBrowserSource(store, [r("a"), r("new")]);
    const list = await v2.listRestaurants();
    expect(list.map((x) => x.id).sort()).toEqual(["a", "new"]);
    expect(list.find((x) => x.id === "a")!.pinned).toBe(true);
  });

  it("rejects invalid saves and drops tampered stored entries", async () => {
    const store = memory();
    const src = createBrowserSource(store, []);
    expect((await src.saveRestaurant({ ...r("bad"), platformUrl: "https://evil.example.com" })).ok).toBe(false);
    store.setItem(STORAGE_KEY, JSON.stringify({ restaurants: [r("ok"), { id: "junk" }], dismissedStarterIds: [] }));
    expect((await src.listRestaurants()).map((x) => x.id)).toEqual(["ok"]);
  });

  it("sets and clears one target date for many", async () => {
    const src = createBrowserSource(memory(), [r("a"), r("b")]);
    expect(await src.setTargetForAll(["a", "b"], "2026-08-07")).toEqual({ ok: true, updated: 2 });
    expect((await src.listRestaurants()).every((x) => x.targetDate === "2026-08-07")).toBe(true);
    await src.setTargetForAll(["a", "b"], null);
    expect((await src.listRestaurants()).every((x) => x.targetDate === undefined)).toBe(true);
  });

  it("reports wake-up as unavailable", async () => {
    const src = createBrowserSource(memory(), []);
    expect(src.capabilities.wake).toBe(false);
    expect((await src.scheduleWake("a")).ok).toBe(false);
  });
});
