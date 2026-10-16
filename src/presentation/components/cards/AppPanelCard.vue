<template>
  <div :class="containerClassName">
    <template v-if="$slots.header">
      <slot name="header" />
    </template>
    <p v-else-if="title" :class="titleClassName">
      {{ title }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  containerClass?: string
  titleClass?: string
}>(), {
  title: '',
  containerClass: '',
  titleClass: '',
})

const containerClassName = computed(() => [
  'app-panel',
  props.containerClass,
])

const titleClassName = computed(() => [
  'app-panel-title',
  props.titleClass,
])
</script>
