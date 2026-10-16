<template>
  <span class="app-field-label">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>
