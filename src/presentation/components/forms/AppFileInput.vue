<template>
  <input
    class="app-field app-file-input"
    type="file"
    :multiple="multiple"
    :accept="accept"
    :disabled="disabled"
    @change="$emit('change', $event)"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    accept?: string
    multiple?: boolean
    disabled?: boolean
  }>(),
  {
    accept: '',
    multiple: false,
    disabled: false,
  },
)

defineEmits<{
  (event: 'change', value: Event): void
}>()
</script>
