<script setup lang="ts">
defineProps<{ message: string; show: boolean }>();
</script>

<template>
  <div class="toast" :class="{ show }">{{ message }}</div>
</template>
