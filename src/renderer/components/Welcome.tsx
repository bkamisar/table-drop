import { ListTools } from "./ListTools.js";

export function Welcome({ onAdd, onImported }: { onAdd: () => void; onImported: () => void }) {
  return (
    <div className="welcome">
      <h2>Never miss the moment tables drop.</h2>
      <p className="meta">
        Table Drop counts down to the exact second hard-to-get restaurants release reservations — then sends you
        straight to the official booking page. It never books for you.
      </p>
      <ol className="welcome-steps">
        <li>Add a restaurant and paste its booking page.</li>
        <li>Pick the night you want to eat.</li>
        <li>Get a countdown — and a calendar alert — for the moment that night opens.</li>
      </ol>
      <div className="toolbar">
        <button className="primary" onClick={onAdd}>+ Add your first restaurant</button>
        <ListTools onImported={onImported} />
      </div>
    </div>
  );
}
