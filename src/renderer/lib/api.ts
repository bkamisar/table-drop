import type { Restaurant } from "../../core/types.js";
import type { DataSource } from "./sources/types.js";
import { serverSource } from "./sources/server.js";
import { createBrowserSource, type KeyValueStorage } from "./sources/browser.js";
import starter from "../../data/starter.json";

// localStorage can be unavailable (private browsing, blocked storage). Fall back
// to memory so the site still works, and let the UI warn that nothing is saved.
function browserStorage(): { storage: KeyValueStorage; persistent: boolean } {
  try {
    const ls = window.localStorage;
    const probe = "__tabledrop_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return { storage: ls, persistent: true };
  } catch {
    const mem = new Map<string, string>();
    return {
      storage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) },
      persistent: false,
    };
  }
}

// Desktop build (default): talk to the local server. Web build
// (`vite build --mode web`): everything lives in the visitor's own browser.
function pickSource(): DataSource {
  if (import.meta.env.VITE_TARGET === "web") {
    const { storage, persistent } = browserStorage();
    const starterList = (starter as { restaurants?: Restaurant[] }).restaurants ?? [];
    return createBrowserSource(storage, starterList, persistent);
  }
  return serverSource;
}

export const api: DataSource = pickSource();
