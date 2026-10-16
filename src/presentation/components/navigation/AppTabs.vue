<template>
  <div
    :class="containerClass"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="String(tab.value)"
      type="button"
      role="tab"
      :class="[tabClass, modelValue === tab.value ? activeClass : inactiveClass]"
      :aria-selected="modelValue === tab.value"
      :disabled="tab.disabled"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
type AppTabValue = string | number

type AppTabItem = {
  value: AppTabValue
  label: string
  disabled?: boolean
}

withDefaults(
  defineProps<{
    modelValue: AppTabValue
    tabs: AppTabItem[]
    containerClass?: string
    tabClass?: string
    activeClass?: string
    inactiveClass?: string
  }>(),
  {
    containerClass: 'app-tabs',
    tabClass: 'app-tab',
    activeClass: 'app-tab-active',
    inactiveClass: 'app-tab-inactive',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: AppTabValue): void
}>()
</script>
