import { describe, it, expect } from "vitest";
import { citiesOf, defaultTimezoneForCity } from "../src/renderer/lib/cities.js";
import type { Restaurant } from "../src/core/types.js";

const mk = (id: string, city: string): Restaurant => ({
  id, name: id, city, platform: "Resy",
  platformUrl: "https://resy.com/x",
  dropRule: { kind: "manual" }, tier: "alert",
});

describe("citiesOf", () => {
  it("returns sorted unique cities", () => {
    const list = [mk("a", "Paris"), mk("b", "New York"), mk("c", "Paris")];
    expect(citiesOf(list)).toEqual(["New York", "Paris"]);
  });
  it("returns empty array for no restaurants", () => {
    expect(citiesOf([])).toEqual([]);
  });
});

describe("defaultTimezoneForCity", () => {
  it("maps known cities case-insensitively", () => {
    expect(defaultTimezoneForCity("Paris")).toBe("Europe/Paris");
    expect(defaultTimezoneForCity("new york")).toBe("America/New_York");
  });
  it("falls back to America/New_York for unknown cities", () => {
    expect(defaultTimezoneForCity("Atlantis")).toBe("America/New_York");
  });
});
