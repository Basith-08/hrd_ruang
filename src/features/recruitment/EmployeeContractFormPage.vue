<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text('recruitment.contractForms.form.eyebrow') }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ pageTitle }}
        </h1>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :label="text('common.actions.back')"
            @click="router.back()"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ pageTitle }}
            </h2>
          </div>

          <form class="grid gap-5 md:grid-cols-2" @submit.prevent="handleSubmit">
            <div class="space-y-2 md:col-span-2">
              <AppFieldLabel>{{ text('common.labels.employeeRequestForm') }} *</AppFieldLabel>
              <SearchableSelect
                v-model="form.employee_request_form_id"
                :options="employeeRequestFormOptions"
                :placeholder="text('recruitment.contractForms.form.placeholders.erf')"
                :loading="employeeRequestFormLoading"
                :loading-label="text('common.loading')"
                :disabled="saving || pageLoading"
              />
              <p class="app-helper-text">
                {{ text('recruitment.contractForms.form.helpers.erf') }}
              </p>
            </div>

            <div class="space-y-2 md:col-span-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.candidateName') }} *</AppFieldLabel>
              <SearchableSelect
                v-model="form.candidate_id"
                :options="candidateOptions"
                :placeholder="text('recruitment.contractForms.form.placeholders.candidate')"
                :loading="candidateLoading"
                :loading-label="text('recruitment.contractForms.form.loading.candidates')"
                :disabled="saving || candidateLoading || !form.employee_request_form_id"
              />
              <p class="app-helper-text">
                {{ text('recruitment.contractForms.form.helpers.candidate') }}
              </p>
            </div>

            <div class="space-y-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.contractStartDate') }} *</AppFieldLabel>
              <AppFormInput
                v-model="form.contract_start_date"
                type="date"
                :disabled="saving || pageLoading"
              />
              <p class="app-helper-text">
                {{ text('recruitment.contractForms.form.helpers.contractStartDate') }}
              </p>
            </div>

            <div class="space-y-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.contractEndDate') }} *</AppFieldLabel>
              <AppFormInput
                v-model="form.contract_end_date"
                type="date"
                :min="form.contract_start_date || undefined"
                :disabled="saving || pageLoading"
              />
              <p class="app-helper-text">
                {{ text('recruitment.contractForms.form.helpers.contractEndDate') }}
              </p>
            </div>

            <div class="space-y-2 md:col-span-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.approvalUser') }} *</AppFieldLabel>
              <SearchableSelect
                v-model="form.approval_user_id"
                :options="approvalUserOptions"
                :placeholder="text('recruitment.contractForms.form.placeholders.approvalUser')"
                :loading="approvalUsersLoading"
                :loading-label="text('recruitment.contractForms.form.loading.approvalUsers')"
                :disabled="saving || approvalUsersLoading || !form.employee_request_form_id"
              />
              <p class="app-helper-text">
                {{ text('recruitment.contractForms.form.helpers.approvalUser') }}
              </p>
            </div>

            <div class="space-y-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.contractNumber') }} *</AppFieldLabel>
              <AppFormInput
                v-model="form.contract_number"
                type="text"
                :placeholder="text('recruitment.contractForms.form.placeholders.contractNumber')"
                :disabled="saving || pageLoading"
              />
            </div>

            <div class="space-y-2">
              <AppFieldLabel>{{ text('recruitment.contractForms.fields.employeeCode') }} *</AppFieldLabel>
              <AppFormInput
                v-model="form.employee_code"
                type="text"
                :placeholder="text('recruitment.contractForms.form.placeholders.employeeCode')"
                :disabled="saving || pageLoading"
              />
            </div>

            <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end md:col-span-2">
              <AppActionButton
                variant="secondary"
                :label="text('common.actions.cancel')"
                :disabled="saving"
                @click="router.back()"
              />
              <AppActionButton
                type="submit"
                variant="primary"
                :label="submitButtonLabel"
                :disabled="saving || isLoading"
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>

  <AppLoadingOverlay
    v-if="pageBusyMessage"
    :message="pageBusyMessage"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import { callBackendApi } from '@/infrastructure/http/backendApi'
import {
  createEmployeeContractForm,
  getEmployeeContractFormApprovalUsers,
  getEmployeeContractFormById,
  updateEmployeeContractForm,
} from '@/features/recruitment/employeeContractFormApi'
import type {
  EmployeeContractFormPayload,
  EmployeeContractFormSelectOption,
} from '@/features/recruitment/types/EmployeeContractForm.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppFieldLabel from '@/presentation/components/forms/AppFieldLabel.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import { useLocale } from '@/composables/useLocale'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'

type EmployeeCandidateOption = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  hasCompletedInterview?: boolean
  hasExistingContract?: boolean
}

type EmployeeContractApprovalUserOption = {
  id: string
  full_name: string | null
  main_position?: string | null
}

const route = useRoute()
const router = useRouter()
const { text } = useLocale()
const appToast = useAppToast()
const {
  jobs,
  refresh: refreshEmployeeRequestForms,
  loading: employeeRequestFormLoading,
  error: employeeRequestFormError,
} = useEmployeeRequestFormViewModel({ autoLoad: false, mode: 'list' })

const form = reactive<EmployeeContractFormPayload>({
  employee_request_form_id: '',
  candidate_id: '',
  contract_number: '',
  employee_code: '',
  contract_start_date: '',
  contract_end_date: '',
  approval_user_id: '',
})

const pageLoading = ref(false)
const saving = ref(false)
const error = ref('')
const candidateLoading = ref(false)
const approvalUsersLoading = ref(false)
const candidateOptionsRaw = ref<EmployeeCandidateOption[]>([])
const approvalUsersRaw = ref<EmployeeContractApprovalUserOption[]>([])
const hydratingRecord = ref(false)

const recordId = computed(() => String(route.params.id ?? ''))
const isEditMode = computed(() => route.path.endsWith('/edit'))
const isLoading = computed(() =>
  pageLoading.value || employeeRequestFormLoading.value || approvalUsersLoading.value,
)
const pageBusyMessage = computed(() => {
  if (saving.value) {
    return text('recruitment.contractForms.form.loading.saving')
  }

  if (pageLoading.value || employeeRequestFormLoading.value) {
    return text('recruitment.contractForms.form.loading.initial')
  }

  if (candidateLoading.value) {
    return text('recruitment.contractForms.form.loading.candidates')
  }

  if (approvalUsersLoading.value) {
    return text('recruitment.contractForms.form.loading.approvalUsers')
  }

  return ''
})
const pageTitle = computed(() => (
  isEditMode.value
    ? text('recruitment.contractForms.form.title.edit')
    : text('recruitment.contractForms.form.title.create')
))
const submitButtonLabel = computed(() => (
  saving.value
    ? text('recruitment.contractForms.form.actions.saving')
    : isEditMode.value
      ? text('recruitment.contractForms.form.actions.update')
      : text('recruitment.contractForms.form.actions.save')
))

const necfEligibleRecruitmentFlowStages = new Set([
  'interview_evaluation_completed',
  'candidate_selected',
  'employee_contract_form_in_progress',
])

const eligibleEmployeeRequestForms = computed(() =>
  jobs.value.filter((job) =>
    job.status !== 'closed' && necfEligibleRecruitmentFlowStages.has(job.recruitment_flow_stage ?? ''),
  ),
)

const employeeRequestFormOptions = computed<EmployeeContractFormSelectOption[]>(() =>
  (isEditMode.value && form.employee_request_form_id
    ? (() => {
        const currentJob = jobs.value.find((job) => job.id === form.employee_request_form_id) ?? null
        return currentJob && !eligibleEmployeeRequestForms.value.some((job) => job.id === currentJob.id)
          ? [currentJob, ...eligibleEmployeeRequestForms.value]
          : eligibleEmployeeRequestForms.value
      })()
    : eligibleEmployeeRequestForms.value
  ).map((job) => ({
    value: job.id,
    label: [
      job.main_position || '-',
      job.designation || '-',
      job.department || '-',
    ].join(' - '),
  })),
)

const eligibleCandidateOptionsRaw = computed(() =>
  candidateOptionsRaw.value.filter((candidate) => candidate.hasCompletedInterview && !candidate.hasExistingContract),
)

const candidateOptions = computed<EmployeeContractFormSelectOption[]>(() =>
  (isEditMode.value && form.candidate_id
    ? (() => {
        const currentCandidate = candidateOptionsRaw.value.find((candidate) => candidate.id === form.candidate_id)
          ?? null
        return currentCandidate
          && !eligibleCandidateOptionsRaw.value.some((candidate) => candidate.id === currentCandidate.id)
          ? [currentCandidate, ...eligibleCandidateOptionsRaw.value]
          : eligibleCandidateOptionsRaw.value
      })()
    : eligibleCandidateOptionsRaw.value
  ).map((candidate) => ({
    value: candidate.id,
    label: [candidate.full_name || candidate.email || candidate.id, candidate.email].filter(Boolean).join(' - '),
  })),
)

const approvalUserOptions = computed<EmployeeContractFormSelectOption[]>(() =>
  approvalUsersRaw.value.map((user) => ({
    value: user.id,
    label: [user.full_name || user.id, user.main_position].filter(Boolean).join(' - '),
  })),
)

watch(
  () => form.employee_request_form_id,
  async (nextValue, previousValue) => {
    if (!nextValue) {
      candidateOptionsRaw.value = []
      approvalUsersRaw.value = []
      form.candidate_id = ''
      form.approval_user_id = ''
      return
    }

    if (!hydratingRecord.value && nextValue !== previousValue) {
      form.candidate_id = ''
      form.approval_user_id = ''
    }

    await Promise.all([
      loadCandidates(nextValue),
      loadApprovalUsers(nextValue),
    ])
  },
)

async function loadCandidates(employeeRequestFormId: string) {
  candidateLoading.value = true
  error.value = ''

  try {
    const payload = await callBackendApi<{ candidates?: EmployeeCandidateOption[] }>(
      `/api/employee-request-forms/${encodeURIComponent(employeeRequestFormId)}/pipeline-candidates`,
    )
    candidateOptionsRaw.value = Array.isArray(payload.candidates) ? payload.candidates : []
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : text('recruitment.contractForms.form.errors.loadCandidatesFailed')
  } finally {
    candidateLoading.value = false
  }
}

async function loadApprovalUsers(employeeRequestFormId: string) {
  approvalUsersLoading.value = true
  error.value = ''

  try {
    approvalUsersRaw.value = await getEmployeeContractFormApprovalUsers(employeeRequestFormId)
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : text('recruitment.contractForms.form.errors.loadFailed')
    approvalUsersRaw.value = []
  } finally {
    approvalUsersLoading.value = false
  }
}

async function loadDependencies() {
  pageLoading.value = true
  error.value = ''

  try {
    await refreshEmployeeRequestForms()

    if (isEditMode.value && recordId.value) {
      const record = await getEmployeeContractFormById(recordId.value)
      if (!record) {
        throw new Error(text('recruitment.contractForms.form.errors.notFound'))
      }

      hydratingRecord.value = true
      form.employee_request_form_id = record.employee_request_form_id
      form.candidate_id = record.candidate_id
      form.contract_number = record.contract_number ?? ''
      form.employee_code = record.employee_code ?? ''
      form.contract_start_date = record.contract_start_date ?? ''
      form.contract_end_date = record.contract_end_date ?? ''
      form.approval_user_id = record.approval_user_id ?? ''

      await Promise.all([
        loadCandidates(record.employee_request_form_id),
        loadApprovalUsers(record.employee_request_form_id),
      ])
      hydratingRecord.value = false
    }
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : text('recruitment.contractForms.form.errors.loadFailed')
    hydratingRecord.value = false
  } finally {
    pageLoading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = ''

  try {
    if (isEditMode.value && recordId.value) {
      await updateEmployeeContractForm(recordId.value, { ...form })
      appToast.success(text('recruitment.contractForms.form.toasts.updated'))
    } else {
      await createEmployeeContractForm({ ...form })
      appToast.success(text('recruitment.contractForms.form.toasts.created'))
    }

    await router.push('/recruitment/new-employee-contract-forms')
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : text('recruitment.contractForms.form.errors.saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadDependencies()
})

watch(
  () => employeeRequestFormError.value,
  (nextEmployeeRequestFormError) => {
    error.value = nextEmployeeRequestFormError || error.value
  },
)

</script>
