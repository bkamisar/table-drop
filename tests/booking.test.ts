import { describe, it, expect } from "vitest";
import { isAllowedBookingUrl } from "../src/renderer/lib/booking.js";

describe("isAllowedBookingUrl", () => {
  it("allows https booking-platform domains", () => {
    expect(isAllowedBookingUrl("https://resy.com/x")).toBe(true);
    expect(isAllowedBookingUrl("https://www.exploretock.com/y")).toBe(true);
  });
  it("rejects other domains and non-https", () => {
    expect(isAllowedBookingUrl("https://evil.example.com")).toBe(false);
    expect(isAllowedBookingUrl("http://resy.com")).toBe(false);
    expect(isAllowedBookingUrl("not a url")).toBe(false);
  });
});
