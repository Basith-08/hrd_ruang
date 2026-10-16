<template>
  <div :class="gridClass">
    <label
      v-for="field in fields"
      :key="field.key"
      class="space-y-2"
      :class="fieldColSpanClass(field.colSpan)"
    >
      <span class="app-copy-strong text-sm">{{ field.label }}</span>
      <SearchableSelect
        v-if="field.type === 'select'"
        :model-value="getSelectValue(field)"
        :options="field.options ?? []"
        :placeholder="field.placeholder"
        :disabled="isReadOnly || field.disabled"
        show-empty-option
        :empty-label="field.emptyLabel"
        :empty-value="field.emptyValue"
        @update:model-value="updateField(field, $event)"
      />
      <textarea
        v-else-if="field.type === 'textarea'"
        :value="getDisplayValue(field)"
        class="candidate-form-field"
        :class="field.textareaClassName || 'min-h-24'"
        :disabled="isReadOnly || field.disabled"
        :readonly="isReadOnly || field.readonly"
        @input="updateField(field, ($event.target as HTMLTextAreaElement).value)"
      />
      <input
        v-else
        :value="getDisplayValue(field)"
        class="candidate-form-field"
        :class="field.inputClassName"
        :type="field.type || 'text'"
        :placeholder="field.placeholder"
        :disabled="isReadOnly || field.disabled"
        :readonly="isReadOnly || field.readonly"
        :min="field.min"
        :step="field.step"
        @input="updateField(field, ($event.target as HTMLInputElement).value)"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import type { CandidateFormObjectFieldConfig } from '@/features/candidateForms/types/CandidateFormPage.type'

const props = defineProps({
  item: {
    type: Object as PropType<object>,
    required: true,
  },
  fields: {
    type: Array as PropType<CandidateFormObjectFieldConfig[]>,
    default: () => [],
  },
  gridClass: {
    type: String,
    default: 'grid gap-4 md:grid-cols-2',
  },
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  sanitizeNestedNumberField: {
    type: Function as PropType<(target: object, key: string) => void>,
    default: null,
  },
})

function fieldColSpanClass(colSpan?: number) {
  if (colSpan === 2) return 'md:col-span-2'
  if (colSpan === 4) return 'md:col-span-4'
  return ''
}

function getFieldValue(field: CandidateFormObjectFieldConfig) {
  if (!field.model) {
    return field.value ?? ''
  }

  const itemRecord = props.item as Record<string, unknown>
  return itemRecord[field.model] ?? ''
}

function getDisplayValue(field: CandidateFormObjectFieldConfig) {
  const value = getFieldValue(field)
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function getSelectValue(field: CandidateFormObjectFieldConfig) {
  const value = getFieldValue(field)
  return (value ?? '') as string | number | null
}

function updateField(field: CandidateFormObjectFieldConfig, rawValue: unknown) {
  if (!field.model || field.readonly || props.isReadOnly) {
    return
  }

  const itemRecord = props.item as Record<string, unknown>

  if (field.type === 'number') {
    const normalizedValue =
      rawValue === '' || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue)
    itemRecord[field.model] = normalizedValue
    props.sanitizeNestedNumberField?.(props.item, field.model)
    return
  }

  itemRecord[field.model] = rawValue
}
</script>
