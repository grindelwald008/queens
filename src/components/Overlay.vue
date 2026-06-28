<script setup lang="ts">
defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();
</script>

<template>
  <div v-if="open" class="overlay active" @click.self="emit('close')">
    <div class="overlay-card">
      <slot />
    </div>
  </div>
</template>
