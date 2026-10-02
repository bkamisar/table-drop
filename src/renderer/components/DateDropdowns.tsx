import { useEffect, useState } from "react";

// A pick-only Month / Day / Year selector that emits a "YYYY-MM-DD" string once
// all three form a real calendar date (and "" when cleared). Pick-only avoids
// the locale/typing-order pitfalls of a native <input type="date">.
const MONTHS = [
  ["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"], ["05", "May"], ["06", "Jun"],
  ["07", "Jul"], ["08", "Aug"], ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"],
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2].map(String);

// True only if y-m-d is a real calendar date (rejects e.g. Feb 30).
function isValidYmd(y: string, m: string, d: string): boolean {
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return dt.getUTCFullYear() === Number(y) && dt.getUTCMonth() === Number(m) - 1 && dt.getUTCDate() === Number(d);
}

interface Props {
  value: string;                    // "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;  // full valid date, or "" when cleared
}

export function DateDropdowns({ value, onChange }: Props) {
  const [y, m, d] = value.split("-");
  const [year, setYear] = useState(y ?? "");
  const [month, setMonth] = useState(m ?? "");
  const [day, setDay] = useState(d ?? "");

  // Resync only when the saved value actually changes.
  useEffect(() => {
    const [yy, mm, dd] = (value ?? "").split("-");
    setYear(yy ?? ""); setMonth(mm ?? ""); setDay(dd ?? "");
  }, [value]);

  function pick(nextYear: string, nextMonth: string, nextDay: string) {
    setYear(nextYear); setMonth(nextMonth); setDay(nextDay);
    if (nextYear && nextMonth && nextDay && isValidYmd(nextYear, nextMonth, nextDay)) {
      onChange(`${nextYear}-${nextMonth}-${nextDay}`);
    }
  }
  function clear() {
    setYear(""); setMonth(""); setDay("");
    onChange("");
  }

  return (
    <span className="date-dropdowns">
      <select value={month} onChange={(e) => pick(year, e.target.value, day)}>
        <option value="">Mon</option>
        {MONTHS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      <select value={day} onChange={(e) => pick(year, month, e.target.value)}>
        <option value="">Day</option>
        {DAYS.map((v) => <option key={v} value={v}>{Number(v)}</option>)}
      </select>
      <select value={year} onChange={(e) => pick(e.target.value, month, day)}>
        <option value="">Year</option>
        {YEARS.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      {(year || month || day) && (
        <button className="link" onClick={clear}>clear</button>
      )}
    </span>
  );
}
