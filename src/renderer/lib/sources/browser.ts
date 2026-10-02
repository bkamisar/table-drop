import { DateTime } from "luxon";
import type { Restaurant } from "../../../core/types.js";
import { validateRestaurant } from "../../../core/validate.js";
import { upcomingDrops } from "../../../core/upcoming.js";
import { applyTargetDate } from "../../../core/bulkTarget.js";
import { isRealIsoDate } from "../../../core/dates.js";
import type { DataSource } from "./types.js";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = "tabledrop.v1";

interface Saved {
  restaurants: Restaurant[];
  dismissedStarterIds: string[]; // starters the user deleted — never re-added
}

// Re-validates everything read back from storage, so a tampered or corrupted
// entry (e.g. an off-domain booking link) is dropped instead of rendered.
function cleanList(raw: unknown): Restaurant[] {
  if (!Array.isArray(raw)) return [];
  const out: Restaurant[] = [];
  for (const item of raw) {
    const v = validateRestaurant(item);
    if (v.ok) out.push(v.value);
  }
  return out;
}

// The web version: the whole app runs in the browser and each person's list is
// kept in their own storage. Never talks to any server.
export function createBrowserSource(
  storage: KeyValueStorage,
  starter: Restaurant[],
  persistent = true
): DataSource {
  const starters = cleanList(starter);
  const starterIds = new Set(starters.map((s) => s.id));

  function read(): Saved {
    let parsed: { restaurants?: unknown; dismissedStarterIds?: unknown } | null = null;
    try {
      const text = storage.getItem(STORAGE_KEY);
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    const restaurants = cleanList(parsed?.restaurants);
    const dismissed = Array.isArray(parsed?.dismissedStarterIds)
      ? (parsed!.dismissedStarterIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    // Merge in starters the user doesn't have yet and hasn't deleted — this is
    // both the first-visit seed and how later-published starters arrive.
    const have = new Set(restaurants.map((r) => r.id));
    const gone = new Set(dismissed);
    for (const s of starters) if (!have.has(s.id) && !gone.has(s.id)) restaurants.push(s);
    return { restaurants, dismissedStarterIds: dismissed };
  }

  function write(s: Saved): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  return {
    kind: "browser",
    persistent,
    capabilities: { wake: false },
    async listRestaurants() {
      return read().restaurants;
    },
    async getDrops() {
      return upcomingDrops(read().restaurants, DateTime.now());
    },
    async saveRestaurant(raw) {
      const v = validateRestaurant(raw);
      if (!v.ok) return { ok: false, error: v.error };
      const s = read();
      s.restaurants = s.restaurants.filter((r) => r.id !== v.value.id);
      s.restaurants.push(v.value);
      write(s);
      return { ok: true };
    },
    async deleteRestaurant(id) {
      const s = read();
      s.restaurants = s.restaurants.filter((r) => r.id !== id);
      if (starterIds.has(id) && !s.dismissedStarterIds.includes(id)) s.dismissedStarterIds.push(id);
      write(s);
    },
    async setTargetForAll(ids, targetDate) {
      if (targetDate !== null && !isRealIsoDate(targetDate)) return { ok: false, updated: 0 };
      const s = read();
      const { list, updated } = applyTargetDate(s.restaurants, ids, targetDate ?? undefined);
      s.restaurants = list;
      write(s);
      return { ok: true, updated };
    },
    async wakeAll() {
      return {};
    },
    async scheduleWake() {
      return { ok: false, error: "Wake-up is only available in the desktop version." };
    },
    async cancelWake() {
      return { ok: true };
    },
  };
}
