import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { Restaurant } from "../../core/types.js";
import { api } from "../lib/api.js";
import { DateDropdowns } from "../components/DateDropdowns.js";
import { needsVerification, applyVerification } from "../lib/verify.js";
import { isAllowedBookingUrl } from "../lib/booking.js";

interface ItemProps {
  restaurant: Restaurant;
  position: number;
  total: number;
  onVerified: () => void;
  onSkip: () => void;
  onRemove: () => void;
}

function VerifyItem({ restaurant: r, position, total, onVerified, onSkip, onRemove }: ItemProps) {
  const rule = r.dropRule.kind === "rolling" ? r.dropRule : null;
  const [releaseTime, setReleaseTime] = useState(rule?.releaseTime ?? "");
  const [furthest, setFurthest] = useState("");
  const [error, setError] = useState("");
  const preview = furthest ? applyVerification(r, { releaseTime, furthestIso: furthest }, DateTime.now()) : null;

  async function markVerified() {
    const res = applyVerification(r, { releaseTime, furthestIso: furthest }, DateTime.now());
    if (!res.ok) { setError(res.error); return; }
    const saved = await api.saveRestaurant(res.restaurant);
    if (!saved.ok) { setError(saved.error); return; }
    onVerified();
  }

  return (
    <div className="card verify-card">
      <div className="name">{r.name}</div>
      <div className="meta">{r.city} · {r.platform} · {position} of {total} to verify</div>
      {rule && (
        <div className="meta">currently: opens {rule.bookingWindowDays} days ahead at {rule.releaseTime} ({rule.timezone})</div>
      )}
      <ol className="verify-steps">
        <li>
          {isAllowedBookingUrl(r.platformUrl) ? (
            <a className="primary" href={r.platformUrl} target="_blank" rel="noopener noreferrer">Open booking page</a>
          ) : (
            <span className="error">This booking link looks wrong — fix it under My Restaurants.</span>
          )}
        </li>
        <li>
          Release time the page states (24h):{" "}
          <input className="time-input" value={releaseTime} onChange={(e) => setReleaseTime(e.target.value)} placeholder="09:00" />
        </li>
        <li>
          Furthest date you can book right now: <DateDropdowns value="" onChange={setFurthest} />
        </li>
      </ol>
      {preview && (preview.ok ? (
        <div className="calibrate-msg">
          → window {preview.window} days
          {rule && rule.bookingWindowDays !== preview.window ? ` (was ${rule.bookingWindowDays})` : " (matches)"}
        </div>
      ) : (
        <div className="error">{preview.error}</div>
      ))}
      {error && <div className="error">{error}</div>}
      <div className="verify-actions">
        <button className="primary" disabled={!preview || !preview.ok} onClick={markVerified}>✓ Verified</button>
        <button onClick={onSkip}>Skip</button>
        <button onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}

interface Props {
  restaurants: Restaurant[];
  city: string;
  onChange: () => void;
}

export function VerifyScreen({ restaurants, city, onChange }: Props) {
  const queue = useMemo(
    () =>
      restaurants
        .filter((r) => (city === "All" || r.city === city) && needsVerification(r))
        .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    [restaurants, city]
  );
  const [skipped, setSkipped] = useState<string[]>([]);
  const pending = queue.filter((r) => !skipped.includes(r.id));
  const verifiedCount = restaurants.filter((r) => (city === "All" || r.city === city) && r.verifiedOn).length;

  if (queue.length === 0) {
    return <p className="meta">Everything here is verified 🎉 ({verifiedCount} restaurant{verifiedCount === 1 ? "" : "s"}).</p>;
  }
  if (pending.length === 0) {
    return (
      <p className="meta">
        You skipped the rest. <button className="link" onClick={() => setSkipped([])}>start over</button>
      </p>
    );
  }

  const current = pending[0];
  async function remove() {
    if (!window.confirm(`Remove ${current.name} from your list?`)) return;
    await api.deleteRestaurant(current.id);
    onChange();
  }

  return (
    <div>
      <p className="meta verify-intro">
        Check each restaurant against its own booking page: note the furthest date you can book and the release
        time the page states. About 30 seconds each. {verifiedCount} verified so far.
      </p>
      <VerifyItem
        key={current.id}
        restaurant={current}
        position={queue.length - pending.length + 1}
        total={queue.length}
        onVerified={onChange}
        onSkip={() => setSkipped((s) => [...s, current.id])}
        onRemove={remove}
      />
    </div>
  );
}
