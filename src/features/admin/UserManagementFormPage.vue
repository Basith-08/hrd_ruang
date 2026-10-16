<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-8">
    <div class="flex items-center gap-4">
      <AppActionButton
        variant="icon"
        :label="text('common.actions.back')"
        @click="router.back()"
      >
        ←
      </AppActionButton>
      <div>
        <p class="app-page-eyebrow">
          {{ pageEyebrow }}
        </p>
        <h1 class="app-page-title mt-1">
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <AppAlert v-if="error" :message="error" />

    <AppAlert
      v-if="isEditMode && !targetUser && !loading"
      :message="text('userManagement.form.userNotFound')"
      variant="warning"
    />

    <AppPanelCard>
      <UserManagementFormFields
        :form="form"
        :is-edit-mode="isEditMode"
        :is-candidate-account="isCandidateAccount"
        :can-choose-account-type="canChooseAccountType"
        :selected-account-type="selectedAccountType"
        :is-role-locked="isRoleLocked"
        :locked-role-label="lockedRoleLabel"
        :role-select-options="roleSelectOptions"
        :job-binding-select-options="jobBindingSelectOptions"
        :department-select-options="departmentSelectOptions"
        :designation-select-options="designationSelectOptions"
        :pt-select-options="ptSelectOptions"
        :job-loading="jobLoading"
        :is-staff-user="isStaffUser"
        :selected-job-binding="selectedJobBinding"
        :submit-button-label="submitButtonLabel"
        :saving="saving"
        :loading="loading"
        :has-target-user="Boolean(targetUser)"
        @update:account-type="setAccountType"
        @cancel="router.back()"
        @submit="handleSubmit"
      />

      <UserManagementCreatedSummary v-if="!isEditMode" :created="lastCreated" />
    </AppPanelCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import { useLocale } from '@/composables/useLocale'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import type { CreateUserRequest, UpdateUserRequest } from '@/domain/requests/ManagedUserRequest'
import {
  createUserManagementFormState,
  type CreatedUserSummaryState,
  type UserFormState,
} from '@/features/admin/UserManagementFormPage.state'
import type { UserManagementFormSelectOption } from '@/features/admin/types/UserManagementFormPage.type'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'
import { useMasterDataViewModel } from '@/viewmodels/useMasterDataViewModel'
import { useUserManagementViewModel } from '@/viewmodels/useUserManagementViewModel'
import type { RecruitmentFlowStage } from '@/domain/entities/EmployeeRequestForm'
import UserManagementCreatedSummary from './components/UserManagementCreatedSummary.vue'
import UserManagementFormFields from './components/UserManagementFormFields.vue'

const router = useRouter()
const route = useRoute()
const { roles, users, loading, error, saving, createUser, updateUser, refreshUsers, refreshRoles } =
  useUserManagementViewModel({
    autoLoadUsers: false,
    autoLoadRoles: false,
    autoLoadHistory: false,
  })
const { userRole } = useAuthViewModel()
const { jobs, loading: jobLoading, refresh: refreshJobs } = useEmployeeRequestFormViewModel({ autoLoad: false })
const { optionsByType, loadOptions, loadAllOptions } = useMasterDataViewModel()
const appToast = useAppToast()
const { text } = useLocale()

const lastCreated = ref<CreatedUserSummaryState | null>(null)
const editUserId = computed(() => String(route.params.id ?? ''))
const isEditMode = computed(() => Boolean(editUserId.value))
const targetUser = computed(() => users.value.find((user) => user.id === editUserId.value) ?? null)
const isStaffUser = computed(() => normalizeRole(userRole.value).startsWith('staff'))
const requestedRoleName = computed(() => normalizeRole(route.query.role))
const candidateRole = computed(
  () => roles.value.find((role) => normalizeRole(role.name) === 'candidate') ?? null,
)
const selectedAccountType = ref<'user' | 'candidate'>(getInitialAccountType())
const canChooseAccountType = computed(() => !isEditMode.value && !isStaffUser.value)
const isCandidateAccount = computed(() => {
  if (isEditMode.value) {
    return normalizeRole(targetUser.value?.role) === 'candidate'
  }

  if (isStaffUser.value) return true
  if (!isEditMode.value && selectedAccountType.value === 'candidate') return true

  const selectedRole = roles.value.find((role) => role.id === form.role_id) ?? null
  return normalizeRole(selectedRole?.name) === 'candidate'
})
const shouldLoadCandidateBindings = computed(() => isStaffUser.value || isCandidateAccount.value)
const isRoleLocked = computed(
  () =>
    isStaffUser.value
    || targetUser.value?.account_source === 'candidate_service'
    || (isEditMode.value && normalizeRole(targetUser.value?.role) === 'candidate'),
)
const lockedRoleLabel = computed(() => {
  if (targetUser.value?.role) {
    return targetUser.value.role
  }

  return candidateRole.value?.name || text('userManagement.shared.candidate')
})
const pageEyebrow = computed(() => {
  if (isStaffUser.value) return text('userManagement.form.eyebrow.staff')
  if (isEditMode.value) return text('userManagement.form.eyebrow.admin')
  return text('userManagement.form.eyebrow.registration')
})
const pageTitle = computed(() => {
  if (isEditMode.value) {
    return isCandidateAccount.value
      ? text('userManagement.form.title.editCandidate')
      : text('userManagement.form.title.editUser')
  }

  return isCandidateAccount.value
    ? text('userManagement.form.title.createCandidate')
    : text('userManagement.form.title.createUser')
})
const submitButtonLabel = computed(() => {
  if (saving.value) {
    if (isEditMode.value) return text('userManagement.form.buttons.saving')
    return isStaffUser.value
      ? text('userManagement.form.buttons.creatingCandidate')
      : text('userManagement.form.buttons.registering')
  }

  if (isEditMode.value) return text('userManagement.form.buttons.saveChanges')
  return isStaffUser.value
    ? text('userManagement.form.buttons.createCandidate')
    : text('userManagement.form.buttons.registerUser')
})

const roleSelectOptions = computed<UserManagementFormSelectOption[]>(() =>
  roles.value.map((role) => ({
    value: role.id,
    label: `${role.name} — ${role.description || text('userManagement.shared.noDescription')}`,
  })),
)
const candidateBindableRecruitmentStages = new Set<RecruitmentFlowStage>([
  'erf_approved',
  'assign_recruiter',
  'candidate_sourcing',
  'assessment_list_created',
  'interview_scheduled',
  'interview_evaluation_in_progress',
  'interview_evaluation_completed',
  'candidate_selected',
  'employee_contract_form_in_progress',
])
const availableJobBindings = computed(() => {
  const currentBindingId = form.employee_request_form_id

  return jobs.value.filter((job) => {
    const isCurrentBinding = Boolean(currentBindingId) && job.id === currentBindingId
    const recruitmentFlowStage = job.recruitment_flow_stage ?? null

    if (isCurrentBinding) {
      return true
    }

    if (job.status === 'closed') {
      return false
    }

    if (!recruitmentFlowStage || !candidateBindableRecruitmentStages.has(recruitmentFlowStage)) {
      return false
    }

    if (recruitmentFlowStage === 'erf_approved' && !job.recruiter_user_id) {
      return false
    }

    return true
  })
})
const jobBindingSelectOptions = computed<UserManagementFormSelectOption[]>(() =>
  availableJobBindings.value.map((job) => ({
    value: job.id,
    label: `${job.main_position || '-'} - ${job.designation || '-'} - ${job.department || '-'}`,
  })),
)
const departmentSelectOptions = computed<UserManagementFormSelectOption[]>(() =>
  optionsByType.value.department.map((option) => ({
    value: option.id,
    label: option.name,
  })),
)
const designationSelectOptions = computed<UserManagementFormSelectOption[]>(() =>
  optionsByType.value.designation.map((option) => ({
    value: option.id,
    label: option.name,
  })),
)
const ptSelectOptions = computed<UserManagementFormSelectOption[]>(() =>
  optionsByType.value.pt.map((option) => ({
    value: option.id,
    label: option.name,
  })),
)

const form = reactive<UserFormState>(createUserManagementFormState())

function normalizeRole(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function getInitialAccountType(): 'user' | 'candidate' {
  return normalizeRole(route.query.type) === 'candidate' ? 'candidate' : 'user'
}

function populateFormFromTarget() {
  if (!targetUser.value) return
  form.email = targetUser.value.email ?? ''
  form.username = targetUser.value.username ?? ''
  form.password = ''
  form.full_name = targetUser.value.full_name ?? targetUser.value.first_name ?? ''
  form.phone = targetUser.value.phone ?? targetUser.value.emergency_contact_phone ?? ''
  form.employee_code = targetUser.value.employee_code ?? ''
  form.contract_number = targetUser.value.contract_number ?? ''
  form.cost_center_pt_id = targetUser.value.cost_center_pt_id ?? ''
  form.employee_request_form_id = targetUser.value.employee_request_form_id ?? ''
  form.department_id = targetUser.value.department_id ?? ''
  form.master_designation_id = targetUser.value.master_designation_id ?? ''
  form.main_position = targetUser.value.main_position ?? ''
  form.role_id =
    targetUser.value.role_id ??
    (roles.value.find((role) => normalizeRole(role.name) === normalizeRole(targetUser.value?.role))?.id ?? '')
}

function resetForm() {
  Object.assign(form, createUserManagementFormState())
  selectedAccountType.value = isStaffUser.value ? 'candidate' : getInitialAccountType()
  if (isStaffUser.value && candidateRole.value) {
    form.role_id = candidateRole.value.id
  }

  if (!isEditMode.value && requestedRoleName.value) {
    form.role_id = roles.value.find((role) => normalizeRole(role.name) === requestedRoleName.value)?.id ?? ''
  }
}

function setAccountType(nextType: 'user' | 'candidate') {
  selectedAccountType.value = nextType

  if (nextType === 'candidate') {
    if (candidateRole.value) {
      form.role_id = candidateRole.value.id
    }
    return
  }

  if (candidateRole.value && form.role_id === candidateRole.value.id) {
    form.role_id = ''
  }
  form.employee_request_form_id = ''
}

async function loadDependencies() {
  const tasks: Promise<unknown>[] = []

  if (
    optionsByType.value.pt.length === 0
    || optionsByType.value.department.length === 0
    || optionsByType.value.job_level.length === 0
    || optionsByType.value.designation.length === 0
  ) {
    const masterDataTask =
      typeof loadOptions === 'function'
        ? loadOptions(['pt', 'department', 'job_level', 'designation'])
        : loadAllOptions()

    tasks.push(masterDataTask)
  }

  if (
    roles.value.length === 0
  ) {
    tasks.push(refreshRoles())
  }

  if (shouldLoadCandidateBindings.value && jobs.value.length === 0) {
    tasks.push(refreshJobs())
  }

  if (isEditMode.value && (users.value.length === 0 || !targetUser.value)) {
    tasks.push(refreshUsers())
  }

  await Promise.allSettled(tasks)

  if (isEditMode.value) {
    populateFormFromTarget()
  }
}

const selectedJobBinding = computed(() =>
  availableJobBindings.value.find((job) => job.id === form.employee_request_form_id) ?? null,
)

watch(
  selectedJobBinding,
  (job) => {
    if (!job || !isCandidateAccount.value) {
      return
    }

    form.department_id = job.department_id ?? ''
    form.master_designation_id = job.master_designation_id ?? ''
    form.main_position = job.main_position ?? ''
  },
  { immediate: true },
)

onMounted(() => {
  loadDependencies().catch((err) => {
    const message = err instanceof Error ? err.message : text('userManagement.form.errors.loadData')
    appToast.error(message)
  })
})

watch(
  [isStaffUser, candidateRole],
  () => {
    if (!isEditMode.value && !isStaffUser.value && selectedAccountType.value === 'candidate' && candidateRole.value) {
      form.role_id = candidateRole.value.id
    }

    if (isStaffUser.value && candidateRole.value) {
      selectedAccountType.value = 'candidate'
      form.role_id = candidateRole.value.id
    }
  },
  { immediate: true },
)

watch(
  [requestedRoleName, roles],
  () => {
    if (isEditMode.value || !requestedRoleName.value || isCandidateAccount.value) {
      return
    }

    form.role_id = roles.value.find((role) => normalizeRole(role.name) === requestedRoleName.value)?.id ?? form.role_id
  },
  { immediate: true },
)

watch(
  shouldLoadCandidateBindings,
  (shouldLoad) => {
    if (!shouldLoad || jobs.value.length > 0) {
      return
    }

    refreshJobs().catch((err) => {
      const message = err instanceof Error ? err.message : text('userManagement.form.errors.loadBindings')
      appToast.error(message)
    })
  },
  { immediate: true },
)

async function handleSubmit() {
  try {
    const trimmedPassword = form.password.trim()
    const fullName = form.full_name.trim()
    if (!fullName) {
      throw new Error(text('userManagement.form.errors.fullNameRequired'))
    }

    if (isStaffUser.value && candidateRole.value) {
      form.role_id = candidateRole.value.id
    }

    if (!form.role_id) {
      throw new Error(text('userManagement.form.errors.roleRequired'))
    }

    if (isCandidateAccount.value && !form.employee_request_form_id) {
      throw new Error(text('userManagement.form.errors.bindErfRequired'))
    }

    const selectedRole =
      roles.value.find((r) => r.id === form.role_id) ??
      (isStaffUser.value ? candidateRole.value : null)

    if (isEditMode.value) {
      if (!targetUser.value) {
        throw new Error(text('userManagement.form.userNotFound'))
      }

      const payload: UpdateUserRequest = {
        email: form.email,
        full_name: fullName,
        phone: form.phone.trim() || undefined,
        username: form.username.trim() || undefined,
        employee_code: form.employee_code.trim() || undefined,
        contract_number: form.contract_number.trim() || undefined,
        cost_center_pt_id: form.cost_center_pt_id || undefined,
        employee_request_form_id: form.employee_request_form_id || undefined,
        department_id: form.department_id || undefined,
        master_designation_id: form.master_designation_id || undefined,
        main_position: form.main_position.trim() || undefined,
        role_id: form.role_id,
      }

      if (trimmedPassword) {
        if (trimmedPassword.length < 6) {
          throw new Error(text('userManagement.form.errors.newPasswordTooShort'))
        }
        payload.password = trimmedPassword
      }

      await updateUser(targetUser.value.id, payload)
      appToast.success(text('userManagement.form.toast.updateSuccess'))
      await router.push('/user-management')
      return
    }

    if (!isCandidateAccount.value && !trimmedPassword) {
      throw new Error(text('userManagement.form.errors.passwordRequired'))
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      throw new Error(text('userManagement.form.errors.passwordTooShort'))
    }

    const payload: CreateUserRequest = {
      email: form.email,
      full_name: fullName,
      phone: form.phone.trim() || undefined,
      username: form.username.trim() || undefined,
      employee_code: form.employee_code.trim() || undefined,
      contract_number: form.contract_number.trim() || undefined,
      cost_center_pt_id: form.cost_center_pt_id || undefined,
      employee_request_form_id: form.employee_request_form_id || undefined,
      department_id: form.department_id || undefined,
      master_designation_id: form.master_designation_id || undefined,
      main_position: form.main_position.trim() || undefined,
      role_id: form.role_id,
    }

    if (trimmedPassword) {
      payload.password = trimmedPassword
    }

    await createUser(payload)
    lastCreated.value = {
      email: form.email,
      username: form.username.trim() || null,
      password: trimmedPassword,
      roleName: selectedRole?.name ?? '-',
    }
    appToast.success(text('userManagement.form.toast.createSuccess'))

    resetForm()
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : isEditMode.value
          ? text('userManagement.form.errors.updateFailed')
          : text('userManagement.form.errors.createFailed')
    appToast.error(message)
  }
}
</script>
