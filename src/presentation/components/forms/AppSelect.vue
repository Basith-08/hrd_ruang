<template>
  <select
    :value="String(modelValue ?? '')"
    :class="selectClass"
    :disabled="disabled"
    @change="handleChange"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option
      v-for="option in normalizedOptions"
      :key="String(option.value)"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AppSelectValue = string | number | null
type AppSelectOption = {
  value: string | number
  label: string | number
}

const props = withDefaults(defineProps<{
  modelValue?: AppSelectValue
  options?: Array<AppSelectOption | string | number>
  placeholder?: string
  disabled?: boolean
  selectClass?: string
}>(), {
  modelValue: '',
  options: () => [],
  placeholder: '',
  disabled: false,
  selectClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
}>()

const normalizedOptions = computed<AppSelectOption[]>(() =>
  props.options.map((option) => {
    if (typeof option === 'object') {
      return option
    }

    return {
      value: option,
      label: option,
    }
  }),
)

const selectClass = computed(() => [
  'app-field',
  props.selectClass,
])

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', event)
}
</script>
