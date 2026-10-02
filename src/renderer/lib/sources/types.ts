import type { Restaurant, UpcomingDrop } from "../../../core/types.js";

export type SaveResult = { ok: true } | { ok: false; error: string };
export type WakeResult = { ok: true; wakeAt?: string } | { ok: false; error: string };

// Everything the UI needs, implemented by the desktop server (HTTP) or by the
// browser itself (localStorage) for the web version.
export interface DataSource {
  kind: "server" | "browser";
  persistent: boolean; // false if the browser refuses storage (private mode)
  capabilities: { wake: boolean };
  listRestaurants(): Promise<Restaurant[]>;
  getDrops(): Promise<UpcomingDrop[]>;
  saveRestaurant(raw: unknown): Promise<SaveResult>;
  deleteRestaurant(id: string): Promise<void>;
  setTargetForAll(ids: string[], targetDate: string | null): Promise<{ ok: boolean; updated: number }>;
  wakeAll(): Promise<Record<string, string>>;
  scheduleWake(id: string): Promise<WakeResult>;
  cancelWake(id: string): Promise<{ ok: boolean }>;
}
