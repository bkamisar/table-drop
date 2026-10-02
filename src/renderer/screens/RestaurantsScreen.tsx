import { useEffect, useState } from "react";
import type { Restaurant } from "../../core/types.js";
import { api } from "../lib/api.js";
import { RestaurantForm } from "../components/RestaurantForm.js";
import { ListTools } from "../components/ListTools.js";
import { verifiedLabel } from "../lib/format.js";

interface Props {
  restaurants: Restaurant[];
  city: string;
  onChange: () => void;
  // Open straight into the "add restaurant" form (used by the welcome screen).
  startAdding?: boolean;
  onStarted?: () => void;
}

export function RestaurantsScreen({ restaurants, city, onChange, startAdding, onStarted }: Props) {
  const [editing, setEditing] = useState<Restaurant | "new" | null>(startAdding ? "new" : null);
  useEffect(() => { if (startAdding) onStarted?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = restaurants.filter((r) => city === "All" || r.city === city);

  async function remove(id: string) {
    await api.deleteRestaurant(id);
    onChange();
  }

  if (editing) {
    return (
      <RestaurantForm
        initial={editing === "new" ? undefined : editing}
        onSaved={() => { setEditing(null); onChange(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="toolbar">
        <button className="primary" onClick={() => setEditing("new")}>+ Add restaurant</button>
        <ListTools onImported={onChange} />
      </div>
      {visible.map((r) => (
        <div className="card" key={r.id}>
          <div>
            <div className="name">{r.name}</div>
            <div className="meta">
              {r.city} · {r.platform}
              {r.verifiedOn && <span className="verified">{verifiedLabel(r.verifiedOn)}</span>}
            </div>
          </div>
          <div>
            <button onClick={() => setEditing(r)}>Edit</button>
            <button onClick={() => remove(r.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
