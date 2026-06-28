// Data model helpers for a Queens level and the in-progress play state.

import { MARK, type Marks, type Regions } from "./types";

export const MIN_N = 5;
export const MAX_N = 10;

// Create an empty regions grid (all cells belong to region 0).
export function blankRegions(n: number): Regions {
  return Array.from({ length: n }, () => new Array<number>(n).fill(0));
}

// Deep copy a regions grid.
export function cloneRegions(regions: Regions): Regions {
  return regions.map((row) => row.slice());
}

// Key helper used throughout for Map/Set of cells.
export function cellKey(r: number, c: number): string {
  return r + "," + c;
}

export function parseKey(key: string): [number, number] {
  const [r, c] = key.split(",").map(Number);
  return [r, c];
}

// Return the list of queen cells from a marks Map.
export function queensFromMarks(marks: Marks): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [key, mark] of marks.entries()) {
    if (mark === MARK.QUEEN) out.push(parseKey(key));
  }
  return out;
}

// Orthogonal neighbours of a cell, clipped to the board.
export function neighbors4(r: number, c: number, n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < n - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < n - 1) out.push([r, c + 1]);
  return out;
}

// How many distinct region ids actually appear in the grid.
export function distinctRegionCount(regions: Regions): number {
  const seen = new Set<number>();
  for (const row of regions) for (const id of row) seen.add(id);
  return seen.size;
}
