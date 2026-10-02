import express, { type Express } from "express";
import { DateTime } from "luxon";
import { loadStore, saveStore } from "../core/store.js";
import { upcomingDrops } from "../core/upcoming.js";
import { validateRestaurant } from "../core/validate.js";
import { isRealIsoDate } from "../core/dates.js";
import { applyTargetDate } from "../core/bulkTarget.js";
import { storePath } from "./store-path.js";
import { scheduleWake, cancelWake, wakeStatus, wakeStatusAll } from "./wake.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get("/api/restaurants", (_req, res) => {
    res.json(loadStore(storePath()));
  });

  app.get("/api/drops", (_req, res) => {
    res.json(upcomingDrops(loadStore(storePath()), DateTime.now()));
  });

  app.post("/api/restaurants", (req, res) => {
    const result = validateRestaurant(req.body);
    if (!result.ok) {
      res.status(400).json({ ok: false, error: result.error });
      return;
    }
    const path = storePath();
    const list = loadStore(path).filter((r) => r.id !== result.value.id);
    list.push(result.value);
    saveStore(path, list);
    res.json({ ok: true });
  });

  // Set (or clear) ONE target dining date across many restaurants at once.
  // Only rolling restaurants take a target date; the rest are left untouched.
  app.post("/api/target", (req, res) => {
    const body = req.body as { ids?: unknown; targetDate?: unknown };
    const ids = Array.isArray(body.ids)
      ? (body.ids.filter((x) => typeof x === "string") as string[])
      : null;
    if (!ids) { res.status(400).json({ ok: false, error: "ids array required" }); return; }

    const raw = body.targetDate;
    const clearing = raw === null || raw === undefined || raw === "";
    if (!clearing && !isRealIsoDate(raw)) {
      res.status(400).json({ ok: false, error: "targetDate must be a real YYYY-MM-DD date" });
      return;
    }
    const path = storePath();
    const { list, updated } = applyTargetDate(loadStore(path), ids, clearing ? undefined : (raw as string));
    saveStore(path, list);
    res.json({ ok: true, updated });
  });

  app.delete("/api/restaurants/:id", async (req, res) => {
    const path = storePath();
    const existed = loadStore(path).some((r) => r.id === req.params.id);
    const list = loadStore(path).filter((r) => r.id !== req.params.id);
    saveStore(path, list);
    // A deleted restaurant must not leave an orphaned wake task behind that
    // would still wake the machine at 3 AM.
    if (existed) await cancelWake(req.params.id);
    res.json({ ok: true });
  });

  // Batch wake status: one PowerShell spawn for the whole list.
  app.get("/api/wake", async (_req, res) => {
    const ids = loadStore(storePath()).map((r) => r.id);
    res.json(await wakeStatusAll(ids));
  });

  app.get("/api/wake/:id", async (req, res) => {
    res.json(await wakeStatus(req.params.id));
  });

  app.post("/api/wake/:id", async (req, res) => {
    const r = loadStore(storePath()).find((x) => x.id === req.params.id);
    if (!r) { res.status(404).json({ ok: false, error: "restaurant not found" }); return; }
    const result = await scheduleWake(r);
    res.status(result.ok ? 200 : 400).json(result);
  });

  app.delete("/api/wake/:id", async (req, res) => {
    res.json(await cancelWake(req.params.id));
  });

  return app;
}
