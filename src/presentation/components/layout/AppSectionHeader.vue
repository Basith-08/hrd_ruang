<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="app-section-title">
        {{ title }}
      </h2>
      <p v-if="description" class="app-section-description mt-1">
        {{ description }}
      </p>
      <p v-if="eyebrow" class="app-section-eyebrow mt-1">
        {{ eyebrow }}
      </p>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>()
</script>
