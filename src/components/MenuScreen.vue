<script setup lang="ts">
import { onMounted, ref } from "vue";
import { MAX_N, MIN_N } from "../core/board";
import { generateLevel } from "../core/generator";
import { deleteSavedLevel, loadSavedLevels, type SavedLevel } from "../core/storage";
import type { Level } from "../core/types";

const emit = defineEmits<{
  (e: "play", level: Level): void;
  (e: "build", n: number): void;
  (e: "how"): void;
  (e: "toast", msg: string): void;
}>();

const size = ref(7);
const sizes = Array.from({ length: MAX_N - MIN_N + 1 }, (_, i) => MIN_N + i);
const saved = ref<SavedLevel[]>([]);

onMounted(() => {
  saved.value = loadSavedLevels();
});

function playRandom() {
  try {
    emit("play", generateLevel(size.value));
  } catch (e) {
    emit("toast", (e as Error).message);
  }
}

function playSaved(lvl: SavedLevel) {
  emit("play", { n: lvl.n, regions: lvl.regions });
}

function remove(i: number) {
  deleteSavedLevel(i);
  saved.value = loadSavedLevels();
}
</script>

<template>
  <section class="screen active">
    <div class="menu-card">
      <h1 class="logo">♛ Queens</h1>
      <p class="tagline">One queen per row, column, and color. None may touch diagonally.</p>

      <div class="field">
        <label for="menu-size">Board size</label>
        <select id="menu-size" v-model.number="size">
          <option v-for="s in sizes" :key="s" :value="s">{{ s }} x {{ s }}</option>
        </select>
      </div>

      <div class="menu-actions">
        <button class="btn primary" @click="playRandom">Play a random puzzle</button>
        <button class="btn" @click="emit('build', size)">Build a puzzle</button>
        <button class="btn ghost" @click="emit('how')">How to play</button>
      </div>

      <div class="saved-list">
        <template v-if="saved.length">
          <p class="muted">Your saved puzzles</p>
          <div v-for="(lvl, i) in saved" :key="lvl.savedAt" class="saved-item">
            <button class="name btn ghost" @click="playSaved(lvl)">
              {{ lvl.name }} ({{ lvl.n }}x{{ lvl.n }})
            </button>
            <button class="del" title="Delete" @click="remove(i)">×</button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
