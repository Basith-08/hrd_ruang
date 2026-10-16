<template>
  <div class="space-y-2">
    <div
      class="app-field app-field-multiselect"
    >
      <ul v-if="selectedOptions.length > 0" class="space-y-1">
        <li
          v-for="option in selectedOptions"
          :key="String(option.value)"
          class="flex items-center justify-between gap-3 rounded-lg px-1.5 py-0.5"
        >
          <span class="min-w-0 flex-1 break-words">{{ option.label }}</span>
          <button
            type="button"
            class="app-icon-button-subtle"
            :disabled="disabled"
            :aria-label="removeLabel"
            :title="removeLabel"
            @click="removeOption(option.value)"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <p v-else class="app-table-muted">
        {{ emptyLabel }}
      </p>
    </div>

    <SearchableSelect
      :model-value="pendingValue"
      :options="availableOptions"
      :disabled="disabled || availableOptions.length === 0"
      :placeholder="placeholder"
      show-empty-option
      :empty-label="placeholder"
      @update:model-value="addOption"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'

import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

type AppMultiSelectOption = {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue?: string[]
  options?: Array<AppMultiSelectOption | string>
  disabled?: boolean
  placeholder?: string
  emptyLabel?: string
  removeLabel?: string
}>(), {
  modelValue: () => [],
  options: () => [],
  disabled: false,
  placeholder: 'Select item',
  emptyLabel: '-',
  removeLabel: 'Remove',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()
const pendingValue = ref('')

const normalizedOptions = computed<AppMultiSelectOption[]>(() =>
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

const selectedValueSet = computed(() => new Set(props.modelValue))
const selectedOptions = computed(() =>
  props.modelValue.map((value) =>
    normalizedOptions.value.find((option) => option.value === value) ?? {
      value,
      label: value,
    },
  ),
)
const availableOptions = computed(() =>
  normalizedOptions.value.filter((option) => !selectedValueSet.value.has(option.value)),
)

function addOption(value: string | number | null) {
  const normalizedValue = typeof value === 'string' ? value : ''
  pendingValue.value = ''

  if (!normalizedValue || selectedValueSet.value.has(normalizedValue)) return

  emit('update:modelValue', [...props.modelValue, normalizedValue])
}

function removeOption(value: string) {
  emit('update:modelValue', props.modelValue.filter((selectedValue) => selectedValue !== value))
}

</script>
