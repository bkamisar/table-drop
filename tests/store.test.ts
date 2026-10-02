import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadStore, saveStore } from "../src/core/store.js";
import type { Restaurant } from "../src/core/types.js";

const sample: Restaurant = {
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

let dir: string;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("store", () => {
  it("returns an empty list when the file does not exist", () => {
    dir = mkdtempSync(join(tmpdir(), "store-"));
    const list = loadStore(join(dir, "missing.json"));
    expect(list).toEqual([]);
  });

  it("round-trips restaurants through save and load", () => {
    dir = mkdtempSync(join(tmpdir(), "store-"));
    const path = join(dir, "store.json");
    saveStore(path, [sample]);
    const list = loadStore(path);
    expect(list).toEqual([sample]);
  });
});
