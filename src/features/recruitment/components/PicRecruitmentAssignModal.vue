<template>
  <div class="app-modal-overlay">
    <div class="app-modal-card max-w-lg p-6">
      <h3 class="app-modal-title mb-2 text-center">
        {{ text('picRecruitment.modal.title') }}
      </h3>
      <p class="app-modal-description mb-6 text-center">
        {{ text('picRecruitment.modal.description') }}
      </p>

      <form class="space-y-4" @submit.prevent="$emit('submit')">
        <label class="block space-y-2">
          <span class="app-copy-strong text-sm">
            {{ text('common.labels.employeeRequestForm') }} *
          </span>
          <SearchableSelect
            :model-value="selectedEmployeeRequestFormId"
            :options="employeeRequestFormOptions"
            :placeholder="text('picRecruitment.modal.employeeRequestFormPlaceholder')"
            :disabled="saving"
            show-empty-option
            :empty-label="text('picRecruitment.modal.employeeRequestFormEmpty')"
            @update:model-value="$emit('update:selectedEmployeeRequestFormId', String($event ?? ''))"
          />
        </label>

        <label class="block space-y-2">
          <span class="app-copy-strong text-sm">
            {{ text('common.labels.recruiter') }} *
          </span>
          <SearchableSelect
            :model-value="selectedRecruiterUserId"
            :options="recruiterOptions"
            :placeholder="text('picRecruitment.modal.recruiterPlaceholder')"
            :disabled="saving || loadingRecruiters"
            show-empty-option
            :empty-label="text('picRecruitment.modal.recruiterEmpty')"
            @update:model-value="$emit('update:selectedRecruiterUserId', String($event ?? ''))"
          />
        </label>

        <div class="mt-8 flex gap-3">
          <button
            type="button"
            class="app-button app-button-secondary flex-1 py-3"
            @click="$emit('cancel')"
          >
            {{ text('common.actions.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="saving || loadingRecruiters"
            class="app-button app-button-primary flex-1 py-3"
          >
            {{ saving ? text('common.processing') : text('picRecruitment.actions.assignRecruiter') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { EmployeeRequestFormListSelectOption } from '@/features/employeeRequestForms/types/EmployeeRequestFormList.type'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'

defineProps({
  selectedEmployeeRequestFormId: {
    type: String,
    required: true,
  },
  selectedRecruiterUserId: {
    type: String,
    required: true,
  },
  employeeRequestFormOptions: {
    type: Array as PropType<EmployeeRequestFormListSelectOption[]>,
    default: () => [],
  },
  recruiterOptions: {
    type: Array as PropType<EmployeeRequestFormListSelectOption[]>,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
  loadingRecruiters: {
    type: Boolean,
    default: false,
  },
  text: {
    type: Function as PropType<(key: string, params?: Record<string, string | number>) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:selectedEmployeeRequestFormId', value: string): void
  (event: 'update:selectedRecruiterUserId', value: string): void
  (event: 'cancel'): void
  (event: 'submit'): void
}>()
</script>
