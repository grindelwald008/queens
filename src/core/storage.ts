// Persistence and sharing. A level only needs { n, regions }; the unique
// solution is always recomputable by the solver, so it is never stored.

import type { Level, Regions } from "./types";

export interface SavedLevel {
  name: string;
  n: number;
  regions: Regions;
  token: string;
  savedAt: number;
}

const SAVE_KEY = "queens.levels.v1";

function regionsToString(regions: Regions): string {
  return regions.map((row) => row.map((id) => id.toString(36)).join("")).join("");
}

function stringToRegions(flat: string, n: number): Regions {
  const regions: Regions = [];
  let i = 0;
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) row.push(parseInt(flat[i++], 36));
    regions.push(row);
  }
  return regions;
}

function b64encode(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

export function encodeLevel(level: Pick<Level, "n" | "regions">): string {
  const payload = `${level.n}.${regionsToString(level.regions)}`;
  return b64encode(payload);
}

export function decodeLevel(token: string): { n: number; regions: Regions } | null {
  try {
    const payload = b64decode(token);
    const dot = payload.indexOf(".");
    if (dot < 0) return null;
    const n = parseInt(payload.slice(0, dot), 10);
    const flat = payload.slice(dot + 1);
    if (!Number.isInteger(n) || n < 2 || flat.length !== n * n) return null;
    return { n, regions: stringToRegions(flat, n) };
  } catch {
    return null;
  }
}

export function shareUrl(level: Pick<Level, "n" | "regions">): string {
  const base = location.origin + location.pathname;
  return `${base}#lvl=${encodeLevel(level)}`;
}

export function levelFromHash(): { n: number; regions: Regions } | null {
  const m = location.hash.match(/lvl=([^&]+)/);
  if (!m) return null;
  return decodeLevel(m[1]);
}

export function loadSavedLevels(): SavedLevel[] {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]") as SavedLevel[];
  } catch {
    return [];
  }
}

export function saveLevel(name: string, level: Pick<Level, "n" | "regions">): void {
  const list = loadSavedLevels();
  list.unshift({
    name: name || `Puzzle ${level.n}x${level.n}`,
    n: level.n,
    regions: level.regions,
    token: encodeLevel(level),
    savedAt: Date.now(),
  });
  localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 50)));
}

export function deleteSavedLevel(index: number): void {
  const list = loadSavedLevels();
  list.splice(index, 1);
  localStorage.setItem(SAVE_KEY, JSON.stringify(list));
}
