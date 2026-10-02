import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Restaurant } from "./types.js";

export function loadStore(path: string): Restaurant[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  const parsed = JSON.parse(text) as { restaurants: Restaurant[] };
  return parsed.restaurants ?? [];
}

export function saveStore(path: string, restaurants: Restaurant[]): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ restaurants }, null, 2), "utf8");
}
