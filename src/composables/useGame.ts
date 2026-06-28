// Play-mode state and actions as a composable. Vue reactivity replaces the
// manual render() calls from the vanilla version.

import { computed, ref } from "vue";
import { cellKey, cloneRegions, parseKey, queensFromMarks } from "../core/board";
import { findViolations, isSolved } from "../core/rules";
import { findSolutions } from "../core/solver";
import { generateLevel } from "../core/generator";
import type { Level, Marks, Regions, Solution } from "../core/types";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

export function useGame() {
  const n = ref(0);
  const regions = ref<Regions>([]);
  const marks = ref<Marks>(new Map());
  const history = ref<Marks[]>([]);
  const won = ref(false);
  let solutionCache: Solution | null = null;
  const autoMark = ref(false);

  const elapsedMs = ref(0);
  let startTime = 0;
  let timerId: number | null = null;

  function stopTimer() {
    if (timerId !== null) {
      elapsedMs.value = Date.now() - startTime;
      clearInterval(timerId);
      timerId = null;
    }
  }
  function startTimer() {
    startTime = Date.now();
    elapsedMs.value = 0;
    timerId = window.setInterval(() => {
      elapsedMs.value = Date.now() - startTime;
    }, 250);
  }

  const queens = computed(() => queensFromMarks(marks.value));
  const violations = computed(() => findViolations(n.value, regions.value, queens.value));
  const placed = computed(() => queens.value.length);
  const timeLabel = computed(() => fmt(elapsedMs.value));

  // Cells that the auto-mark feature crosses out: every empty cell that shares a
  // row, column, or color region with a queen, plus the diagonally-adjacent
  // cells (none of these can hold a queen). Derived, so it always stays correct.
  const autoCells = computed<Set<string>>(() => {
    const set = new Set<string>();
    if (!autoMark.value) return set;

    const size = n.value;
    const reg = regions.value;
    const isEmpty = (r: number, c: number) => (marks.value.get(cellKey(r, c)) ?? "empty") === "empty";
    const add = (r: number, c: number) => {
      if (r < 0 || c < 0 || r >= size || c >= size) return;
      if (isEmpty(r, c)) set.add(cellKey(r, c));
    };

    for (const [qr, qc] of queens.value) {
      const qReg = reg[qr][qc];
      for (let i = 0; i < size; i++) {
        add(qr, i); // same row
        add(i, qc); // same column
      }
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (reg[r][c] === qReg) add(r, c); // same region
        }
      }
      add(qr - 1, qc - 1); // diagonals (touching)
      add(qr - 1, qc + 1);
      add(qr + 1, qc - 1);
      add(qr + 1, qc + 1);
    }
    return set;
  });

  // What the board renders: the player's marks plus the auto crosses on top.
  const displayMarks = computed<Marks>(() => {
    if (!autoMark.value) return marks.value;
    const m = new Map(marks.value);
    for (const key of autoCells.value) m.set(key, "x");
    return m;
  });

  const statusText = computed(() => {
    if (won.value) return "Solved!";
    if (violations.value.size > 0) return "Conflict — queens are touching or sharing a line/region.";
    if (placed.value === n.value) return "All placed!";
    return `${placed.value} / ${n.value} queens placed`;
  });
  const statusKind = computed(() => {
    if (won.value) return "good";
    if (violations.value.size > 0) return "bad";
    if (placed.value === n.value) return "good";
    return "";
  });

  function pushHistory() {
    history.value.push(new Map(marks.value));
    if (history.value.length > 200) history.value.shift();
  }

  function checkWin() {
    if (isSolved(n.value, regions.value, queens.value)) {
      won.value = true;
      stopTimer();
    }
  }

  function cycle(r: number, c: number) {
    if (won.value) return;
    const key = cellKey(r, c);
    const cur = marks.value.get(key) ?? "empty";
    pushHistory();
    const next = new Map(marks.value);
    if (cur === "empty") next.set(key, "x");
    else if (cur === "x") next.set(key, "queen");
    else next.delete(key);
    marks.value = next;
    checkWin();
  }

  function toggleAutoMark() {
    autoMark.value = !autoMark.value;
  }

  // Swipe-to-cross: snapshot once at the start of a drag, then mark each empty
  // cell the finger passes over with an X (queens and existing marks untouched).
  function beginStroke() {
    if (won.value) return;
    pushHistory();
  }
  function strokeCross(r: number, c: number) {
    if (won.value) return;
    const key = cellKey(r, c);
    if ((marks.value.get(key) ?? "empty") !== "empty") return;
    const next = new Map(marks.value);
    next.set(key, "x");
    marks.value = next;
  }

  function undo() {
    const prev = history.value.pop();
    if (!prev) return;
    marks.value = prev;
    won.value = false;
  }

  function clear() {
    pushHistory();
    marks.value = new Map();
    won.value = false;
  }

  function ensureSolution(): Solution | null {
    if (!solutionCache) {
      const sols = findSolutions(regions.value, n.value, 1);
      solutionCache = sols.length ? sols[0] : null;
    }
    return solutionCache;
  }

  // Returns a user-facing message for the caller to surface as a toast.
  function hint(): string | null {
    if (won.value) return null;
    const sol = ensureSolution();
    if (!sol) return "This puzzle has no solution.";

    const placedByRow = new Map(queens.value.map(([r, c]) => [r, c]));
    for (let r = 0; r < n.value; r++) {
      if (placedByRow.get(r) !== sol[r]) {
        pushHistory();
        const next = new Map(marks.value);
        for (const [key, m] of [...next.entries()]) {
          if (m === "queen" && parseKey(key)[0] === r) next.delete(key);
        }
        next.set(cellKey(r, sol[r]), "queen");
        marks.value = next;
        checkWin();
        return null;
      }
    }
    return "All queens are already correct!";
  }

  function start(level: Level) {
    n.value = level.n;
    regions.value = cloneRegions(level.regions);
    marks.value = new Map();
    history.value = [];
    won.value = false;
    solutionCache = level.solution ? level.solution.slice() : null;
    stopTimer();
    startTimer();
  }

  // Generate a fresh puzzle of the current size. May throw.
  function newPuzzle() {
    start(generateLevel(n.value));
  }

  return {
    n,
    regions,
    marks,
    won,
    violations,
    placed,
    timeLabel,
    statusText,
    statusKind,
    autoMark,
    autoCells,
    displayMarks,
    cycle,
    toggleAutoMark,
    beginStroke,
    strokeCross,
    undo,
    clear,
    hint,
    start,
    newPuzzle,
    stopTimer,
  };
}
