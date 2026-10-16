<template>
  <div>
    <AppTabs
      v-if="canChooseAccountType"
      :model-value="selectedAccountType"
      :tabs="accountTypeTabs"
      container-class="app-tabs mb-6"
      @update:model-value="$emit('update:accountType', $event as 'user' | 'candidate')"
    />

    <form class="grid gap-5 md:grid-cols-2" autocomplete="off" @submit.prevent="$emit('submit')">
      <div class="space-y-2 md:col-span-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.email') }}</AppFieldLabel>
        <AppFormInput
          v-model="form.email"
          type="email"
          required
          autocomplete="off"
          :placeholder="text('userManagement.form.placeholders.email')"
        />
      </div>

      <div v-if="!isCandidateAccount" class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.username') }}</AppFieldLabel>
        <AppFormInput
          v-model="form.username"
          type="text"
          autocomplete="off"
          :placeholder="text('userManagement.form.placeholders.username')"
        />
      </div>

      <div class="space-y-2">
        <AppFieldLabel>{{ passwordLabel }}</AppFieldLabel>
        <AppFormInput
          v-model="form.password"
          type="password"
          :required="isPasswordRequired"
          autocomplete="new-password"
          :placeholder="passwordPlaceholder"
          :helper-text="passwordHelperText"
        />
      </div>

      <div class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.fullName') }}</AppFieldLabel>
        <AppFormInput
          v-model="form.full_name"
          type="text"
          required
          autocomplete="off"
          :placeholder="text('userManagement.form.placeholders.fullName')"
        />
      </div>

      <div class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.role') }}</AppFieldLabel>
        <div
          v-if="isRoleLocked"
          class="app-field app-field-static flex min-h-12 items-center"
        >
          {{ lockedRoleLabel }}
        </div>
        <SearchableSelect
          v-else
          v-model="form.role_id"
          :options="roleSelectOptions"
          :placeholder="text('userManagement.form.placeholders.roleSearch')"
          show-empty-option
          :empty-label="text('userManagement.form.placeholders.roleEmpty')"
        />
      </div>

      <div class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.phone') }}</AppFieldLabel>
        <AppFormInput
          v-model="form.phone"
          type="tel"
          autocomplete="off"
          :placeholder="text('userManagement.form.placeholders.phone')"
        />
      </div>

      <div v-if="!isCandidateAccount" class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.costCenterPt') }}</AppFieldLabel>
        <SearchableSelect
          v-model="form.cost_center_pt_id"
          :options="ptSelectOptions"
          :placeholder="text('userManagement.form.placeholders.costCenterPtSearch')"
          show-empty-option
          :empty-label="text('userManagement.form.placeholders.costCenterPtEmpty')"
        />
      </div>

      <div v-if="isCandidateAccount" class="space-y-2 md:col-span-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.bindErf') }}</AppFieldLabel>
        <SearchableSelect
          v-model="form.employee_request_form_id"
          :options="jobBindingSelectOptions"
          :placeholder="text('userManagement.form.placeholders.erfSearch')"
          :disabled="jobLoading"
          show-empty-option
          :empty-label="text('userManagement.form.placeholders.erfEmpty')"
        />
        <p class="app-helper-text">
          {{ text('userManagement.form.fields.bindErfHelp') }}
        </p>
      </div>

      <div
        v-if="isCandidateAccount && selectedJobBinding"
        class="app-state-card app-state-card-accent app-copy-body p-4 md:col-span-2"
      >
        <p><span class="font-medium">{{ text('userManagement.form.boundLabels.department') }}</span> {{ selectedJobBinding.department || '-' }}</p>
        <p><span class="font-medium">{{ text('userManagement.form.boundLabels.designation') }}</span> {{ selectedJobBinding.designation || '-' }}</p>
        <p><span class="font-medium">{{ text('userManagement.form.boundLabels.mainPosition') }}</span> {{ selectedJobBinding.main_position || '-' }}</p>
      </div>

      <div v-if="!isCandidateAccount" class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.department') }}</AppFieldLabel>
        <SearchableSelect
          v-model="form.department_id"
          :options="departmentSelectOptions"
          :placeholder="text('userManagement.form.placeholders.departmentSearch')"
          :disabled="isStaffUser && Boolean(selectedJobBinding)"
          show-empty-option
          :empty-label="text('userManagement.form.placeholders.departmentEmpty')"
        />
      </div>

      <div v-if="!isCandidateAccount" class="space-y-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.designation') }}</AppFieldLabel>
        <SearchableSelect
          :model-value="form.master_designation_id"
          :options="designationSelectOptions"
          :placeholder="text('userManagement.form.placeholders.designationSearch')"
          :disabled="isStaffUser && Boolean(selectedJobBinding)"
          show-empty-option
          :empty-label="text('userManagement.form.placeholders.designationEmpty')"
          @update:model-value="(value) => { form.master_designation_id = value as string }"
        />
      </div>

      <div v-if="!isCandidateAccount" class="space-y-2 md:col-span-2">
        <AppFieldLabel>{{ text('userManagement.form.fields.mainPosition') }}</AppFieldLabel>
        <AppFormInput
          v-model="form.main_position"
          type="text"
          :placeholder="text('userManagement.form.placeholders.mainPosition')"
          :disabled="isStaffUser && Boolean(selectedJobBinding)"
        />
      </div>

      <div class="mt-6 flex flex-col gap-3 md:col-span-2 sm:flex-row sm:justify-end">
        <AppActionButton
          :label="text('userManagement.shared.cancel')"
          variant="secondary"
          :disabled="saving"
          @click="$emit('cancel')"
        />
        <AppActionButton
          type="submit"
          variant="primary"
          :label="submitButtonLabel"
          :disabled="saving || loading || (isEditMode && !hasTargetUser)"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useLocale } from '@/composables/useLocale'
import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type { UserFormState } from '@/features/admin/UserManagementFormPage.state'
import type { UserManagementFormSelectOption } from '@/features/admin/types/UserManagementFormPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppFieldLabel from '@/presentation/components/forms/AppFieldLabel.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import AppTabs from '@/presentation/components/navigation/AppTabs.vue'

const props = defineProps<{
  form: UserFormState
  isEditMode: boolean
  isCandidateAccount: boolean
  canChooseAccountType: boolean
  selectedAccountType: 'user' | 'candidate'
  isRoleLocked: boolean
  lockedRoleLabel: string
  roleSelectOptions: UserManagementFormSelectOption[]
  jobBindingSelectOptions: UserManagementFormSelectOption[]
  departmentSelectOptions: UserManagementFormSelectOption[]
  designationSelectOptions: UserManagementFormSelectOption[]
  ptSelectOptions: UserManagementFormSelectOption[]
  jobLoading: boolean
  isStaffUser: boolean
  selectedJobBinding: EmployeeRequestForm | null
  submitButtonLabel: string
  saving: boolean
  loading: boolean
  hasTargetUser: boolean
}>()

defineEmits<{
  (event: 'update:accountType', value: 'user' | 'candidate'): void
  (event: 'submit'): void
  (event: 'cancel'): void
}>()

const { text } = useLocale()

const accountTypeTabs = computed(() => [
  { value: 'user', label: text('userManagement.form.accountType.user') },
  { value: 'candidate', label: text('userManagement.form.accountType.candidate') },
])

const isPasswordRequired = computed(() => !props.isEditMode && !props.isCandidateAccount)

const passwordLabel = computed(() => {
  if (props.isEditMode) {
    return text('userManagement.form.fields.newPassword')
  }

  return props.isCandidateAccount
    ? text('userManagement.form.fields.passwordOptional')
    : text('userManagement.form.fields.password')
})

const passwordPlaceholder = computed(() => {
  if (props.isEditMode) {
    return text('userManagement.form.placeholders.newPassword')
  }

  return props.isCandidateAccount
    ? text('userManagement.form.placeholders.passwordOptional')
    : text('userManagement.form.placeholders.password')
})

const passwordHelperText = computed(() => {
  if (props.isEditMode) {
    return text('userManagement.form.fields.passwordHelp')
  }

  return props.isCandidateAccount
    ? text('userManagement.form.fields.passwordOptionalHelp')
    : ''
})
</script>
