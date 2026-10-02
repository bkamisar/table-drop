// Formats seconds as a compact countdown: ">=1d" -> "2d 03h 04m 05s",
// otherwise "03h 04m 05s". Negative clamps to zeros.
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const hms = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return days > 0 ? `${days}d ${hms}` : hms;
}
