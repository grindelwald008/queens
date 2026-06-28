// Shared types for the Queens engine.

export type Mark = "empty" | "x" | "queen";

// regions[row][col] = region id (0 .. n-1)
export type Regions = number[][];

// solution[row] = col of the queen in that row
export type Solution = number[];

// Play state: key "r,c" -> mark
export type Marks = Map<string, Mark>;

export interface Level {
  n: number;
  regions: Regions;
  solution?: Solution;
}

export const MARK = {
  EMPTY: "empty",
  X: "x",
  QUEEN: "queen",
} as const satisfies Record<string, Mark>;
