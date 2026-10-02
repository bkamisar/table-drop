import { isRealIsoDate } from "./dates.js";
import {
  PLATFORMS,
  PLATFORM_DOMAINS,
  type Platform,
  type Restaurant,
} from "./types.js";

export type ValidationResult =
  | { ok: true; value: Restaurant }
  | { ok: false; error: string };

export function validateRestaurant(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "record is not an object" };
  }
  const r = raw as Record<string, unknown>;

  for (const field of ["id", "name", "city", "platform", "platformUrl"]) {
    if (typeof r[field] !== "string" || (r[field] as string).length === 0) {
      return { ok: false, error: `missing or invalid field: ${field}` };
    }
  }

  if (!PLATFORMS.includes(r.platform as Platform)) {
    return { ok: false, error: `unknown platform: ${String(r.platform)}` };
  }
  const platform = r.platform as Platform;

  const urlCheck = checkPlatformUrl(r.platformUrl as string, platform);
  if (!urlCheck.ok) return urlCheck;

  const ruleCheck = checkDropRule(r.dropRule);
  if (!ruleCheck.ok) return ruleCheck;

  const tier = r.tier === "assist" ? "assist" : "alert";

  const pinned = r.pinned === true;

  // Reject impossible calendar dates (e.g. 2026-02-30): downstream drop math
  // would silently produce no fire moment and hide the restaurant.
  const optionalDate = (v: unknown) => v === undefined || v === null || v === "";

  if (!optionalDate(r.targetDate) && !isRealIsoDate(r.targetDate)) {
    return { ok: false, error: "targetDate must be a real YYYY-MM-DD date" };
  }
  const targetDate = optionalDate(r.targetDate) ? undefined : (r.targetDate as string);

  if (!optionalDate(r.verifiedOn) && !isRealIsoDate(r.verifiedOn)) {
    return { ok: false, error: "verifiedOn must be a real YYYY-MM-DD date" };
  }
  const verifiedOn = optionalDate(r.verifiedOn) ? undefined : (r.verifiedOn as string);

  return {
    ok: true,
    value: {
      id: r.id as string,
      name: r.name as string,
      city: r.city as string,
      platform,
      platformUrl: r.platformUrl as string,
      dropRule: ruleCheck.value,
      tier,
      pinned,
      targetDate,
      verifiedOn,
    },
  };
}

function checkPlatformUrl(
  url: string,
  platform: Platform
): { ok: true } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: `platformUrl is not a valid URL: ${url}` };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: `platformUrl must be https: ${url}` };
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const allowed = PLATFORM_DOMAINS[platform];
  const matches = allowed.some(
    (d) => host === d || host.endsWith(`.${d}`)
  );
  if (!matches) {
    return {
      ok: false,
      error: `platformUrl domain ${host} not allowed for ${platform}`,
    };
  }
  return { ok: true };
}

function checkDropRule(
  raw: unknown
): { ok: true; value: Restaurant["dropRule"] } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "dropRule is not an object" };
  }
  const d = raw as Record<string, unknown>;
  if (d.kind === "manual") return { ok: true, value: { kind: "manual" } };

  if (d.kind === "rolling" || d.kind === "monthly") {
    if (typeof d.releaseTime !== "string" || !/^\d{2}:\d{2}$/.test(d.releaseTime)) {
      return { ok: false, error: "dropRule.releaseTime must be HH:MM" };
    }
    if (typeof d.timezone !== "string" || d.timezone.length === 0) {
      return { ok: false, error: "dropRule.timezone required" };
    }
    if (d.kind === "rolling") {
      if (typeof d.bookingWindowDays !== "number" || d.bookingWindowDays <= 0) {
        return { ok: false, error: "rolling rule needs positive bookingWindowDays" };
      }
      return {
        ok: true,
        value: {
          kind: "rolling",
          releaseTime: d.releaseTime,
          timezone: d.timezone,
          bookingWindowDays: d.bookingWindowDays,
        },
      };
    }
    if (typeof d.dayOfMonth !== "number" || d.dayOfMonth < 1 || d.dayOfMonth > 31) {
      return { ok: false, error: "monthly rule needs dayOfMonth 1-31" };
    }
    return {
      ok: true,
      value: {
        kind: "monthly",
        releaseTime: d.releaseTime,
        timezone: d.timezone,
        dayOfMonth: d.dayOfMonth,
      },
    };
  }

  return { ok: false, error: `unknown dropRule.kind: ${String(d.kind)}` };
}
