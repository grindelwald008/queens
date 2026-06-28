// Region color palette (supports n up to 10+).
export const REGION_COLORS = [
  "#f7c59f", // peach
  "#a3d9a5", // green
  "#9ec5fe", // blue
  "#f5a6c9", // pink
  "#ffe08a", // yellow
  "#c4a7e7", // purple
  "#9ee6e0", // teal
  "#d7b89c", // tan
  "#b8c0ff", // periwinkle
  "#ff9b85", // coral
  "#cdeac0", // mint
  "#e0aaff", // lilac
];

export function regionColor(id: number): string {
  return REGION_COLORS[id % REGION_COLORS.length];
}
