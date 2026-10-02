import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  wakeMomentFor, taskNameFor, buildRegisterScript, buildUnregisterScript, buildStatusScript, buildListScript,
} from "../src/server/wakeSchedule.js";
import type { Restaurant } from "../src/core/types.js";

const ren: Restaurant = {
  id: "la-renommee", name: "La Renommée", city: "Paris", platform: "SevenRooms",
  platformUrl: "https://www.sevenrooms.com/explore/larenommee/reservations/create/search/?party_size=2",
  dropRule: { kind: "rolling", releaseTime: "09:00", timezone: "Europe/Paris", bookingWindowDays: 30 },
  tier: "alert", targetDate: "2026-08-07",
};

describe("wakeMomentFor", () => {
  it("is 3 minutes before the target date's unlock moment", () => {
    const now = DateTime.fromISO("2026-06-28T00:00:00Z");
    const wake = wakeMomentFor(ren, 3, now)!;
    // unlock = 2026-07-08 09:00 Europe/Paris; minus 3 minutes = 08:57 Paris
    expect(wake.setZone("Europe/Paris").toFormat("yyyy-LL-dd HH:mm")).toBe("2026-07-08 08:57");
  });

  it("returns null when there is no target date", () => {
    expect(wakeMomentFor({ ...ren, targetDate: undefined }, 3, DateTime.now())).toBeNull();
  });

  it("returns null when the wake moment is already in the past", () => {
    const now = DateTime.fromISO("2026-09-01T00:00:00Z");
    expect(wakeMomentFor(ren, 3, now)).toBeNull();
  });
});

describe("taskNameFor", () => {
  it("builds a safe deterministic task name", () => {
    expect(taskNameFor("la-renommee")).toBe("TableDrop_la-renommee");
    expect(taskNameFor("weird id!@#")).toBe("TableDrop_weird_id___");
  });
});

describe("script builders", () => {
  it("register script wakes the computer and targets the bat", () => {
    const s = buildRegisterScript("TableDrop_x", "2026-07-08T08:57:00", "C:\\app\\Start.bat", "C:\\app");
    expect(s).toContain("-WakeToRun");
    expect(s).toContain("New-ScheduledTaskTrigger -Once -At '2026-07-08T08:57:00'");
    expect(s).toContain("Register-ScheduledTask -TaskName 'TableDrop_x'");
    expect(s).toContain("Start.bat");
  });
  it("register script makes fired one-shot tasks clean themselves up", () => {
    const s = buildRegisterScript("TableDrop_x", "2026-07-08T08:57:00", "C:\\app\\Start.bat", "C:\\app");
    expect(s).toContain("$t.EndBoundary = '2026-07-08T09:57:00'");
    expect(s).toContain("-DeleteExpiredTaskAfter");
  });
  it("unregister and status scripts reference the task name", () => {
    expect(buildUnregisterScript("TableDrop_x")).toContain("Unregister-ScheduledTask -TaskName 'TableDrop_x'");
    expect(buildStatusScript("TableDrop_x")).toContain("Get-ScheduledTask -TaskName 'TableDrop_x'");
  });
  it("list script covers all TableDrop tasks in one query", () => {
    expect(buildListScript()).toContain("Get-ScheduledTask -TaskName 'TableDrop_*'");
  });
});
