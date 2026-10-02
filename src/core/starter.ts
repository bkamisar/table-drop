import type { Restaurant } from "./types.js";
import { validateRestaurant } from "./validate.js";

// The public starter list: only first-hand-verified restaurants, without
// anyone's personal fields (pins, target dates), in a stable order.
export function buildStarterList(items: unknown[]): Restaurant[] {
  const out: Restaurant[] = [];
  for (const item of items) {
    const v = validateRestaurant(item);
    if (!v.ok || !v.value.verifiedOn) continue;
    const { pinned: _pinned, targetDate: _target, ...publicFields } = v.value;
    void _pinned;
    void _target;
    out.push(publicFields);
  }
  return out.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
}

// Order-independent serialization so key order never registers as a change.
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export interface StarterDiff {
  added: Restaurant[];
  updated: Restaurant[];
  removed: Restaurant[];
}

// What publishing `after` would change compared with the live list `before`.
export function diffStarter(before: Restaurant[], after: Restaurant[]): StarterDiff {
  const old = new Map(before.map((r) => [r.id, r]));
  const next = new Set(after.map((r) => r.id));
  return {
    added: after.filter((r) => !old.has(r.id)),
    updated: after.filter((r) => old.has(r.id) && canonical(old.get(r.id)) !== canonical(r)),
    removed: before.filter((r) => !next.has(r.id)),
  };
}
