import { describe, it, expect } from "vitest";
import { bookingUrlForDate } from "../src/renderer/lib/bookingLink.js";

describe("bookingUrlForDate", () => {
  it("sets date and party_size for SevenRooms", () => {
    const u = new URL(bookingUrlForDate("SevenRooms", "https://www.sevenrooms.com/explore/x/reservations/create/search/?party_size=2&date=2026-01-01", "2026-08-07"));
    expect(u.searchParams.get("date")).toBe("2026-08-07");
    expect(u.searchParams.get("party_size")).toBe("2");
  });

  it("sets date for Zenchef while keeping existing params", () => {
    const u = new URL(bookingUrlForDate("Zenchef", "https://bookings.zenchef.com/results?rid=356354&pid=1001", "2026-08-07"));
    expect(u.searchParams.get("date")).toBe("2026-08-07");
    expect(u.searchParams.get("rid")).toBe("356354");
  });

  it("forces English on SevenRooms and Zenchef (French-defaulting) links", () => {
    const sr = new URL(bookingUrlForDate("SevenRooms", "https://www.sevenrooms.com/explore/larenommee/reservations/create/search/?party_size=2", "2026-08-07"));
    expect(sr.searchParams.get("lang")).toBe("en");
    const zc = new URL(bookingUrlForDate("Zenchef", "https://bookings.zenchef.com/results?rid=356354&lang=fr", "2026-08-07"));
    expect(zc.searchParams.get("lang")).toBe("en"); // overrides an existing lang=fr
  });

  it("returns the base url unchanged when the date is empty", () => {
    expect(bookingUrlForDate("Resy", "https://resy.com/x", "")).toBe("https://resy.com/x");
  });

  it("returns the base url when it cannot be parsed", () => {
    expect(bookingUrlForDate("Resy", "not a url", "2026-08-07")).toBe("not a url");
  });
});
