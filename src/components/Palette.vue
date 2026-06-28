<script setup lang="ts">
import { regionColor } from "../colors";

defineProps<{
  n: number;
  selected: number;
}>();

const emit = defineEmits<{
  (e: "select", id: number): void;
}>();
</script>

<template>
  <div class="palette">
    <button
      v-for="id in n"
      :key="id - 1"
      type="button"
      class="swatch"
      :class="{ selected: selected === id - 1 }"
      :style="{ background: regionColor(id - 1) }"
      :title="`Region ${id}`"
      @click="emit('select', id - 1)"
    ></button>
  </div>
</template>
