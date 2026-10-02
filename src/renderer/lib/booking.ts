import { PLATFORM_DOMAINS } from "../../core/types.js";

const ALLOWED = Object.values(PLATFORM_DOMAINS).flat();

export function isAllowedBookingUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.replace(/^www\./, "");
  return ALLOWED.some((d) => host === d || host.endsWith(`.${d}`));
}
