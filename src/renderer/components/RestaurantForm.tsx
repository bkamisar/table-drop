import { useState } from "react";
import { DateTime } from "luxon";
import type { Restaurant, DropRule } from "../../core/types.js";
// Single source of truth for platforms — a local copy here once drifted and
// silently locked Zenchef restaurants out of the form.
import { PLATFORMS } from "../../core/types.js";
import { api } from "../lib/api.js";
import { defaultTimezoneForCity, COMMON_TIMEZONES } from "../lib/cities.js";
import { windowFromFurthestDate } from "../lib/calibrate.js";
import { DateDropdowns } from "./DateDropdowns.js";

interface Props {
  initial?: Restaurant;
  onSaved: () => void;
  onCancel: () => void;
}

function initialTimezone(initial?: Restaurant): string {
  if (initial && "timezone" in initial.dropRule) return initial.dropRule.timezone;
  return defaultTimezoneForCity(initial?.city ?? "");
}

export function RestaurantForm({ initial, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [platform, setPlatform] = useState<string>(initial?.platform ?? "Resy");
  const [platformUrl, setPlatformUrl] = useState(initial?.platformUrl ?? "");
  const [timezone, setTimezone] = useState(initialTimezone(initial));
  const [kind, setKind] = useState<DropRule["kind"]>(initial?.dropRule.kind ?? "rolling");
  const [releaseTime, setReleaseTime] = useState(
    initial && "releaseTime" in initial.dropRule ? initial.dropRule.releaseTime : "10:00"
  );
  const [windowDays, setWindowDays] = useState(
    initial?.dropRule.kind === "rolling" ? String(initial.dropRule.bookingWindowDays) : "30"
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    initial?.dropRule.kind === "monthly" ? String(initial.dropRule.dayOfMonth) : "1"
  );
  // "assist" mode was never built, so the form no longer offers a choice;
  // existing restaurants keep whatever value they had.
  const tier: Restaurant["tier"] = initial?.tier ?? "alert";
  const [calibrateMsg, setCalibrateMsg] = useState("");
  // Set when the user calibrates from a first-hand look at the booking page.
  const [verifiedToday, setVerifiedToday] = useState(false);
  const [error, setError] = useState("");

  // Typing a city updates the timezone guess so a new city isn't left on the
  // default New York zone. The user can still override the picker afterward.
  function onCityChange(next: string) {
    setCity(next);
    setTimezone(defaultTimezoneForCity(next));
  }

  // Calibrate: derive the true window from the furthest bookable date.
  function calibrate(iso: string) {
    if (!iso) { setCalibrateMsg(""); return; }
    const w = windowFromFurthestDate(iso, timezone, DateTime.now(), releaseTime);
    if (w) {
      setWindowDays(String(w));
      setVerifiedToday(true);
      setCalibrateMsg(`✓ booking window set to ${w} days — will be marked verified`);
    } else {
      setCalibrateMsg("that date needs to be in the future");
    }
  }

  function buildDropRule(): DropRule {
    if (kind === "manual") return { kind: "manual" };
    if (kind === "monthly") return { kind: "monthly", releaseTime, timezone, dayOfMonth: Number(dayOfMonth) };
    return { kind: "rolling", releaseTime, timezone, bookingWindowDays: Number(windowDays) };
  }

  async function submit() {
    const id = initial?.id ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    // Spread `initial` first so fields this form doesn't edit (pinned,
    // targetDate) survive an edit instead of being silently wiped.
    const candidate = {
      ...initial, id, name, city, platform, platformUrl, dropRule: buildDropRule(), tier,
      ...(verifiedToday ? { verifiedOn: DateTime.now().toISODate() } : {}),
    };
    const result = await api.saveRestaurant(candidate);
    if (result.ok) onSaved();
    else setError(result.error);
  }

  const tzOptions = COMMON_TIMEZONES.includes(timezone) ? COMMON_TIMEZONES : [timezone, ...COMMON_TIMEZONES];

  return (
    <div className="form">
      <div className="form-row"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-row"><label>City</label><input value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="New York" /></div>
      <div className="form-row">
        <label>Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-row"><label>Booking URL</label><input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} placeholder="https://resy.com/..." /></div>
      {kind !== "manual" && (
        <div className="form-row">
          <label>Timezone (of the restaurant)</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {tzOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      )}
      <div className="form-row">
        <label>Drop rule</label>
        <select value={kind} onChange={(e) => setKind(e.target.value as DropRule["kind"])}>
          <option value="rolling">Rolling window (opens daily)</option>
          <option value="monthly">Monthly batch</option>
          <option value="manual">Unknown / manual</option>
        </select>
      </div>
      {kind !== "manual" && (
        <div className="form-row"><label>Release time (24h, e.g. 10:00)</label><input value={releaseTime} onChange={(e) => setReleaseTime(e.target.value)} /></div>
      )}
      {kind === "rolling" && (
        <>
          <div className="form-row"><label>Booking window (days ahead)</label><input value={windowDays} onChange={(e) => setWindowDays(e.target.value)} /></div>
          <div className="form-row calibrate">
            <label>Not sure? Pick the furthest date you can book right now:</label>
            <DateDropdowns value="" onChange={calibrate} />
            {calibrateMsg && <span className="calibrate-msg">{calibrateMsg}</span>}
          </div>
        </>
      )}
      {kind === "monthly" && (
        <div className="form-row"><label>Day of month</label><input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} /></div>
      )}
      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={submit}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
