import type { Restaurant } from "./types.js";

// Sets (or, with undefined, clears) one target dining date across the given
// restaurant ids. Only rolling restaurants take a target date.
export function applyTargetDate(
  list: Restaurant[],
  ids: string[],
  targetDate: string | undefined
): { list: Restaurant[]; updated: number } {
  const idSet = new Set(ids);
  let updated = 0;
  const next = list.map((r) => {
    if (!idSet.has(r.id)) return r;
    if (targetDate === undefined) {
      if (r.targetDate === undefined) return r;
      updated++;
      const { targetDate: _removed, ...rest } = r;
      void _removed;
      return rest;
    }
    if (r.dropRule.kind !== "rolling") return r;
    updated++;
    return { ...r, targetDate };
  });
  return { list: next, updated };
}
