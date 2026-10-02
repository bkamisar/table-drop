import { describe, it, expect } from "vitest";
import { buildIcs } from "../src/renderer/lib/calendar.js";

const now = new Date("2026-10-01T12:00:00Z");
const ics = buildIcs(
  {
    uid: "la-renommee-1@table-drop",
    title: "Reservations open: La Renommée (for Fri, Aug 7)",
    startIso: "2026-07-09T07:00:00.000Z",
    durationMinutes: 15,
    alarmMinutesBefore: 5,
    url: "https://www.sevenrooms.com/explore/larenommee/reservations/create/search/?date=2026-08-07&lang=en&party_size=2",
    description: "Book; then celebrate",
  },
  now
);

describe("buildIcs", () => {
  it("uses CRLF line endings and UTC timestamps", () => {
    expect(ics).toContain("\r\nDTSTART:20260709T070000Z\r\n");
    expect(ics).toContain("\r\nDTEND:20260709T071500Z\r\n");
    expect(ics).toContain("\r\nDTSTAMP:20261001T120000Z\r\n");
  });

  it("includes a display alarm before the drop", () => {
    expect(ics).toContain("BEGIN:VALARM\r\nACTION:DISPLAY");
    expect(ics).toContain("TRIGGER:-PT5M");
  });

  it("escapes commas and semicolons in text", () => {
    expect(ics).toContain("(for Fri\\, Aug 7)");
    expect(ics).toContain("DESCRIPTION:Book\\; then celebrate");
  });

  it("folds every line to at most 75 octets", () => {
    const enc = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
  });
});
