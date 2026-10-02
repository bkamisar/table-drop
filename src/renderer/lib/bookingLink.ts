import type { Platform } from "../../core/types.js";

// Best-effort: append the chosen dining date (and a default party size where the
// platform expects one) to a booking URL so it lands on that date's availability.
// Param names vary by platform and sites change, so this is best-effort: if the
// URL can't be parsed or the date is empty, the base URL is returned unchanged.
export function bookingUrlForDate(
  platform: Platform,
  baseUrl: string,
  dateIso: string
): string {
  if (!dateIso) return baseUrl;
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    return baseUrl;
  }
  const p = u.searchParams;
  switch (platform) {
    case "SevenRooms":
      p.set("date", dateIso);
      if (!p.has("party_size")) p.set("party_size", "2");
      p.set("lang", "en"); // Paris venues default to French; force English.
      break;
    case "OpenTable":
      p.set("dateTime", `${dateIso}T19:00`);
      break;
    case "Tock":
      p.set("date", dateIso);
      if (!p.has("size")) p.set("size", "2");
      break;
    case "Resy":
      p.set("date", dateIso);
      if (!p.has("seats")) p.set("seats", "2");
      break;
    case "Zenchef":
      p.set("date", dateIso);
      p.set("lang", "en"); // Paris venues default to French; force English.
      break;
    default: {
      // Compile-time exhaustiveness: adding a platform to PLATFORMS without
      // deciding its URL params here becomes a type error instead of a silent
      // wrong-params fallthrough at the drop moment.
      const unhandled: never = platform;
      void unhandled;
      p.set("date", dateIso);
      break;
    }
  }
  u.search = p.toString();
  return u.toString();
}
