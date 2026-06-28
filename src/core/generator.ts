// Level generator: produce a guaranteed-unique Queens puzzle of size n.
//
// 1. Random valid queen placement (the seeds of the N regions).
// 2. Grow regions outward from each seed via randomized multi-source BFS.
// 3. If not unique, break alternate solutions by moving a boundary cell into a
//    neighbouring region (keeping regions connected) until unique.

import { cloneRegions, neighbors4 } from "./board";
import { findSolutions, hasUniqueSolution } from "./solver";
import type { Level, Regions, Solution } from "./types";

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomPlacement(n: number): Solution | null {
  const colUsed = new Array<boolean>(n).fill(false);
  const solution = new Array<number>(n);

  const backtrack = (row: number, prevCol: number): boolean => {
    if (row === n) return true;
    for (const c of shuffle([...Array(n).keys()])) {
      if (colUsed[c]) continue;
      if (prevCol !== -1 && Math.abs(c - prevCol) === 1) continue;
      colUsed[c] = true;
      solution[row] = c;
      if (backtrack(row + 1, c)) return true;
      colUsed[c] = false;
    }
    return false;
  };

  return backtrack(0, -1) ? solution : null;
}

function growRegions(n: number, solution: Solution): Regions {
  const regions: Regions = Array.from({ length: n }, () => new Array<number>(n).fill(-1));
  const frontier: Array<[number, number, number]> = [];

  for (let r = 0; r < n; r++) {
    const c = solution[r];
    regions[r][c] = r;
    frontier.push([r, c, r]);
  }

  let remaining = n * n - n;
  while (remaining > 0 && frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const [cr, cc, reg] = frontier[idx];

    const free = shuffle(neighbors4(cr, cc, n)).filter(([nr, nc]) => regions[nr][nc] === -1);

    if (free.length === 0) {
      frontier.splice(idx, 1);
      continue;
    }

    const [nr, nc] = free[0];
    regions[nr][nc] = reg;
    frontier.push([nr, nc, reg]);
    remaining--;
  }

  return regions;
}

function isRegionConnected(regions: Regions, n: number, id: number): boolean {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (regions[r][c] === id) cells.push([r, c]);
  if (cells.length <= 1) return true;

  const seen = new Set<string>();
  const start = cells[0];
  const stack: Array<[number, number]> = [start];
  seen.add(start[0] + "," + start[1]);
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [nr, nc] of neighbors4(r, c, n)) {
      if (regions[nr][nc] !== id) continue;
      const k = nr + "," + nc;
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push([nr, nc]);
    }
  }
  return seen.size === cells.length;
}

function sameSolution(a: Solution, b: Solution): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function refineToUnique(n: number, solution: Solution, regions: Regions, maxSteps = 400): boolean {
  for (let step = 0; step < maxSteps; step++) {
    const sols = findSolutions(regions, n, 2);
    if (sols.length === 1) return true;

    const alt = sameSolution(sols[0], solution) ? sols[1] : sols[0];

    const diffRows: number[] = [];
    for (let r = 0; r < n; r++) if (alt[r] !== solution[r]) diffRows.push(r);
    if (diffRows.length === 0) return true;

    shuffle(diffRows);
    let changed = false;
    for (const r of diffRows) {
      const c = alt[r];
      const curReg = regions[r][c];

      const candidates = shuffle([
        ...new Set(
          neighbors4(r, c, n)
            .map(([nr, nc]) => regions[nr][nc])
            .filter((id) => id !== curReg)
        ),
      ]);

      for (const newReg of candidates) {
        regions[r][c] = newReg;
        if (isRegionConnected(regions, n, curReg)) {
          changed = true;
          break;
        }
        regions[r][c] = curReg;
      }
      if (changed) break;
    }

    if (!changed) return false;
  }
  return hasUniqueSolution(regions, n);
}

export function generateLevel(
  n: number,
  { placementAttempts = 80, growthAttempts = 8 } = {}
): Level {
  for (let p = 0; p < placementAttempts; p++) {
    const solution = randomPlacement(n);
    if (!solution) continue;

    for (let g = 0; g < growthAttempts; g++) {
      const regions = growRegions(n, solution);
      if (hasUniqueSolution(regions, n)) {
        return { n, regions: cloneRegions(regions), solution: solution.slice() };
      }
      if (refineToUnique(n, solution, regions)) {
        return { n, regions: cloneRegions(regions), solution: solution.slice() };
      }
    }
  }
  throw new Error(`Could not generate a unique level for n=${n}. Try again.`);
}
