import { describe, it, expect } from "vitest";
import { formatCountdown } from "../src/renderer/lib/countdown.js";

describe("formatCountdown", () => {
  it("formats days, hours, minutes, seconds", () => {
    expect(formatCountdown(2 * 86400 + 3 * 3600 + 4 * 60 + 5)).toBe("2d 03h 04m 05s");
  });
  it("omits days when under 24h", () => {
    expect(formatCountdown(3 * 3600 + 4 * 60 + 5)).toBe("03h 04m 05s");
  });
  it("clamps negatives to zero", () => {
    expect(formatCountdown(-10)).toBe("00h 00m 00s");
  });
});
