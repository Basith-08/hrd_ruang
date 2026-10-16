<template>
  <template v-for="field in fields" :key="field.key">
    <div
      v-if="isSectionStart(field.key)"
      class="app-form-section-header md:col-span-2"
      :class="isFirstField(field.key) ? 'app-form-section-header-first' : ''"
    >
      <span class="app-form-section-icon" aria-hidden="true">
        <svg v-if="getSectionMeta(field.section).icon === 'building'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 21h16" />
          <path d="M7 21V7l5-3 5 3v14" />
          <path d="M9 10h.01M9 13h.01M9 16h.01M15 10h.01M15 13h.01M15 16h.01" />
        </svg>
        <svg v-else-if="getSectionMeta(field.section).icon === 'briefcase'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M3 12h18" />
        </svg>
        <svg v-else-if="getSectionMeta(field.section).icon === 'pin'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <div class="app-form-section-line">
        <span class="app-form-section-title">{{ text(getSectionMeta(field.section).titleKey) }}</span>
      </div>
    </div>

    <label class="space-y-2" :class="field.colSpan === 2 ? 'md:col-span-2' : ''">
      <span class="app-field-label">{{ field.label }}</span>
      <template v-if="field.type === 'select'">
        <SearchableSelect
          :model-value="getFieldValue(field)"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :disabled="isFormDisabled || field.disabled"
          show-empty-option
          :empty-label="field.emptyLabel"
          :empty-value="field.emptyValue"
          @update:model-value="updateField(field, $event)"
        />
        <p v-if="field.helperText" class="app-helper-text">
          {{ field.helperText }}
        </p>
        <p v-if="field.warningText" class="app-warning-text">
          {{ field.warningText }}
        </p>
        <p v-if="field.errorText" class="app-error-text">
          {{ field.errorText }}
        </p>
      </template>
      <AppFormInput
        v-else
        :model-value="getFieldValue(field)"
        :type="field.type"
        :required="field.required"
        :min="field.min"
        :placeholder="field.placeholder"
        :disabled="isFormDisabled || field.disabled"
        :helper-text="field.helperText"
        :warning-text="field.warningText"
        :error-text="field.errorText"
        @update:model-value="updateField(field, $event)"
      />
    </label>
  </template>

  <div class="app-form-section-header md:col-span-2">
    <span class="app-form-section-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
      </svg>
    </span>
    <div class="app-form-section-line">
      <span class="app-form-section-title">{{ text('employeeRequestForms.form.sections.documents') }}</span>
    </div>
  </div>

  <slot name="before-custom-groups" />

  <template v-if="customGroupFields.length > 0">
    <div class="app-form-section-header md:col-span-2">
      <span class="app-form-section-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <div class="app-form-section-line">
        <span class="app-form-section-title">{{ text('employeeRequestForms.form.sections.customGroups') }}</span>
      </div>
    </div>

    <label v-for="item in customGroupFields" :key="item.index" class="space-y-2">
      <span class="app-field-label">{{ text('employeeRequestForms.form.fields.customGroup', { index: item.index }) }}</span>
      <SearchableSelect
        :model-value="item.modelValue"
        :options="item.options"
        :placeholder="text('employeeRequestForms.form.placeholders.searchCustomGroup', { index: item.index })"
        :disabled="isFormDisabled"
        show-empty-option
        :empty-label="text('common.select.default')"
        :empty-value="null"
        @update:model-value="item.update($event)"
      />
    </label>
  </template>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import type { EmployeeRequestFormSelectOption } from '@/features/employeeRequestForms/types/EmployeeRequestFormPage.type'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

type EmployeeRequestFormFieldType = 'text' | 'number' | 'date' | 'select'
type EmployeeRequestFormFieldValue = string | number | null
type EmployeeRequestFormSection = 'organization' | 'position' | 'location'
type EmployeeRequestFormFieldModel = {
  [Key in keyof EmployeeRequestFormRequest]: EmployeeRequestFormRequest[Key] extends EmployeeRequestFormFieldValue | undefined ? Key : never
}[keyof EmployeeRequestFormRequest] & string

export interface EmployeeRequestFormFieldConfig {
  key: string
  model?: EmployeeRequestFormFieldModel
  section: EmployeeRequestFormSection
  label: string
  type: EmployeeRequestFormFieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: string | number
  colSpan?: 1 | 2
  options?: EmployeeRequestFormSelectOption[]
  emptyLabel?: string
  emptyValue?: EmployeeRequestFormFieldValue
  value?: EmployeeRequestFormFieldValue
  helperText?: string
  warningText?: string
  errorText?: string
  update?: (value: EmployeeRequestFormFieldValue) => void
}

export interface EmployeeRequestFormCustomGroupField {
  index: number
  modelValue: string | null
  options: EmployeeRequestFormSelectOption[]
  update: (value: EmployeeRequestFormFieldValue) => void
}

const props = defineProps({
  form: {
    type: Object as PropType<EmployeeRequestFormRequest>,
    required: true,
  },
  fields: {
    type: Array as PropType<EmployeeRequestFormFieldConfig[]>,
    default: () => [],
  },
  customGroupFields: {
    type: Array as PropType<EmployeeRequestFormCustomGroupField[]>,
    default: () => [],
  },
  isFormDisabled: {
    type: Boolean,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    required: true,
  },
  sanitizeNumberField: {
    type: Function as PropType<(target: Record<string, any>, field: string) => void>,
    required: true,
  },
})

function isSectionStart(fieldKey: string) {
  const index = props.fields.findIndex((field) => field.key === fieldKey)
  if (index <= 0) return true

  return props.fields[index - 1]?.section !== props.fields[index]?.section
}

function isFirstField(fieldKey: string) {
  return props.fields.findIndex((field) => field.key === fieldKey) === 0
}

function getSectionMeta(section: EmployeeRequestFormSection) {
  switch (section) {
    case 'organization':
      return { titleKey: 'employeeRequestForms.form.sections.organization', icon: 'building' as const }
    case 'position':
      return { titleKey: 'employeeRequestForms.form.sections.position', icon: 'briefcase' as const }
    case 'location':
      return { titleKey: 'employeeRequestForms.form.sections.location', icon: 'pin' as const }
    default:
      return { titleKey: 'employeeRequestForms.form.sections.organization', icon: 'building' as const }
  }
}

function getFieldValue(field: EmployeeRequestFormFieldConfig): EmployeeRequestFormFieldValue {
  if (!field.model) {
    return field.value ?? ''
  }

  return props.form[field.model] ?? field.emptyValue ?? ''
}

function updateField(field: EmployeeRequestFormFieldConfig, value: EmployeeRequestFormFieldValue) {
  if (props.isFormDisabled) {
    return
  }

  if (field.update) {
    field.update(value)
    return
  }

  if (!field.model) {
    return
  }

  const formRecord = props.form as unknown as Record<string, unknown>
  formRecord[field.model] = field.type === 'number' && value !== '' && value !== null
    ? Number(value)
    : value

  if (field.type === 'number') {
    props.sanitizeNumberField(formRecord as Record<string, any>, field.model)
  }
}
</script>
