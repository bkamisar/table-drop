import type { Restaurant, UpcomingDrop } from "../../../core/types.js";
import type { DataSource, SaveResult, WakeResult } from "./types.js";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok && res.status !== 400) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// The desktop app: talks to the local Express server over HTTP.
export const serverSource: DataSource = {
  kind: "server",
  persistent: true,
  capabilities: { wake: true },

  listRestaurants: (): Promise<Restaurant[]> =>
    fetch("/api/restaurants").then((r) => json<Restaurant[]>(r)),

  getDrops: (): Promise<UpcomingDrop[]> =>
    fetch("/api/drops").then((r) => json<UpcomingDrop[]>(r)),

  saveRestaurant: (raw: unknown): Promise<SaveResult> =>
    fetch("/api/restaurants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(raw),
    }).then((r) => json<SaveResult>(r)),

  deleteRestaurant: (id: string): Promise<void> =>
    fetch(`/api/restaurants/${encodeURIComponent(id)}`, { method: "DELETE" }).then(() => undefined),

  // Set/clear one target date across many restaurants in a single request.
  setTargetForAll: (ids: string[], targetDate: string | null): Promise<{ ok: boolean; updated: number }> =>
    fetch("/api/target", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, targetDate }),
    }).then((r) => r.json()),

  // One request (and one PowerShell spawn server-side) for the whole list.
  wakeAll: (): Promise<Record<string, string>> =>
    fetch("/api/wake").then((r) => r.json()),

  scheduleWake: (id: string): Promise<WakeResult> =>
    fetch(`/api/wake/${encodeURIComponent(id)}`, { method: "POST" }).then((r) => r.json()),

  cancelWake: (id: string): Promise<{ ok: boolean }> =>
    fetch(`/api/wake/${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => r.json()),
};
