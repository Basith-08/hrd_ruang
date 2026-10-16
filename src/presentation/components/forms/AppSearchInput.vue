<template>
  <input
    :value="modelValue"
    type="search"
    :placeholder="placeholder"
    :disabled="disabled"
    class="app-field app-field-search"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()
</script>
