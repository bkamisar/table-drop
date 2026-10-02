import type { Restaurant } from "../../core/types.js";
import { validateRestaurant } from "../../core/validate.js";

export function exportList(restaurants: Restaurant[], now: Date = new Date()): string {
  return JSON.stringify({ app: "table-drop", version: 1, exportedAt: now.toISOString(), restaurants }, null, 2);
}

export type ImportResult =
  | { ok: true; restaurants: Restaurant[]; skipped: { index: number; reason: string }[] }
  | { ok: false; error: string };

// Accepts a Table Drop export, the desktop app's store.json, or a bare array.
// Every entry goes through the same validation as typed entries, so a shared
// file can't sneak in an off-domain or non-https booking link.
export function parseImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a valid list (not JSON)." };
  }
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { restaurants?: unknown }).restaurants)
      ? ((data as { restaurants: unknown[] }).restaurants)
      : null;
  if (!items) return { ok: false, error: "No restaurant list found in that file." };
  const restaurants: Restaurant[] = [];
  const skipped: { index: number; reason: string }[] = [];
  items.forEach((item, index) => {
    const v = validateRestaurant(item);
    if (v.ok) restaurants.push(v.value);
    else skipped.push({ index, reason: v.error });
  });
  return { ok: true, restaurants, skipped };
}
