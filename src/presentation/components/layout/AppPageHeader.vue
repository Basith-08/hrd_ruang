<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p v-if="eyebrow" class="app-page-eyebrow">
        {{ eyebrow }}
      </p>
      <h1 class="app-page-title" :class="eyebrow ? 'mt-3' : ''">
        {{ title }}
      </h1>
      <p v-if="description" class="app-page-description mt-2">
        {{ description }}
      </p>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>
