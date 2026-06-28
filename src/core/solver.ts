// Backtracking solver for the Queens puzzle.
//
// One queen per row, scanned top-to-bottom. A diagonal touch requires rows to
// differ by exactly 1, so each new queen only needs comparing to the queen in
// the previous row.

import type { Regions, Solution } from "./types";

// Find up to `limit` solutions. Each solution is an array solution[row] = col.
export function findSolutions(regions: Regions, n: number, limit = 2): Solution[] {
  const colUsed = new Array<boolean>(n).fill(false);
  const regUsed = new Array<boolean>(n).fill(false);
  const current = new Array<number>(n);
  const solutions: Solution[] = [];

  const backtrack = (row: number, prevCol: number): void => {
    if (solutions.length >= limit) return;
    if (row === n) {
      solutions.push(current.slice());
      return;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = regions[row][c];
      if (regUsed[reg]) continue;
      if (prevCol !== -1 && Math.abs(c - prevCol) === 1) continue;

      colUsed[c] = true;
      regUsed[reg] = true;
      current[row] = c;

      backtrack(row + 1, c);

      colUsed[c] = false;
      regUsed[reg] = false;

      if (solutions.length >= limit) return;
    }
  };

  backtrack(0, -1);
  return solutions;
}

export function countSolutions(regions: Regions, n: number, limit = 2): number {
  return findSolutions(regions, n, limit).length;
}

export function hasUniqueSolution(regions: Regions, n: number): boolean {
  return countSolutions(regions, n, 2) === 1;
}
