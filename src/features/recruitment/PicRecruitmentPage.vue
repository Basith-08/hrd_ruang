<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text('picRecruitment.page.eyebrow') }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ text('picRecruitment.page.title') }}
        </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
          {{ text('picRecruitment.page.description') }}
        </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :loading="loading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refresh"
          />
          <AppActionButton
            v-if="canAssignRecruiter"
            class="inline-flex min-h-11 min-w-[170px] items-center justify-center"
            variant="primary"
            :label="text('picRecruitment.actions.assignRecruiter')"
            @click="openAssignRecruiterModal"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-2xl">
              <p class="app-dashboard-eyebrow">
                {{ text('picRecruitment.filters.title') }}
              </p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('picRecruitment.filters.subtitle') }}
              </h2>
            </div>

            <AppActionButton
              class="h-11 px-4 py-0 xl:flex-none"
              variant="ghost"
              :label="text('picRecruitment.filters.reset')"
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            />
          </div>

          <div class="grid gap-3 xl:grid-cols-[minmax(280px,1.4fr)_repeat(4,minmax(160px,1fr))]">
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput
                v-model="searchQuery"
                :placeholder="text('picRecruitment.filters.searchPlaceholder')"
                class="w-full"
              />
            </label>
            <label
              v-for="filter in selectFilters"
              :key="filter.key"
              class="block min-w-0"
            >
              <span class="app-fieldset-label mb-1.5 block">
                {{ filter.label }}
              </span>
              <SearchableSelect
                :model-value="filter.modelValue"
                :options="filter.options"
                :placeholder="filter.placeholder"
                show-empty-option
                :empty-label="filter.emptyLabel"
                class="w-full"
                @update:model-value="filter.update"
              />
            </label>
          </div>
        </div>
      </div>

      <PicRecruitmentTable
        v-model:page="page"
        :items="pagedJobs"
        :loading="loading"
        :page-size="pageSize"
        :total-items="sortedJobs.length"
        :text="text"
        :stage-label="recruitmentStageLabel"
        :stage-badge-class="recruitmentStageBadgeClassForJob"
        :position-status-badge-class="positionStatusBadgeClass"
        :sort-indicator="sortIndicator"
        @sort="toggleSort"
      />
    </section>
  </div>

  <PicRecruitmentAssignModal
    v-if="showAssignRecruiterModal"
    :selected-employee-request-form-id="selectedEmployeeRequestFormId"
    :selected-recruiter-user-id="selectedRecruiterUserId"
    :employee-request-form-options="employeeRequestFormOptions"
    :recruiter-options="recruiterOptions"
    :saving="saving"
    :loading-recruiters="recruiterLoading"
    :text="text"
    @update:selected-employee-request-form-id="selectedEmployeeRequestFormId = $event"
    @update:selected-recruiter-user-id="selectedRecruiterUserId = $event"
    @cancel="closeAssignRecruiterModal"
    @submit="handleAssignRecruiter"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type { EmployeeRequestFormListSelectOption } from '@/features/employeeRequestForms/types/EmployeeRequestFormList.type'
import PicRecruitmentAssignModal from '@/features/recruitment/components/PicRecruitmentAssignModal.vue'
import PicRecruitmentTable from '@/features/recruitment/components/PicRecruitmentTable.vue'
import { useLocale } from '@/composables/useLocale'
import { supabase } from '@/infrastructure/supabase/client'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { compareNullableValues, type TableSortDirection } from '@/presentation/utils/tableSort'
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '@/domain/utils/recruitmentFlowStage'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'

const { text } = useLocale()
const { hasAnyPermission } = useAuthViewModel()
const appToast = useAppToast()
const { jobs, loading, error, saving, refresh, assignRecruiter } = useEmployeeRequestFormViewModel({
  mode: 'list',
})

const searchQuery = ref('')
const positionStatusFilter = ref('')
const employmentFilter = ref('')
const statusFilter = ref('')
const recruiterAssignmentFilter = ref('')
const sortKey = ref<PicRecruitmentSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const page = ref(1)
const pageSize = 10

const showAssignRecruiterModal = ref(false)
const selectedEmployeeRequestFormId = ref('')
const selectedRecruiterUserId = ref('')
const recruiterLoading = ref(false)
const recruiterOptions = ref<EmployeeRequestFormListSelectOption[]>([])

const canReadPicRecruitment = computed(() =>
  hasAnyPermission([
    'pic_recruitment:read',
    'recruitment:pic_recruitment_read',
  ]),
)
const canAssignRecruiter = computed(() =>
  hasAnyPermission([
    'pic_recruitment:update',
    'recruitment:pic_recruitment_update',
  ]),
)

type PicRecruitmentSortKey =
  | 'department'
  | 'business_unit'
  | 'main_position'
  | 'recruiter_name'
  | 'position_status'
  | 'employment_status'
  | 'status'

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function normalizeStatus(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

function recruitmentStage(job: EmployeeRequestForm) {
  return resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  })
}

function isEligiblePicRecruitmentStage(job: EmployeeRequestForm) {
  const stage = recruitmentStage(job)
  return job.status !== 'closed' && ['erf_approved', 'assign_recruiter'].includes(stage)
}

function recruiterOptionLabel(profile: Record<string, unknown>) {
  const fullName = String(profile.full_name ?? profile.username ?? profile.email ?? '').trim()
  const position = String(profile.main_position ?? '').trim() || text('employeeRequestForms.form.messages.noMainPosition')
  const displayName = fullName || text('employeeRequestForms.form.messages.unnamed')
  return `${displayName} - ${position}`
}

const visibleJobs = computed(() =>
  canReadPicRecruitment.value
    ? jobs.value.filter(isEligiblePicRecruitmentStage)
    : [],
)

const positionStatusOptions = computed(() => {
  const set = new Set<string>()
  for (const job of visibleJobs.value) {
    if (job.position_status) {
      set.add(job.position_status)
    }
  }
  return Array.from(set).sort((left, right) => left.localeCompare(right))
})

const employmentOptions = computed(() => {
  const set = new Set<string>()
  for (const job of visibleJobs.value) {
    if (job.employment_status) {
      set.add(job.employment_status)
    }
  }
  return Array.from(set).sort((left, right) => left.localeCompare(right))
})

const statusOptions = computed<EmployeeRequestFormListSelectOption[]>(() => [
  { value: 'erf_approved', label: recruitmentFlowStageLabel('erf_approved') },
  { value: 'assign_recruiter', label: recruitmentFlowStageLabel('assign_recruiter') },
])

const recruiterAssignmentOptions = computed<EmployeeRequestFormListSelectOption[]>(() => [
  { value: 'unassigned', label: text('picRecruitment.filters.withoutRecruiter') },
  ...Array.from(
    new Set(
      visibleJobs.value
        .map((job) => String(job.recruiter_name ?? '').trim())
        .filter(Boolean),
    ),
  )
    .sort((left, right) => left.localeCompare(right))
    .map((recruiterName) => ({
      value: recruiterName,
      label: recruiterName,
    })),
])
const hasActiveFilters = computed(() =>
  Boolean(
    searchQuery.value.trim()
      || positionStatusFilter.value
      || employmentFilter.value
      || statusFilter.value
      || recruiterAssignmentFilter.value,
  ),
)

const selectFilters = computed(() => [
  {
    key: 'position_status',
    label: text('common.labels.positionStatus'),
    modelValue: positionStatusFilter.value,
    options: positionStatusOptions.value.map((option) => ({ value: option, label: option })),
    placeholder: text('employeeRequestForms.list.filters.positionStatusPlaceholder'),
    emptyLabel: text('employeeRequestForms.list.filters.allPositionStatuses'),
    update: (value: string | number | null) => {
      positionStatusFilter.value = String(value ?? '')
    },
  },
  {
    key: 'employment_status',
    label: text('common.labels.employmentStatus'),
    modelValue: employmentFilter.value,
    options: employmentOptions.value.map((option) => ({ value: option, label: option })),
    placeholder: text('employeeRequestForms.list.filters.employmentPlaceholder'),
    emptyLabel: text('employeeRequestForms.list.filters.allEmployment'),
    update: (value: string | number | null) => {
      employmentFilter.value = String(value ?? '')
    },
  },
  {
    key: 'status',
    label: text('common.labels.status'),
    modelValue: statusFilter.value,
    options: statusOptions.value,
    placeholder: text('picRecruitment.filters.statusPlaceholder'),
    emptyLabel: text('common.status.all'),
    update: (value: string | number | null) => {
      statusFilter.value = String(value ?? '')
    },
  },
  {
    key: 'recruiter_assignment',
    label: text('common.labels.recruiter'),
    modelValue: recruiterAssignmentFilter.value,
    options: recruiterAssignmentOptions.value,
    placeholder: text('picRecruitment.filters.recruiterAssignmentPlaceholder'),
    emptyLabel: text('picRecruitment.filters.allRecruiterAssignments'),
    update: (value: string | number | null) => {
      recruiterAssignmentFilter.value = String(value ?? '')
    },
  },
])

const filteredJobs = computed(() => {
  const query = normalize(searchQuery.value)

  return visibleJobs.value.filter((job) => {
    const stage = recruitmentStage(job)

    if (positionStatusFilter.value && job.position_status !== positionStatusFilter.value) return false
    if (employmentFilter.value && job.employment_status !== employmentFilter.value) return false
    if (statusFilter.value && stage !== statusFilter.value) return false
    if (recruiterAssignmentFilter.value === 'unassigned' && normalize(job.recruiter_user_id)) return false
    if (
      recruiterAssignmentFilter.value
      && recruiterAssignmentFilter.value !== 'unassigned'
      && String(job.recruiter_name ?? '').trim() !== recruiterAssignmentFilter.value
    ) {
      return false
    }
    if (!query) return true

    const haystack = [
      job.department,
      job.business_unit,
      job.main_position,
      job.recruiter_name,
      job.position_status,
      job.employment_status,
      recruitmentFlowStageLabel(stage),
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(query)
  })
})

function compareJobs(
  left: EmployeeRequestForm,
  right: EmployeeRequestForm,
  activeSortKey: PicRecruitmentSortKey,
  direction: TableSortDirection,
) {
  if (activeSortKey === 'status') {
    return compareNullableValues(recruitmentStageLabel(left), recruitmentStageLabel(right), direction)
  }

  return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
}

const sortedJobs = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredJobs.value

  return [...filteredJobs.value].sort((left, right) =>
    compareJobs(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedJobs.value.length / pageSize)))
const pagedJobs = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedJobs.value.slice(start, start + pageSize)
})

const employeeRequestFormOptions = computed<EmployeeRequestFormListSelectOption[]>(() =>
  visibleJobs.value.map((job) => ({
    value: job.id,
    label: `${fallback(job.main_position)} - ${fallback(job.department)} - ${fallback(job.business_unit)}`,
  })),
)

watch([searchQuery, positionStatusFilter, employmentFilter, statusFilter, recruiterAssignmentFilter], () => {
  page.value = 1
})

watch(
  () => filteredJobs.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)

watch(selectedEmployeeRequestFormId, (jobId) => {
  const selectedJob = visibleJobs.value.find((item) => item.id === jobId)
  selectedRecruiterUserId.value = String(selectedJob?.recruiter_user_id ?? '').trim()
})

function positionStatusBadgeClass(value: unknown) {
  const baseClass = 'whitespace-nowrap'

  switch (normalizeStatus(value)) {
    case 'replacement':
      return `${baseClass} app-status-job-replacement`
    case 'new position mpp':
      return `${baseClass} app-status-job-new`
    case 'new position non-mpp':
      return `${baseClass} app-status-job-upgrade`
    case 'internship':
      return `${baseClass} app-status-chip app-status-chip-success`
    default:
      return `${baseClass} app-status-job-default`
  }
}

function recruitmentStageLabel(job: EmployeeRequestForm) {
  return recruitmentFlowStageLabel(recruitmentStage(job))
}

function recruitmentStageBadgeClassForJob(job: EmployeeRequestForm) {
  return recruitmentFlowStageBadgeClass(recruitmentStage(job))
}

function toggleSort(key: string) {
  const nextKey = key as PicRecruitmentSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextKey
  sortDirection.value = 'asc'
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function resetFilters() {
  searchQuery.value = ''
  positionStatusFilter.value = ''
  employmentFilter.value = ''
  statusFilter.value = ''
  recruiterAssignmentFilter.value = ''
  page.value = 1
}

async function loadRecruiterOptions() {
  recruiterLoading.value = true

  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username, email, main_position')
      .eq('is_active', true)

    if (profilesError) {
      throw new Error(profilesError.message)
    }

    const profileIds = (profiles ?? [])
      .map((profile: Record<string, unknown>) => String(profile.id ?? '').trim())
      .filter(Boolean)

    if (profileIds.length === 0) {
      recruiterOptions.value = []
      return
    }

    const { data: roleRows, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)')
      .in('user_id', profileIds)

    if (roleError) {
      throw new Error(roleError.message)
    }

    const blockedRoles = new Set(['candidate', 'employee'])
    const roleMap = new Map<string, string>()

    for (const row of roleRows ?? []) {
      const roleName = String(
        (row as { roles?: { name?: string } | null }).roles?.name ?? '',
      ).toLowerCase().trim()

      if (roleName) {
        roleMap.set(String((row as { user_id?: string }).user_id ?? ''), roleName)
      }
    }

    recruiterOptions.value = (profiles ?? [])
      .filter((profile: Record<string, unknown>) => !blockedRoles.has(roleMap.get(String(profile.id ?? '')) ?? ''))
      .map((profile: Record<string, unknown>) => ({
        value: String(profile.id ?? '').trim(),
        label: recruiterOptionLabel(profile),
      }))
      .filter((option: EmployeeRequestFormListSelectOption) => option.value)
      .sort(
        (left: EmployeeRequestFormListSelectOption, right: EmployeeRequestFormListSelectOption) =>
          left.label.localeCompare(right.label),
      )
  } finally {
    recruiterLoading.value = false
  }
}

async function openAssignRecruiterModal() {
  selectedEmployeeRequestFormId.value = ''
  selectedRecruiterUserId.value = ''
  showAssignRecruiterModal.value = true

  try {
    await loadRecruiterOptions()
  } catch (err) {
    closeAssignRecruiterModal()
    const message = err instanceof Error ? err.message : text('picRecruitment.errors.loadRecruitersFailed')
    appToast.error(message)
  }
}

function closeAssignRecruiterModal() {
  showAssignRecruiterModal.value = false
  selectedEmployeeRequestFormId.value = ''
  selectedRecruiterUserId.value = ''
}

async function handleAssignRecruiter() {
  const employeeRequestFormId = selectedEmployeeRequestFormId.value.trim()
  const recruiterUserId = selectedRecruiterUserId.value.trim()

  if (!employeeRequestFormId) {
    appToast.error(text('picRecruitment.errors.employeeRequestFormRequired'))
    return
  }

  if (!recruiterUserId) {
    appToast.error(text('picRecruitment.errors.recruiterRequired'))
    return
  }

  try {
    await assignRecruiter(employeeRequestFormId, recruiterUserId)
    appToast.success(text('picRecruitment.toasts.recruiterAssigned'))
    closeAssignRecruiterModal()
  } catch (err) {
    const message = err instanceof Error ? err.message : text('picRecruitment.errors.assignRecruiterFailed')
    appToast.error(message)
  }
}
</script>
