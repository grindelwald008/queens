<script setup lang="ts">
import { computed } from "vue";
import { cellKey } from "../core/board";
import { regionColor } from "../colors";
import type { Marks, Mark, Regions } from "../core/types";

const props = withDefaults(
  defineProps<{
    n: number;
    regions: Regions;
    marks?: Marks;
    violations?: Set<string>;
    autoCells?: Set<string>;
    interaction?: "play" | "paint";
  }>(),
  { interaction: "play" }
);

const emit = defineEmits<{
  (e: "cellclick", r: number, c: number): void; // play: a tap (cycle)
  (e: "paint", r: number, c: number): void; // build: paint region
  (e: "swipestart"): void; // play: a drag began
  (e: "swipe", r: number, c: number): void; // play: drag crossed a cell
}>();

interface CellView {
  r: number;
  c: number;
  key: string;
  region: number;
  mark: Mark;
}

const cells = computed<CellView[]>(() => {
  const out: CellView[] = [];
  for (let r = 0; r < props.n; r++) {
    for (let c = 0; c < props.n; c++) {
      const key = cellKey(r, c);
      out.push({
        r,
        c,
        key,
        region: props.regions[r][c],
        mark: props.marks?.get(key) ?? "empty",
      });
    }
  }
  return out;
});

const THICK = "3px solid #2b2b2b";
const THIN = "1px solid rgba(0,0,0,0.18)";

function cellStyle(cell: CellView) {
  const { r, c, region } = cell;
  const reg = props.regions;
  return {
    background: regionColor(region),
    borderTop: r === 0 || reg[r - 1][c] !== region ? THICK : THIN,
    borderLeft: c === 0 || reg[r][c - 1] !== region ? THICK : THIN,
    borderBottom: r === props.n - 1 || reg[r + 1][c] !== region ? THICK : THIN,
    borderRight: c === props.n - 1 || reg[r][c + 1] !== region ? THICK : THIN,
  };
}

function glyph(mark: Mark): string {
  if (mark === "queen") return "\u265B"; // ♛
  if (mark === "x") return "\u00D7"; // ×
  return "";
}

// ---- pointer interaction ----
let active = false;
let moved = false;
let startCell: [number, number] | null = null;
const visited = new Set<string>();

function cellFromEvent(e: PointerEvent): [number, number] | null {
  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  const btn = el?.closest(".cell") as HTMLElement | null;
  if (!btn) return null;
  return [Number(btn.dataset.r), Number(btn.dataset.c)];
}

function emitStroke(cell: [number, number]) {
  const key = cellKey(cell[0], cell[1]);
  if (visited.has(key)) return;
  visited.add(key);
  emit("swipe", cell[0], cell[1]);
}

function onPointerDown(e: PointerEvent) {
  const cell = cellFromEvent(e);
  if (!cell) return;
  active = true;
  moved = false;
  startCell = cell;
  visited.clear();

  if (props.interaction === "paint") {
    visited.add(cellKey(cell[0], cell[1]));
    emit("paint", cell[0], cell[1]);
  }
}

function onPointerMove(e: PointerEvent) {
  if (!active) return;
  const cell = cellFromEvent(e);
  if (!cell) return;
  const key = cellKey(cell[0], cell[1]);

  if (props.interaction === "paint") {
    if (!visited.has(key)) {
      visited.add(key);
      emit("paint", cell[0], cell[1]);
    }
    return;
  }

  // play: a drag turns into a swipe that crosses out cells
  const startKey = startCell ? cellKey(startCell[0], startCell[1]) : "";
  if (!moved) {
    if (key !== startKey) {
      moved = true;
      emit("swipestart");
      if (startCell) emitStroke(startCell);
      emitStroke(cell);
    }
  } else {
    emitStroke(cell);
  }
}

function onPointerUp() {
  // A clean tap (no drag) in play mode cycles the cell.
  if (active && !moved && startCell && props.interaction === "play") {
    emit("cellclick", startCell[0], startCell[1]);
  }
  active = false;
  startCell = null;
}

function onPointerCancel() {
  active = false;
  startCell = null;
}
</script>

<template>
  <div
    class="board"
    :style="{
      gridTemplateColumns: `repeat(${n}, 1fr)`,
      gridTemplateRows: `repeat(${n}, 1fr)`,
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerCancel"
    @pointercancel="onPointerCancel"
  >
    <button
      v-for="cell in cells"
      :key="cell.key"
      type="button"
      class="cell"
      :class="{
        'has-queen': cell.mark === 'queen',
        'has-x': cell.mark === 'x',
        'auto-x': cell.mark === 'x' && autoCells?.has(cell.key),
        violation: violations?.has(cell.key),
      }"
      :data-r="cell.r"
      :data-c="cell.c"
      :style="cellStyle(cell)"
    >
      {{ glyph(cell.mark) }}
    </button>
  </div>
</template>
