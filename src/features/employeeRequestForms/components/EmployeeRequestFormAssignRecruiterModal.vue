<template>
  <div class="app-modal-overlay">
    <div class="app-modal-card max-w-md p-6">
      <h3 class="app-modal-title mb-4 text-center">
        {{ text('employeeRequestForms.list.assignRecruiterModal.title') }}
      </h3>
      <p class="app-modal-description mb-6 text-center">
        {{ text('employeeRequestForms.list.assignRecruiterModal.description', { position: jobTitle }) }}
      </p>

      <form class="space-y-4" @submit.prevent="$emit('submit')">
        <label class="block space-y-2">
          <span class="app-field-label">
            {{ text('common.labels.recruiter') }} *
          </span>
          <SearchableSelect
            :model-value="modelValue"
            :options="options"
            :placeholder="text('employeeRequestForms.list.assignRecruiterModal.placeholder')"
            :disabled="saving || loading"
            show-empty-option
            :empty-label="text('employeeRequestForms.list.assignRecruiterModal.empty')"
            @update:model-value="$emit('update:modelValue', String($event ?? ''))"
          />
        </label>

        <p class="app-helper-text">
          {{ text('employeeRequestForms.list.assignRecruiterModal.helper') }}
        </p>

        <div class="mt-8 flex gap-3">
          <AppActionButton
            variant="secondary"
            class="flex-1"
            :label="text('common.actions.cancel')"
            @click="$emit('cancel')"
          />
          <AppActionButton
            type="submit"
            variant="primary"
            class="flex-1"
            :disabled="saving || loading"
            :label="saving
              ? text('common.processing')
              : text('employeeRequestForms.list.actions.assignRecruiter')"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { EmployeeRequestFormListSelectOption } from '@/features/employeeRequestForms/types/EmployeeRequestFormList.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  options: {
    type: Array as PropType<EmployeeRequestFormListSelectOption[]>,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  jobTitle: {
    type: String,
    default: '',
  },
  text: {
    type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'cancel'): void
  (event: 'submit'): void
}>()
</script>
