import type { Restaurant } from "../../core/types.js";

export function citiesOf(restaurants: Restaurant[]): string[] {
  const set = new Set(restaurants.map((r) => r.city));
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Small convenience map so the add form can pre-fill a timezone.
// Not exhaustive by design; unknown cities fall back to ET.
const CITY_TIMEZONES: Record<string, string> = {
  "new york": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "chicago": "America/Chicago",
  "san francisco": "America/Los_Angeles",
  "miami": "America/New_York",
  "paris": "Europe/Paris",
  "london": "Europe/London",
  "tokyo": "Asia/Tokyo",
};

export function defaultTimezoneForCity(city: string): string {
  return CITY_TIMEZONES[city.trim().toLowerCase()] ?? "America/New_York";
}

// A short list of common dining-city timezones for the add/edit form's picker.
// Not exhaustive — the form also keeps whatever timezone a restaurant already
// has, so an unlisted zone is never lost.
export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Australia/Sydney",
];
