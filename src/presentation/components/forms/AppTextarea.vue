<template>
  <textarea
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    class="app-field app-field-textarea"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    rows?: number | string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    rows: 4,
    placeholder: '',
    disabled: false,
  },
)

defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()
</script>
