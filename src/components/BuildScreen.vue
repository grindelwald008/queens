<script setup lang="ts">
import { ref, watch } from "vue";
import BoardGrid from "./BoardGrid.vue";
import Palette from "./Palette.vue";
import { blankRegions, cloneRegions, distinctRegionCount, MAX_N, MIN_N } from "../core/board";
import { findSolutions } from "../core/solver";
import { generateLevel } from "../core/generator";
import { saveLevel, shareUrl } from "../core/storage";
import type { Level, Regions, Solution } from "../core/types";

const props = defineProps<{ initialN: number }>();
const emit = defineEmits<{
  (e: "play", level: Level): void;
  (e: "menu"): void;
  (e: "toast", msg: string): void;
}>();

const n = ref(props.initialN);
const regions = ref<Regions>(blankRegions(props.initialN));
const selected = ref(0);
const sizes = Array.from({ length: MAX_N - MIN_N + 1 }, (_, i) => MIN_N + i);

const statusMsg = ref("Blank board. Paint regions or auto-generate.");
const statusKind = ref("");

watch(
  () => props.initialN,
  (v) => {
    n.value = v;
    reset();
  }
);

watch(n, () => reset());

function reset() {
  selected.value = 0;
  regions.value = blankRegions(n.value);
  setStatus("Blank board. Paint regions or auto-generate.");
}

function setStatus(msg: string, kind = "") {
  statusMsg.value = msg;
  statusKind.value = kind;
}

function paint(r: number, c: number) {
  if (regions.value[r][c] === selected.value) return;
  regions.value[r][c] = selected.value;
}

function generate() {
  setStatus("Generating…");
  setTimeout(() => {
    try {
      const lvl = generateLevel(n.value);
      regions.value = cloneRegions(lvl.regions);
      setStatus("Generated a unique puzzle.", "good");
    } catch (e) {
      setStatus((e as Error).message, "bad");
    }
  }, 10);
}

function blank() {
  regions.value = blankRegions(n.value);
  setStatus("Cleared to a blank board.");
}

interface EvalResult {
  ok: boolean;
  message: string;
  kind: string;
  solution?: Solution;
}

function evaluate(): EvalResult {
  if (distinctRegionCount(regions.value) !== n.value) {
    return { ok: false, message: `Use all ${n.value} colors — each region needs exactly one queen.`, kind: "bad" };
  }
  const sols = findSolutions(regions.value, n.value, 2);
  if (sols.length === 0) return { ok: false, message: "No solution — this layout is impossible.", kind: "bad" };
  if (sols.length > 1) return { ok: false, message: "Multiple solutions — keep editing until it's unique.", kind: "bad" };
  return { ok: true, message: "Valid! Exactly one solution.", kind: "good", solution: sols[0] };
}

function validate() {
  const res = evaluate();
  setStatus(res.message, res.kind);
}

function playThis() {
  const res = evaluate();
  if (!res.ok) {
    setStatus(res.message, res.kind);
    return;
  }
  emit("play", { n: n.value, regions: cloneRegions(regions.value), solution: res.solution });
}

function save() {
  const res = evaluate();
  if (!res.ok) {
    setStatus(res.message, res.kind);
    return;
  }
  const name = prompt("Name this puzzle:", `Puzzle ${n.value}x${n.value}`);
  if (name === null) return;
  saveLevel(name.trim(), { n: n.value, regions: cloneRegions(regions.value) });
  setStatus("Saved to this browser.", "good");
}

async function share() {
  const res = evaluate();
  if (!res.ok) {
    setStatus(res.message, res.kind);
    return;
  }
  const url = shareUrl({ n: n.value, regions: cloneRegions(regions.value) });
  try {
    await navigator.clipboard.writeText(url);
    emit("toast", "Share link copied to clipboard!");
  } catch {
    prompt("Copy this link to share:", url);
  }
  setStatus("Share link ready.", "good");
}
</script>

<template>
  <section class="screen active">
    <header class="topbar">
      <button class="btn icon" title="Back to menu" @click="emit('menu')">‹</button>
      <h2 class="topbar-title">Build a puzzle</h2>
      <div></div>
    </header>

    <div class="build-row">
      <div class="field inline">
        <label for="build-size">Size</label>
        <select id="build-size" v-model.number="n">
          <option v-for="s in sizes" :key="s" :value="s">{{ s }} x {{ s }}</option>
        </select>
      </div>
      <button class="btn small" @click="generate">Auto-generate</button>
      <button class="btn small" @click="blank">Blank</button>
    </div>

    <Palette :n="n" :selected="selected" @select="(id) => (selected = id)" />

    <div class="board-wrap">
      <BoardGrid :n="n" :regions="regions" interaction="paint" @paint="paint" />
    </div>

    <p class="status" :class="statusKind">{{ statusMsg }}</p>

    <div class="controls wrap">
      <button class="btn" @click="validate">Validate</button>
      <button class="btn" @click="playThis">Play this</button>
      <button class="btn" @click="save">Save</button>
      <button class="btn" @click="share">Share link</button>
    </div>

    <p class="hint-text">
      Pick a color, then tap or drag across cells to paint regions. Each region needs exactly one queen in the unique
      solution.
    </p>
  </section>
</template>
