<script setup lang="ts">
import { watch } from "vue";
import BoardGrid from "./BoardGrid.vue";
import Overlay from "./Overlay.vue";
import { useGame } from "../composables/useGame";
import type { Level } from "../core/types";

const props = defineProps<{ level: Level | null }>();
const emit = defineEmits<{
  (e: "menu"): void;
  (e: "toast", msg: string): void;
}>();

const game = useGame();

watch(
  () => props.level,
  (lvl) => {
    if (lvl) game.start(lvl);
  },
  { immediate: true }
);

function onHint() {
  const msg = game.hint();
  if (msg) emit("toast", msg);
}

function onNew() {
  try {
    game.newPuzzle();
  } catch (e) {
    emit("toast", (e as Error).message);
  }
}

function backToMenu() {
  game.stopTimer();
  emit("menu");
}
</script>

<template>
  <section class="screen active">
    <header class="topbar">
      <button class="btn icon" title="Back to menu" @click="backToMenu">‹</button>
      <h2 class="topbar-title">Queens</h2>
      <div class="timer">{{ game.timeLabel.value }}</div>
    </header>

    <div class="controls">
      <button
        class="btn toggle"
        :class="{ active: game.autoMark.value }"
        @click="game.toggleAutoMark"
      >
        Auto-mark: {{ game.autoMark.value ? "On" : "Off" }}
      </button>
    </div>

    <div class="board-wrap">
      <BoardGrid
        :n="game.n.value"
        :regions="game.regions.value"
        :marks="game.displayMarks.value"
        :violations="game.violations.value"
        :auto-cells="game.autoCells.value"
        interaction="play"
        @cellclick="game.cycle"
        @swipestart="game.beginStroke"
        @swipe="game.strokeCross"
      />
    </div>

    <p class="status" :class="game.statusKind.value">{{ game.statusText.value }}</p>

    <div class="controls">
      <button class="btn" @click="game.undo">Undo</button>
      <button class="btn" @click="onHint">Hint</button>
      <button class="btn" @click="game.clear">Clear</button>
      <button class="btn" @click="onNew">New</button>
    </div>

    <p class="hint-text">
      Tap a cell to cycle: empty → ✕ note → ♛ queen → empty. Swipe across cells to place ✕ marks.
    </p>

    <Overlay :open="game.won.value" @close="() => {}">
      <h2>Solved! ♛</h2>
      <p>Time: {{ game.timeLabel.value }}</p>
      <div class="controls">
        <button class="btn primary" @click="onNew">New puzzle</button>
        <button class="btn" @click="backToMenu">Menu</button>
      </div>
    </Overlay>
  </section>
</template>
