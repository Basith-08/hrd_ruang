<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="app-section-title-compact text-xl">{{ title }}</h3>
        <p v-if="description" class="app-copy-body mt-1">{{ description }}</p>
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <label
        v-for="field in fields"
        :key="field.key"
        class="space-y-2"
        :class="field.colSpan === 2 ? 'md:col-span-2' : ''"
      >
        <span class="app-copy-strong text-sm">{{ field.label }}</span>
        <SearchableSelect
          v-if="field.type === 'select'"
          :model-value="getSelectValue(field.model)"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :disabled="isReadOnly || field.disabled"
          show-empty-option
          :empty-label="field.emptyLabel"
          :empty-value="field.emptyValue"
          @update:model-value="updateField(field.model, $event)"
        />
        <textarea
          v-else-if="field.type === 'textarea'"
          :value="getTextValue(field.model)"
          class="candidate-form-field"
          :class="field.textareaClassName || 'min-h-24'"
          :disabled="isReadOnly || field.disabled"
          :readonly="isReadOnly || field.readonly"
          @input="updateField(field.model, ($event.target as HTMLTextAreaElement).value)"
        />
        <input
          v-else
          :value="getTextValue(field.model)"
          class="candidate-form-field"
          :type="field.type || 'text'"
          :placeholder="field.placeholder"
          :required="field.required"
          :disabled="isReadOnly || field.disabled"
          :readonly="isReadOnly || field.readonly"
          @input="updateField(field.model, ($event.target as HTMLInputElement).value)"
        />
        <p v-if="field.helperText" class="app-helper-text">
          {{ field.helperText }}
        </p>
      </label>
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import type {
  CandidateFormSimpleFieldConfig,
} from '@/features/candidateForms/types/CandidateFormPage.type'

const props = defineProps<{
  title: string
  description?: string
  form: CandidateFormRequest
  fields: CandidateFormSimpleFieldConfig[]
  isReadOnly?: boolean
}>()

function updateField(model: keyof CandidateFormRequest & string, value: unknown) {
  if (props.isReadOnly) {
    return
  }

  props.form[model] = value as never
}

function getTextValue(model: keyof CandidateFormRequest & string) {
  return String(props.form[model] ?? '')
}

function getSelectValue(model: keyof CandidateFormRequest & string) {
  return (props.form[model] ?? '') as string | number | null
}
</script>
