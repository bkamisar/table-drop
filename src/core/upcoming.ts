import { DateTime } from "luxon";
import { computeNextFire, dropMomentForDiningDate, unlocksDateFor } from "./dropRule.js";
import type { Restaurant, UpcomingDrop } from "./types.js";

export function upcomingDrops(
  restaurants: Restaurant[],
  now: DateTime
): UpcomingDrop[] {
  const drops: UpcomingDrop[] = [];
  for (const restaurant of restaurants) {
    const rule = restaurant.dropRule;

    let fire: DateTime | null;
    let unlocksDate: string | null;
    let forTarget = false;

    if (rule.kind === "rolling" && restaurant.targetDate) {
      fire = dropMomentForDiningDate(rule, restaurant.targetDate);
      unlocksDate = restaurant.targetDate;
      forTarget = true;
    } else {
      fire = computeNextFire(rule, now);
      unlocksDate = fire ? unlocksDateFor(rule, fire) : null;
    }

    if (!fire) continue;
    drops.push({
      restaurant,
      fireAtIso: fire.toUTC().toISO()!,
      secondsUntil: Math.round(fire.diff(now, "seconds").seconds),
      unlocksDate,
      forTarget,
    });
  }

  // Pinned first, then soonest fire.
  drops.sort((a, b) => {
    const pa = a.restaurant.pinned ? 0 : 1;
    const pb = b.restaurant.pinned ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.secondsUntil - b.secondsUntil;
  });
  return drops;
}
