<template>
  <div
    v-if="role"
    class="app-surface-card px-4 py-2"
  >
    <p class="app-table-muted text-[10px] uppercase tracking-[0.2em]">
      {{ label }}
    </p>
    <p class="app-page-eyebrow text-sm font-bold">{{ role }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  role?: string | null
  label: string
}>()
</script>
