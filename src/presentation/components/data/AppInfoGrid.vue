<template>
  <div :class="gridClassName">
    <div
      v-for="field in fields"
      :key="field.key ?? field.label"
      :class="itemClassName"
    >
      <p :class="labelClassName">{{ field.label }}</p>
      <p :class="valueClassName">{{ field.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface AppInfoGridField {
  key?: string
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  fields: AppInfoGridField[]
  gridClass?: string
  itemClass?: string
  labelClass?: string
  valueClass?: string
}>(), {
  gridClass: '',
  itemClass: '',
  labelClass: '',
  valueClass: '',
})

const gridClassName = computed(() => [
  'grid gap-3 md:grid-cols-2',
  props.gridClass,
])

const itemClassName = computed(() => [
  'app-info-grid-item',
  props.itemClass,
])

const labelClassName = computed(() => [
  'app-info-grid-label',
  props.labelClass,
])

const valueClassName = computed(() => [
  'app-info-grid-value',
  props.valueClass,
])
</script>
