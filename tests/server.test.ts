import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../src/server/app.js";

let dir: string;
function appForTempStore() {
  dir = mkdtempSync(join(tmpdir(), "srv-"));
  process.env.RESERVATION_STORE = join(dir, "store.json");
  return createApp();
}
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  delete process.env.RESERVATION_STORE;
});

const valid = {
  id: "carbone", name: "Carbone", city: "New York", platform: "Resy",
  platformUrl: "https://resy.com/cities/ny/carbone",
  dropRule: { kind: "rolling", releaseTime: "10:00", timezone: "America/New_York", bookingWindowDays: 30 },
  tier: "alert",
};

describe("API server", () => {
  it("starts with an empty restaurant list", async () => {
    const res = await request(appForTempStore()).get("/api/restaurants");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("saves a valid restaurant and lists it", async () => {
    const app = appForTempStore();
    const save = await request(app).post("/api/restaurants").send(valid);
    expect(save.status).toBe(200);
    expect(save.body).toEqual({ ok: true });
    const list = await request(app).get("/api/restaurants");
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe("carbone");
  });

  it("rejects a restaurant with a non-platform URL", async () => {
    const app = appForTempStore();
    const res = await request(app)
      .post("/api/restaurants")
      .send({ ...valid, platformUrl: "https://evil.example.com/x" });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns drops sorted soonest-first", async () => {
    const app = appForTempStore();
    await request(app).post("/api/restaurants").send(valid);
    const res = await request(app).get("/api/drops");
    expect(res.status).toBe(200);
    expect(res.body[0].restaurant.id).toBe("carbone");
    expect(typeof res.body[0].secondsUntil).toBe("number");
  });

  // Deleting now also cancels any wake task, which shells out to PowerShell
  // on Windows — hence the generous timeout.
  it("deletes a restaurant", async () => {
    const app = appForTempStore();
    await request(app).post("/api/restaurants").send(valid);
    await request(app).delete("/api/restaurants/carbone").expect(200);
    const list = await request(app).get("/api/restaurants");
    expect(list.body).toEqual([]);
  }, 30000);

  it("sets one target date across restaurants and clears it", async () => {
    const app = appForTempStore();
    await request(app).post("/api/restaurants").send(valid); // carbone, rolling
    const set = await request(app).post("/api/target").send({ ids: ["carbone"], targetDate: "2026-08-07" });
    expect(set.body).toEqual({ ok: true, updated: 1 });
    let list = (await request(app).get("/api/restaurants")).body;
    expect(list[0].targetDate).toBe("2026-08-07");
    await request(app).post("/api/target").send({ ids: ["carbone"], targetDate: null });
    list = (await request(app).get("/api/restaurants")).body;
    expect(list[0].targetDate).toBeUndefined();
  });

  it("rejects an impossible bulk target date", async () => {
    const res = await request(appForTempStore()).post("/api/target").send({ ids: ["x"], targetDate: "2026-02-30" });
    expect(res.status).toBe(400);
  });

  it("batch wake status returns an empty map by default", async () => {
    const app = appForTempStore();
    await request(app).post("/api/restaurants").send(valid);
    const res = await request(app).get("/api/wake");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  }, 30000);

  // On Windows this actually shells out to PowerShell (slow cold start), so it
  // gets a generous timeout. Elsewhere wakeStatus short-circuits instantly.
  it("wake status reports not-scheduled by default", async () => {
    const res = await request(appForTempStore()).get("/api/wake/carbone");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ scheduled: false, nextRun: null });
  }, 30000);
});
