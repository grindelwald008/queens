<script setup lang="ts">
import { onMounted, ref } from "vue";
import MenuScreen from "./components/MenuScreen.vue";
import PlayScreen from "./components/PlayScreen.vue";
import BuildScreen from "./components/BuildScreen.vue";
import Overlay from "./components/Overlay.vue";
import Toast from "./components/Toast.vue";
import { levelFromHash } from "./core/storage";
import type { Level } from "./core/types";

type Screen = "menu" | "play" | "build";

const screen = ref<Screen>("menu");
const currentLevel = ref<Level | null>(null);
const buildN = ref(7);
const howOpen = ref(false);

const toastMsg = ref("");
const toastShow = ref(false);
let toastTimer: number | null = null;

function showToast(msg: string) {
  toastMsg.value = msg;
  toastShow.value = true;
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toastShow.value = false), 2200);
}

function startPlay(level: Level) {
  currentLevel.value = level;
  screen.value = "play";
}

function startBuild(n: number) {
  buildN.value = n;
  screen.value = "build";
}

function goMenu() {
  screen.value = "menu";
}

onMounted(() => {
  const shared = levelFromHash();
  if (shared) startPlay(shared);
});
</script>

<template>
  <MenuScreen
    v-if="screen === 'menu'"
    @play="startPlay"
    @build="startBuild"
    @how="howOpen = true"
    @toast="showToast"
  />

  <PlayScreen
    v-else-if="screen === 'play' && currentLevel"
    :level="currentLevel"
    @menu="goMenu"
    @toast="showToast"
  />

  <BuildScreen
    v-else-if="screen === 'build'"
    :initial-n="buildN"
    @play="startPlay"
    @menu="goMenu"
    @toast="showToast"
  />

  <Overlay :open="howOpen" @close="howOpen = false">
    <h2>How to play</h2>
    <ul class="rules">
      <li>The board is an N×N grid split into N colored regions.</li>
      <li>Place exactly one ♛ in every row.</li>
      <li>Place exactly one ♛ in every column.</li>
      <li>Place exactly one ♛ in every color region.</li>
      <li>No two queens may touch — not even diagonally.</li>
    </ul>
    <p class="muted">Tap a cell to cycle empty → ✕ (your note) → ♛ → empty.</p>
    <div class="controls">
      <button class="btn primary" @click="howOpen = false">Got it</button>
    </div>
  </Overlay>

  <Toast :message="toastMsg" :show="toastShow" />
</template>
