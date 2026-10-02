import { useRef } from "react";
import { api } from "../lib/api.js";
import { exportList, parseImport } from "../lib/listTransfer.js";
import { downloadFile } from "../lib/download.js";

export function ListTools({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function doExport() {
    const list = await api.listRestaurants();
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(`table-drop-list-${date}.json`, exportList(list), "application/json");
  }

  async function doImport(file: File) {
    const result = parseImport(await file.text());
    if (!result.ok) { alert(result.error); return; }
    for (const r of result.restaurants) await api.saveRestaurant(r);
    const skipped = result.skipped.length;
    alert(`Imported ${result.restaurants.length} restaurant(s).` + (skipped ? ` Skipped ${skipped} invalid entr${skipped === 1 ? "y" : "ies"}.` : ""));
    onImported();
  }

  return (
    <span className="list-tools">
      <button className="link" onClick={doExport}>export list</button>
      <button className="link" onClick={() => fileRef.current?.click()}>import list</button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void doImport(f);
          e.target.value = "";
        }}
      />
    </span>
  );
}
