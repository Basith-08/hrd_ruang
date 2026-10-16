<template>
  <div :class="containerClassName">
    <div class="relative z-10">
      <p :class="labelClassName">
        {{ label }}
      </p>
      <div class="mt-4">
        <span :class="valueClassName">{{ value }}</span>
      </div>
    </div>

    <p v-if="description" :class="descriptionClassName">
      {{ description }}
    </p>

    <div
      v-if="showDecoration"
      class="app-metric-decoration absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  description?: string
  containerClass?: string
  labelClass?: string
  valueClass?: string
  descriptionClass?: string
  showDecoration?: boolean
}>(), {
  description: '',
  containerClass: '',
  labelClass: '',
  valueClass: '',
  descriptionClass: '',
  showDecoration: true,
})

const containerClassName = computed(() => [
  'relative flex flex-col justify-between overflow-hidden rounded-2xl px-6 py-6 shadow-sm',
  props.containerClass,
])

const labelClassName = computed(() => [
  'app-metric-label',
  props.labelClass,
])

const valueClassName = computed(() => [
  'app-metric-value',
  props.valueClass,
])

const descriptionClassName = computed(() => [
  'app-metric-description',
  props.descriptionClass,
])
</script>
