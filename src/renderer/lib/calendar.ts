// Builds an RFC 5545 calendar file so a drop can be added to any phone or
// desktop calendar with an alert — the web version's stand-in for wake-up.
export const CALENDAR_ALERT_MINUTES = 5;

export interface IcsEvent {
  uid: string;
  title: string;
  startIso: string;
  durationMinutes: number;
  alarmMinutesBefore: number;
  url?: string;
  description?: string;
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 octets continue on the next line after a single space.
function fold(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of Array.from(line)) {
    const b = enc.encode(ch).length;
    if (bytes + b > 75) {
      parts.push(cur);
      cur = " ";
      bytes = 1;
    }
    cur += ch;
    bytes += b;
  }
  parts.push(cur);
  return parts.join("\r\n");
}

export function buildIcs(e: IcsEvent, now: Date = new Date()): string {
  const start = new Date(e.startIso);
  const end = new Date(start.getTime() + e.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Table Drop//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(e.title)}`,
    `TRIGGER:-PT${e.alarmMinutesBefore}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
