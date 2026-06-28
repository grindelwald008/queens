// Constraint checking for the Queens puzzle.

import { cellKey } from "./board";
import type { Regions } from "./types";

type Cell = [number, number];

// Given the board and the queen cells, return a Set of "r,c" keys for every
// queen involved in a violation.
export function findViolations(_n: number, regions: Regions, queens: Cell[]): Set<string> {
  const violations = new Set<string>();

  const byRow = new Map<number, Cell[]>();
  const byCol = new Map<number, Cell[]>();
  const byReg = new Map<number, Cell[]>();

  const push = (map: Map<number, Cell[]>, key: number, cell: Cell) => {
    const arr = map.get(key);
    if (arr) arr.push(cell);
    else map.set(key, [cell]);
  };

  for (const [r, c] of queens) {
    push(byRow, r, [r, c]);
    push(byCol, c, [r, c]);
    push(byReg, regions[r][c], [r, c]);
  }

  for (const map of [byRow, byCol, byReg]) {
    for (const group of map.values()) {
      if (group.length > 1) {
        for (const [r, c] of group) violations.add(cellKey(r, c));
      }
    }
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i];
      const [r2, c2] = queens[j];
      if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) {
        violations.add(cellKey(r1, c1));
        violations.add(cellKey(r2, c2));
      }
    }
  }

  return violations;
}

// Won when all N queens are placed and there are no violations.
export function isSolved(n: number, regions: Regions, queens: Cell[]): boolean {
  if (queens.length !== n) return false;
  return findViolations(n, regions, queens).size === 0;
}
