import { useEffect, useState, useCallback, useMemo, memo } from "react";
import type { UpcomingDrop } from "../../core/types.js";
import { WAKE_LEAD_MINUTES } from "../../core/types.js";
import { api } from "../lib/api.js";
import { formatCountdown } from "../lib/countdown.js";
import { isAllowedBookingUrl } from "../lib/booking.js";
import { bookingUrlForDate } from "../lib/bookingLink.js";
import { DateDropdowns } from "../components/DateDropdowns.js";
import { verifiedLabel } from "../lib/format.js";
import { buildIcs, CALENDAR_ALERT_MINUTES } from "../lib/calendar.js";
import { downloadFile } from "../lib/download.js";

interface Props { city: string; }

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Owns the once-a-second tick, so only this small element re-renders each
// second instead of the entire card list.
function Countdown({ fireAtIso }: { fireAtIso: string }) {
  const fireMs = useMemo(() => new Date(fireAtIso).getTime(), [fireAtIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = Math.round((fireMs - now) / 1000);
  if (secondsLeft <= 0) return <div className="countdown live">book now</div>;
  return (
    <div className={`countdown ${secondsLeft <= 3600 ? "soon" : secondsLeft <= 86400 ? "near" : "far"}`}>
      {formatCountdown(secondsLeft)}
    </div>
  );
}

interface CardProps {
  drop: UpcomingDrop;
  // ISO next-run of this restaurant's scheduled wake task, or null if none.
  wakeNextRun: string | null;
  onPin: (d: UpcomingDrop, pinned: boolean) => void;
  onTarget: (d: UpcomingDrop, targetDate: string) => void;
  onWakeChange: (id: string, nextRun: string | null) => void;
}

const DropCard = memo(function DropCard({ drop, wakeNextRun, onPin, onTarget, onWakeChange }: CardProps) {
  const r = drop.restaurant;
  // Target dates only retarget rolling drops — hide the picker elsewhere so it
  // can't save a date the countdown would silently ignore.
  const isRolling = r.dropRule.kind === "rolling";

  const url = bookingUrlForDate(r.platform, r.platformUrl, r.targetDate ?? "");
  // Gate on the URL we actually open, not the base it was derived from.
  const safe = isAllowedBookingUrl(url);

  // Downloads a calendar event at the drop moment, with an alert a few minutes
  // before — works on any phone or desktop calendar.
  function addToCalendar() {
    const title = `Reservations open: ${r.name}` + (drop.unlocksDate ? ` (for ${fmtDate(drop.unlocksDate)})` : "");
    const ics = buildIcs({
      uid: `${r.id}-${drop.fireAtIso}@table-drop`,
      title,
      startIso: drop.fireAtIso,
      durationMinutes: 15,
      alarmMinutesBefore: CALENDAR_ALERT_MINUTES,
      url,
      description: `Open the booking page: ${url}`,
    });
    downloadFile(`${r.id}-drop.ics`, ics, "text/calendar");
  }

  // Wake-up state. A scheduled task is only "current" if it fires
  // WAKE_LEAD_MINUTES before THIS card's countdown moment — a task left over
  // from an old target date is stale and must not masquerade as set.
  // Wake-up schedules a task on the desktop machine, so the web version (which
  // has no such machine to wake) hides it entirely.
  const wakeSupported = api.capabilities.wake;
  const canWake = wakeSupported && isRolling && !!r.targetDate;
  const expectedWakeMs = drop.forTarget
    ? new Date(drop.fireAtIso).getTime() - WAKE_LEAD_MINUTES * 60_000
    : null;
  const wakeMs = wakeNextRun ? new Date(wakeNextRun).getTime() : null;
  const wakeIsCurrent =
    wakeMs !== null && expectedWakeMs !== null && Math.abs(wakeMs - expectedWakeMs) < 60_000;
  const wakeIsStale = wakeMs !== null && !wakeIsCurrent;

  async function scheduleWakeUp() {
    const res = await api.scheduleWake(r.id);
    if (res.ok) onWakeChange(r.id, res.wakeAt ?? null);
    else alert(res.error);
  }
  async function cancelWakeUp() {
    await api.cancelWake(r.id);
    onWakeChange(r.id, null);
  }

  return (
    <div className="card">
      <div>
        <div className="name">
          <button
            className={r.pinned ? "pin pinned" : "pin"}
            title={r.pinned ? "Unpin" : "Pin to top"}
            onClick={() => onPin(drop, !r.pinned)}
          >📌</button>
          {r.name}
        </div>
        <div className="meta">
          {r.city} · {r.platform}
          {r.verifiedOn && <span className="verified">{verifiedLabel(r.verifiedOn)}</span>}
        </div>
        {drop.unlocksDate && (
          <div className="meta">
            {drop.forTarget ? "your date: " : "next unlock: "}{fmtDate(drop.unlocksDate)}
          </div>
        )}
        {isRolling && (
          <div className="meta target-picker">
            <span>target date:</span>
            <DateDropdowns value={r.targetDate ?? ""} onChange={(iso) => onTarget(drop, iso)} />
          </div>
        )}
        {wakeSupported && (canWake || wakeMs !== null) && (
          <div className="meta wake-row">
            {wakeIsCurrent ? (
              <>
                <span className="wake-on">⏰ wake-up set</span>
                <button className="link" onClick={cancelWakeUp}>cancel</button>
              </>
            ) : wakeIsStale ? (
              <>
                <span className="error">⚠ wake-up set for a different time</span>
                {canWake && (
                  <button className="link wake-set" onClick={scheduleWakeUp}>reschedule</button>
                )}
                <button className="link" onClick={cancelWakeUp}>cancel</button>
              </>
            ) : (
              <button className="link wake-set" onClick={scheduleWakeUp}>
                ⏰ schedule wake-up ({WAKE_LEAD_MINUTES} min before)
              </button>
            )}
          </div>
        )}
      </div>
      <div className="card-right">
        <Countdown fireAtIso={drop.fireAtIso} />
        {safe ? (
          <a className="primary" href={url} target="_blank" rel="noopener noreferrer">Open booking page</a>
        ) : (
          <span className="error">unsafe link</span>
        )}
        <button className="link" onClick={addToCalendar}>📅 add to calendar</button>
      </div>
    </div>
  );
});

export function DropsScreen({ city }: Props) {
  const [drops, setDrops] = useState<UpcomingDrop[]>([]);
  const [wakeMap, setWakeMap] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api.getDrops().then(setDrops);
    if (api.capabilities.wake) api.wakeAll().then(setWakeMap);
  }, []);
  useEffect(() => { load(); }, [load]);

  const onWakeChange = useCallback((id: string, nextRun: string | null) => {
    setWakeMap((prev) => {
      const next = { ...prev };
      if (nextRun) next[id] = nextRun;
      else delete next[id];
      return next;
    });
  }, []);

  const setPinned = useCallback(async (d: UpcomingDrop, pinned: boolean) => {
    await api.saveRestaurant({ ...d.restaurant, pinned });
    load();
  }, [load]);

  const setTarget = useCallback(async (d: UpcomingDrop, targetDate: string) => {
    await api.saveRestaurant({ ...d.restaurant, targetDate: targetDate || undefined });
    load();
  }, [load]);

  const visible = drops.filter((d) => city === "All" || d.restaurant.city === city);

  // "One date for the whole suite": applies to the rolling restaurants currently
  // shown (so the city filter scopes it — e.g. just your Paris spots).
  const visibleRolling = visible.filter((d) => d.restaurant.dropRule.kind === "rolling");
  const rollingIds = visibleRolling.map((d) => d.restaurant.id);
  const uniqueTargets = new Set(visibleRolling.map((d) => d.restaurant.targetDate ?? ""));
  const suiteValue = uniqueTargets.size === 1 ? [...uniqueTargets][0] : "";
  const anyTargeted = visibleRolling.some((d) => !!d.restaurant.targetDate);

  async function applySuiteDate(iso: string) {
    if (rollingIds.length === 0) return;
    await api.setTargetForAll(rollingIds, iso || null);
    load();
  }

  if (visible.length === 0) {
    return <p className="meta">No upcoming drops{city !== "All" ? ` in ${city}` : ""}.</p>;
  }

  return (
    <div>
      {visibleRolling.length > 0 && (
        <div className="suite-date">
          <span>one date for all {city === "All" ? "" : city + " "}restaurants:</span>
          <DateDropdowns value={suiteValue} onChange={applySuiteDate} />
          {anyTargeted && <button className="link" onClick={() => applySuiteDate("")}>clear all</button>}
        </div>
      )}
      {visible.map((d) => (
        <DropCard
          key={d.restaurant.id}
          drop={d}
          wakeNextRun={wakeMap[d.restaurant.id] ?? null}
          onPin={setPinned}
          onTarget={setTarget}
          onWakeChange={onWakeChange}
        />
      ))}
    </div>
  );
}
