// The booking platforms we support, and the only hostnames a booking URL may use.
export const PLATFORMS = ["Resy", "Tock", "OpenTable", "SevenRooms", "Zenchef"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_DOMAINS: Record<Platform, string[]> = {
  Resy: ["resy.com"],
  Tock: ["exploretock.com", "tock.com"],
  OpenTable: ["opentable.com"],
  SevenRooms: ["sevenrooms.com"],
  Zenchef: ["zenchef.com"],
};

// How many minutes before a drop the scheduled wake-up fires. Shared by the
// server (task registration) and the UI (labels, staleness checks) so the two
// can never disagree.
export const WAKE_LEAD_MINUTES = 3;

// How a restaurant releases reservations.
// - rolling: every day at releaseTime, the date (today + bookingWindowDays) opens.
// - monthly: on dayOfMonth at releaseTime each month, a batch opens.
// - manual: drop timing unknown; track + alert only, user supplies timing.
export type DropRule =
  | {
      kind: "rolling";
      releaseTime: string; // "HH:MM" 24h
      timezone: string; // IANA, e.g. "America/New_York"
      bookingWindowDays: number;
    }
  | {
      kind: "monthly";
      releaseTime: string; // "HH:MM" 24h
      timezone: string;
      dayOfMonth: number; // 1-31, clamped to month length
    }
  | { kind: "manual" };

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  platform: Platform;
  platformUrl: string;
  dropRule: DropRule;
  // Per-restaurant behavior tier chosen by the user.
  tier: "alert" | "assist";
  // Optional UI/state fields:
  pinned?: boolean;       // sort to top of the Drops list
  targetDate?: string;    // "YYYY-MM-DD" dining date to retarget the countdown
  // "YYYY-MM-DD" date the drop rule was checked first-hand against the
  // restaurant's own booking page. Only verified restaurants are published.
  verifiedOn?: string;
}

export interface UpcomingDrop {
  restaurant: Restaurant;
  fireAtIso: string; // UTC ISO of the next moment reservations open
  secondsUntil: number;
  unlocksDate: string | null; // "YYYY-MM-DD" the date this drop opens (rolling only)
  forTarget: boolean;         // true if this countdown targets the restaurant's targetDate
}
