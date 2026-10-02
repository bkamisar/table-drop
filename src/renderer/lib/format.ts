// "2026-10-01" -> "✓ verified Oct 2026"
export function verifiedLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `✓ verified ${d.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
}
