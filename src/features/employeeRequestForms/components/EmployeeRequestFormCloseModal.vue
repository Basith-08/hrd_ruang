<template>
  <div class="app-modal-overlay">
    <div class="app-modal-card max-w-lg overflow-hidden">
      <div class="app-modal-header">
        <h3 class="app-modal-title text-center">
          {{ text('employeeRequestForms.list.modal.title') }}
        </h3>
        <p class="app-modal-description mt-3 text-center">
          {{ text('employeeRequestForms.list.modal.description') }}
        </p>
      </div>

      <form class="app-modal-form" @submit.prevent="$emit('submit')">
        <div class="space-y-4">
          <label class="block space-y-2">
            <span class="app-field-label">{{ text('common.labels.category') }}</span>
            <select
              class="app-field"
              :value="modelValue.category"
              :disabled="saving"
              @change="updateField('category', ($event.target as HTMLSelectElement).value)"
            >
              <option value="canceled">
                {{ text('employeeRequestForms.list.closeCategory.canceled') }}
              </option>
              <option value="done">
                {{ text('employeeRequestForms.list.closeCategory.done') }}
              </option>
            </select>
          </label>

          <label class="block space-y-2">
            <span class="app-field-label">{{ text('common.labels.reason') }} *</span>
            <AppTextarea
              :value="modelValue.reason"
              :rows="5"
              :placeholder="text('employeeRequestForms.list.modal.reasonPlaceholder')"
              :disabled="saving"
              @update:model-value="updateField('reason', $event)"
            />
          </label>
        </div>

        <div class="app-modal-footer">
          <AppActionButton
            variant="secondary"
            class="min-w-[132px]"
            :label="text('common.actions.cancel')"
            @click="$emit('cancel')"
          />
          <AppActionButton
            type="submit"
            variant="danger"
            class="min-w-[156px]"
            :disabled="saving"
            :label="saving ? text('employeeRequestForms.list.actions.closing') : text('employeeRequestForms.list.actions.closeErf')"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { EmployeeRequestFormCloseState } from '@/features/employeeRequestForms/EmployeeRequestFormList.state'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppTextarea from '@/presentation/components/forms/AppTextarea.vue'

const props = defineProps({
  modelValue: {
    type: Object as PropType<EmployeeRequestFormCloseState>,
    required: true,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: EmployeeRequestFormCloseState): void
  (event: 'cancel'): void
  (event: 'submit'): void
}>()

function updateField(field: keyof EmployeeRequestFormCloseState, value: unknown) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: field === 'category' ? String(value ?? '') : value,
  })
}
</script>
