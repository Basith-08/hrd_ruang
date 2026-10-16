<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text(pageCopy.eyebrowKey) }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ text(pageCopy.titleKey) }}
        </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text(pageCopy.descriptionKey) }}
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
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ text(pageCopy.titleKey) }}
            </h2>
            <p class="app-dashboard-copy mt-1">
              {{ text(pageCopy.descriptionKey) }}
            </p>
          </div>

          <div class="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-end xl:justify-end">
            <label class="block xl:w-[420px] xl:flex-none">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput
                v-model="searchQuery"
                :placeholder="text(pageCopy.searchPlaceholderKey)"
                class="w-full"
              />
            </label>
            <label v-if="props.statusMode === 'closed'" class="block xl:w-[160px] xl:flex-none">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.from') }}
              </span>
              <input
                v-model="periodStart"
                type="date"
                class="app-field"
              >
            </label>
            <label v-if="props.statusMode === 'closed'" class="block xl:w-[160px] xl:flex-none">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.to') }}
              </span>
              <input
                v-model="periodEnd"
                type="date"
                class="app-field"
              >
            </label>
            <AppActionButton
              class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
              variant="secondary"
              :label="text('common.status.all')"
              @click="resetActiveFilters"
            />
          </div>
        </div>
      </div>

      <VacancyPipelineTable
          v-model:page="page"
          :items="pagedJobs"
          :status-mode="props.statusMode"
          :loading="loading"
          :page-size="pageSize"
          :total-items="sortedJobs.length"
          :department-label="text('common.labels.department')"
          :business-unit-label="text('recruitment.dashboard.columns.buCategory')"
          :main-position-label="text('common.labels.mainPosition')"
          :required-date-label="text('recruitment.dashboard.columns.officialComplete')"
          :status-label="text('common.labels.status')"
          :total-candidate-label="text('vacancyPipeline.page.columns.totalCandidate')"
          :interview-scheduled-label="text('vacancyPipeline.page.columns.interviewScheduled')"
          :actions-label="text('common.labels.actions')"
          :empty-message="text(pageCopy.emptyKey)"
          :detail-label="text('common.actions.detail')"
          :loading-label="text('common.loading')"
          :loading-detail-job-id="loadingDetailJobId"
          :can-open-detail-modal="canOpenDetailModal"
          :open-detail-modal="openDetailModal"
          :row-number="rowNumber"
          :vacancy-flow-status-badge-class="vacancyFlowStatusBadgeClass"
          :vacancy-flow-status-label="vacancyFlowStatusLabel"
          :format-date-display="formatDateDisplay"
          :sort-indicator="sortIndicator"
          @sort="toggleSort"
        />
    </section>
  </div>

  <VacancyPipelineDetailModal
    v-if="showDetailModal"
    :employee-request-form="selectedDetailEmployeeRequestForm"
    :detail-fields="selectedDetailFields"
    :attachment-sections="detailAttachmentSections"
    :loading-files="loadingDetailAttachmentPreviews"
    :recruiter-title="text('common.labels.recruiter')"
    :recruiter-name="fallback(selectedDetailEmployeeRequestForm?.recruiter_name)"
    :candidates-title="text('vacancyPipeline.detail.candidatesTitle')"
    :pipeline-candidates="selectedPipelineCandidates"
    :loading-candidates="loadingDetailCandidates"
    :loading-candidates-label="text('vacancyPipeline.detail.loadingCandidates')"
    :empty-candidates-label="text('vacancyPipeline.detail.emptyCandidates')"
    :candidates-error="detailCandidatesError"
    :eyebrow="text('vacancyPipeline.detail.eyebrow')"
    :no-position-label="text('approvals.tracking.noPosition')"
    :close-label="text('common.actions.close')"
    :erf-detail-label="text('vacancyPipeline.detail.erfDetail')"
    :loading-files-label="text('approvals.tracking.detail.loadingFiles')"
    :no-files-label="text('common.noFilesUploaded')"
    :file-click-hint-label="text('approvals.tracking.detail.fileClickHint')"
    :interview-date-label="text('interviewEvaluations.list.headers.interviewDate')"
    :selected-candidate-label="text('vacancyPipeline.detail.selectedCandidate')"
    @close="closeDetailModal"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type { ErfAttachmentFieldKey } from '@/features/approvals/types/ApprovalTrackingPage.type'
import { useLocale } from '@/composables/useLocale'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import { supabase } from '@/infrastructure/supabase/client'
import VacancyPipelineDetailModal from '@/features/recruitment/components/VacancyPipelineDetailModal.vue'
import VacancyPipelineTable from '@/features/recruitment/components/VacancyPipelineTable.vue'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import { compareNullableValues, parseSortDate, type TableSortDirection } from '@/presentation/utils/tableSort'
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '@/domain/utils/recruitmentFlowStage'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'
import { stripLeadingNumberCode } from '@/presentation/utils/textFormat'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'

const props = withDefaults(defineProps<{
  statusMode?: 'active' | 'closed'
}>(), {
  statusMode: 'active',
})

const { text } = useLocale()
const { hasPermission } = useAuthViewModel()
const { erfDocumentBucket } = getPublicAppConfig()
const { jobs, loading, error, refresh, getById } = useEmployeeRequestFormViewModel({
  mode: 'pipeline',
})

const searchQuery = ref('')
const periodStart = ref('')
const periodEnd = ref('')
const sortKey = ref<VacancyPipelineSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const pageSize = 10
const page = ref(1)
const showDetailModal = ref(false)
const selectedDetailEmployeeRequestForm = ref<EmployeeRequestForm | null>(null)
const detailCandidateRows = ref<Array<{
  id?: string | null
  full_name?: string | null
  email?: string | null
  interview_dates?: string[] | null
}>>([])
const loadingDetailCandidates = ref(false)
const detailCandidatesError = ref('')
const loadingDetailJobId = ref('')
const loadingDetailAttachmentPreviews = ref(false)
const detailAttachmentPreviews = ref<Record<ErfAttachmentFieldKey, Array<{ path: string; name: string; url: string }>>>(
  createEmptyAttachmentPreviewState(),
)
let detailModalRequestId = 0
let detailAttachmentPreviewRequestId = 0

type VacancyPipelineSortKey =
  | 'main_position'
  | 'business_unit'
  | 'department'
  | 'required_date'
  | 'status'
  | 'vacancy_candidate_count'
  | 'vacancy_interview_scheduled_count'

const canReadEmployeeRequestForms = computed(() => hasPermission('employee_request_form:read'))
const canReadVacancyPipeline = computed(() => hasPermission('recruitment:vacancy_pipeline'))
const canReadClosedVacancy = computed(() => hasPermission('recruitment:closed_vacancy'))
const canReadVacancyPipelineDetail = computed(() => hasPermission('recruitment:vacancy_pipeline_detail'))
const canReadClosedVacancyDetail = computed(() => hasPermission('recruitment:closed_vacancy_detail'))
const canReadApprovedEmployeeRequestForms = computed(() =>
  hasPermission('recruitment:approved_erf_read'),
)
const canOpenDetailModal = computed(() =>
  props.statusMode === 'closed'
    ? canReadClosedVacancyDetail.value
    : canReadVacancyPipelineDetail.value,
)

const pageCopy = computed(() => (
  props.statusMode === 'closed'
    ? {
        eyebrowKey: 'closedVacancy.page.eyebrow',
        titleKey: 'closedVacancy.page.title',
        descriptionKey: 'closedVacancy.page.description',
        searchPlaceholderKey: 'closedVacancy.page.searchPlaceholder',
        emptyKey: 'closedVacancy.page.empty',
      }
    : {
        eyebrowKey: 'vacancyPipeline.page.eyebrow',
        titleKey: 'vacancyPipeline.page.title',
        descriptionKey: 'vacancyPipeline.page.description',
        searchPlaceholderKey: 'vacancyPipeline.page.searchPlaceholder',
        emptyKey: 'vacancyPipeline.page.empty',
      }
))

function normalizeEmployeeRequestFormStatus(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

const statusFilteredJobs = computed(() =>
  jobs.value.filter((job) => (
    props.statusMode === 'closed'
      ? normalizeEmployeeRequestFormStatus(job.status) === 'closed'
      : normalizeEmployeeRequestFormStatus(job.status) !== 'closed'
  )),
)

const visibleJobs = computed(() => {
  const canReadCurrentPage =
    props.statusMode === 'closed'
      ? canReadClosedVacancy.value
      : canReadVacancyPipeline.value

  if (canReadEmployeeRequestForms.value || canReadCurrentPage) return statusFilteredJobs.value
  if (canReadApprovedEmployeeRequestForms.value) {
    return statusFilteredJobs.value.filter((job) => Boolean(job.approval_director_hrd_date))
  }
  return []
})

const periodFilteredJobs = computed(() => {
  if (props.statusMode !== 'closed') {
    return visibleJobs.value
  }

  return visibleJobs.value.filter((job) => {
    const closedDate = String(job.closed_date ?? '').trim()

    if (!periodStart.value && !periodEnd.value) {
      return true
    }

    if (!closedDate) {
      return false
    }

    if (periodStart.value && closedDate < periodStart.value) return false
    if (periodEnd.value && closedDate > periodEnd.value) return false

    return true
  })
})

const filteredJobs = computed(() => {
  const query = normalize(searchQuery.value)
  if (!query) return periodFilteredJobs.value

  return periodFilteredJobs.value.filter((job) =>
    [
      job.business_unit,
      job.department,
      job.main_position,
      job.required_date,
      job.approval_director_hrd_date,
      job.closed_date,
      vacancyFlowStatusLabel(job),
      job.vacancy_candidate_count,
      job.vacancy_interview_scheduled_count,
      job.passed_candidate_name,
    ]
      .map(normalize)
      .join(' ')
      .includes(query),
  )
})

function compareJobs(
  left: EmployeeRequestForm,
  right: EmployeeRequestForm,
  activeSortKey: VacancyPipelineSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'required_date':
      return compareNullableValues(
        parseSortDate(left.approval_director_hrd_date),
        parseSortDate(right.approval_director_hrd_date),
        direction,
      )
    case 'status':
      return compareNullableValues(vacancyFlowStatusLabel(left), vacancyFlowStatusLabel(right), direction)
    case 'vacancy_candidate_count':
    case 'vacancy_interview_scheduled_count':
      return compareNullableValues(
        Number(left[activeSortKey] ?? 0),
        Number(right[activeSortKey] ?? 0),
        direction,
      )
    default:
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
  }
}

const sortedJobs = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredJobs.value

  return [...filteredJobs.value].sort((left, right) =>
    compareJobs(left, right, activeSortKey, sortDirection.value))
})

function formatInterviewDateList(value: string | null | undefined) {
  const source = String(value ?? '').trim()
  if (!source) return '-'

  return source
    .split(',')
    .map((item) => formatDateDisplay(item.trim()))
    .filter((item) => item !== '-')
    .join(', ') || '-'
}

function firstNonEmpty<T>(...values: Array<T | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string') {
      if (value.trim()) return value as T
      continue
    }

    if (value !== null && value !== undefined) {
      return value
    }
  }

  return null
}

function normalizeCandidateIdentity(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function createSelectedCandidateKeySet(employeeRequestForm: EmployeeRequestForm | null) {
  const keys = new Set<string>()
  const selectedCandidates = String(employeeRequestForm?.passed_candidate_name ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  for (const candidate of selectedCandidates) {
    keys.add(normalizeCandidateIdentity(candidate))
  }

  return keys
}

const selectedPipelineCandidates = computed(() => {
  const selectedCandidateKeys = createSelectedCandidateKeySet(selectedDetailEmployeeRequestForm.value)

  return detailCandidateRows.value
    .map((candidate) => {
      const name = String(candidate.full_name ?? candidate.email ?? '').trim() || '-'
      const isSelected =
        selectedCandidateKeys.has(normalizeCandidateIdentity(candidate.full_name)) ||
        selectedCandidateKeys.has(normalizeCandidateIdentity(candidate.email))

      return {
        id: String(candidate.id ?? '').trim() || String(candidate.email ?? '').trim() || name,
        name,
        interviewDate: formatInterviewDateList((candidate.interview_dates ?? []).join(',')),
        isSelected,
      }
    })
    .sort((left, right) => Number(right.isSelected) - Number(left.isSelected))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedJobs.value.length / pageSize)))
const pagedJobs = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedJobs.value.slice(start, start + pageSize)
})

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

function extractDisplayName(value: string | null | undefined) {
  const textValue = String(value ?? '').trim()
  if (!textValue) return '-'

  return textValue.split(' - ')[0]?.trim() || textValue
}

function buildApprovalDetailFields(job: EmployeeRequestForm) {
  const approvalSteps = Array.isArray(job.approval_steps)
    ? [...job.approval_steps]
        .filter((step) => Number(step.step_order ?? 0) > 0)
        .sort((left, right) => left.step_order - right.step_order)
    : []

  if (approvalSteps.length > 0) {
    return approvalSteps.flatMap((step) => [
      {
        key: `approval-step-${step.step_order}-approver`,
        label: String(step.approval_role_label ?? '').trim() || `Approval Step ${step.step_order}`,
        value: extractDisplayName(step.approver_name),
      },
      {
        key: `approval-step-${step.step_order}-date`,
        label: text('approvals.tracking.fieldLabels.approvalDate'),
        value: formatDateDisplay(step.status === 'approved' ? step.approved_at : null),
      },
    ])
  }

  return [
    {
      key: 'approval-director-bu',
      label: text('approvals.tracking.fieldLabels.buDirectorApproval'),
      value: extractDisplayName(job.approval_director_bu),
    },
    {
      key: 'approval-director-bu-date',
      label: text('approvals.tracking.fieldLabels.approvalDate'),
      value: formatDateDisplay(job.approval_director_bu_date),
    },
    {
      key: 'approval-gm-hrd',
      label: text('approvals.tracking.fieldLabels.gmHrdApproval'),
      value: extractDisplayName(job.approval_gm_hrd),
    },
    {
      key: 'approval-gm-hrd-date',
      label: text('approvals.tracking.fieldLabels.approvalDate'),
      value: formatDateDisplay(job.approval_gm_hrd_date),
    },
    {
      key: 'approval-director-hrd',
      label: text('approvals.tracking.fieldLabels.hrDirectorApproval'),
      value: extractDisplayName(job.approval_director_hrd),
    },
    {
      key: 'approval-director-hrd-date',
      label: text('approvals.tracking.fieldLabels.approvalDate'),
      value: formatDateDisplay(job.approval_director_hrd_date),
    },
  ]
}

function resetActiveFilters() {
  searchQuery.value = ''
  periodStart.value = ''
  periodEnd.value = ''
  page.value = 1
}

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function vacancyFlowStatusBadgeClass(job: EmployeeRequestForm) {
  return recruitmentFlowStageBadgeClass(resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  }))
}

function vacancyFlowStatusLabel(job: EmployeeRequestForm) {
  return recruitmentFlowStageLabel(resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  }))
}

function rowNumber(index: number) {
  return (page.value - 1) * pageSize + index + 1
}

function toggleSort(key: string) {
  const nextKey = key as VacancyPipelineSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextKey
  sortDirection.value = ['required_date', 'vacancy_candidate_count', 'vacancy_interview_scheduled_count'].includes(nextKey)
    ? 'desc'
    : 'asc'
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function buildDetailFields(job: EmployeeRequestForm) {
  return [
    {
      key: 'request-date',
      label: text('approvals.tracking.fieldLabels.requestDate'),
      value: formatDateDisplay(job.requested_date || job.created_at),
    },
    {
      key: 'main-position',
      label: text('approvals.tracking.fieldLabels.mainPosition'),
      value: job.main_position || '-',
    },
    {
      key: 'department',
      label: text('approvals.tracking.fieldLabels.department'),
      value: String(stripLeadingNumberCode(job.department) ?? '').trim() || '-',
    },
    {
      key: 'designation',
      label: text('approvals.tracking.fieldLabels.designation'),
      value: String(stripLeadingNumberCode(job.designation) ?? '').trim() || '-',
    },
    {
      key: 'site',
      label: text('approvals.tracking.headers.site'),
      value: job.site || '-',
    },
    {
      key: 'working-location',
      label: text('approvals.tracking.fieldLabels.workingLocation'),
      value: job.working_location || '-',
    },
    {
      key: 'required-date',
      label: text('approvals.tracking.fieldLabels.requiredDate'),
      value: formatDateDisplay(job.required_date),
    },
    {
      key: 'employment-status',
      label: text('approvals.tracking.fieldLabels.employmentStatus'),
      value: job.employment_status || '-',
    },
    {
      key: 'cost-center-pt',
      label: text('approvals.tracking.fieldLabels.costCenterPt'),
      value: job.pt_pembebanan || '-',
    },
    {
      key: 'probation-period',
      label: text('approvals.tracking.fieldLabels.probationPeriod'),
      value: job.periode_probation
        ? text('approvals.tracking.fieldLabels.probationMonths', { months: job.periode_probation })
        : '-',
    },
    {
      key: 'direct-head',
      label: text('approvals.tracking.fieldLabels.directHead'),
      value: extractDisplayName(job.direct_manager),
    },
    {
      key: 'position-status',
      label: text('approvals.tracking.fieldLabels.positionStatus'),
      value: job.position_status || '-',
    },
    {
      key: 'recruiter',
      label: text('common.labels.recruiter'),
      value: extractDisplayName(job.recruiter_name),
    },
    ...buildApprovalDetailFields(job),
  ]
}

const selectedDetailFields = computed(() =>
  selectedDetailEmployeeRequestForm.value
    ? buildDetailFields(selectedDetailEmployeeRequestForm.value)
    : [],
)

function createEmptyAttachmentPreviewState(): Record<
  ErfAttachmentFieldKey,
  Array<{ path: string; name: string; url: string }>
> {
  return {
    organizational_structure: [],
    job_description: [],
  }
}

const detailAttachmentSections = computed(() => [
  {
    key: 'organizational_structure' as const,
    label: text('approvals.tracking.attachments.organizationalStructure'),
    items: detailAttachmentPreviews.value.organizational_structure,
  },
  {
    key: 'job_description' as const,
    label: text('approvals.tracking.attachments.jobDescription'),
    items: detailAttachmentPreviews.value.job_description,
  },
])

function normalizeAttachmentPaths(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getAttachmentPaths(fieldKey: ErfAttachmentFieldKey) {
  return normalizeAttachmentPaths(selectedDetailEmployeeRequestForm.value?.[fieldKey])
}

function getAttachmentFileExtension(value: string) {
  const source = String(value ?? '').trim()
  if (!source) return ''

  const sanitizedSource = source.split('?')[0]?.split('#')[0] ?? source
  const fileName = sanitizedSource.split('/').pop() ?? sanitizedSource
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (!/^[a-z0-9]{1,10}$/.test(extension)) {
    return ''
  }

  return extension
}

function getAttachmentTitle(fieldKey: ErfAttachmentFieldKey) {
  if (fieldKey === 'organizational_structure') {
    return text('approvals.tracking.attachments.organizationalStructure')
  }

  return text('approvals.tracking.attachments.jobDescription')
}

function getAttachmentFileName(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  index: number,
  totalItems: number,
) {
  const title = getAttachmentTitle(fieldKey)
  const suffix = totalItems > 1 ? ` ${index + 1}` : ''
  const extension = getAttachmentFileExtension(path)

  return extension ? `${title}${suffix}.${extension}` : `${title}${suffix}`
}

function createAttachmentPreview(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  url: string,
  index: number,
  totalItems: number,
) {
  return {
    path,
    name: getAttachmentFileName(fieldKey, path, index, totalItems),
    url,
  }
}

async function resolveAttachmentPreview(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  index: number,
  totalItems: number,
) {
  const normalizedPath = String(path ?? '').trim()

  if (!normalizedPath) {
    return createAttachmentPreview(fieldKey, '', '', index, totalItems)
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return createAttachmentPreview(fieldKey, normalizedPath, normalizedPath, index, totalItems)
  }

  const { data, error } = await supabase.storage
    .from(erfDocumentBucket)
    .createSignedUrl(normalizedPath, 60 * 60)

  return createAttachmentPreview(
    fieldKey,
    normalizedPath,
    error ? '' : data.signedUrl,
    index,
    totalItems,
  )
}

async function syncDetailAttachmentPreviews() {
  const requestId = ++detailAttachmentPreviewRequestId
  const hasAnyAttachment =
    getAttachmentPaths('organizational_structure').length > 0 ||
    getAttachmentPaths('job_description').length > 0

  if (!hasAnyAttachment) {
    detailAttachmentPreviews.value = createEmptyAttachmentPreviewState()
    loadingDetailAttachmentPreviews.value = false
    return
  }

  loadingDetailAttachmentPreviews.value = true

  try {
    const nextState = createEmptyAttachmentPreviewState()
    const organizationalStructurePaths = getAttachmentPaths('organizational_structure')
    const jobDescriptionPaths = getAttachmentPaths('job_description')

    const [organizationalStructure, jobDescription] = await Promise.all([
      Promise.all(
        organizationalStructurePaths.map((path, index) =>
          resolveAttachmentPreview(
            'organizational_structure',
            path,
            index,
            organizationalStructurePaths.length,
          ),
        ),
      ),
      Promise.all(
        jobDescriptionPaths.map((path, index) =>
          resolveAttachmentPreview(
            'job_description',
            path,
            index,
            jobDescriptionPaths.length,
          ),
        ),
      ),
    ])

    nextState.organizational_structure = organizationalStructure
    nextState.job_description = jobDescription

    if (requestId !== detailAttachmentPreviewRequestId) return

    detailAttachmentPreviews.value = nextState
  } finally {
    if (requestId === detailAttachmentPreviewRequestId) {
      loadingDetailAttachmentPreviews.value = false
    }
  }
}

async function syncDetailPipelineCandidates(employeeRequestFormId: string, requestId: number) {
  loadingDetailCandidates.value = true
  detailCandidatesError.value = ''

  try {
    const payload = await callBackendApi<{
      candidates?: Array<{
        id?: string | null
        full_name?: string | null
        email?: string | null
        interview_dates?: string[] | null
      }>
    }>(`/api/employee-request-forms/${encodeURIComponent(employeeRequestFormId)}/pipeline-candidates`)

    if (requestId !== detailModalRequestId) return

    detailCandidateRows.value = payload.candidates ?? []
  } catch (error) {
    if (requestId !== detailModalRequestId) return

    detailCandidateRows.value = []
    detailCandidatesError.value = text('vacancyPipeline.detail.loadCandidatesFailed')
    console.error('Failed to load vacancy pipeline candidates:', error)
  } finally {
    if (requestId === detailModalRequestId) {
      loadingDetailCandidates.value = false
    }
  }
}

async function openDetailModal(job: EmployeeRequestForm) {
  if (!canOpenDetailModal.value) return

  const requestId = ++detailModalRequestId
  showDetailModal.value = true
  selectedDetailEmployeeRequestForm.value = job
  detailCandidateRows.value = []
  detailCandidatesError.value = ''
  loadingDetailJobId.value = job.id

  void syncDetailAttachmentPreviews()
  void syncDetailPipelineCandidates(job.id, requestId)

  const detailResult = await getById(job.id).catch((error) => error)

  if (requestId !== detailModalRequestId) {
    return
  }

  if (!(detailResult instanceof Error) && detailResult) {
    selectedDetailEmployeeRequestForm.value = {
      ...job,
      ...detailResult,
      approval_steps: Array.isArray(detailResult.approval_steps)
        ? detailResult.approval_steps
        : (job.approval_steps ?? []),
      passed_candidate_name: firstNonEmpty(detailResult.passed_candidate_name, job.passed_candidate_name),
      passed_candidate_interview_date: firstNonEmpty(
        detailResult.passed_candidate_interview_date,
        job.passed_candidate_interview_date,
      ),
      recruiter_name: firstNonEmpty(detailResult.recruiter_name, job.recruiter_name),
      recruiter_user_id: firstNonEmpty(detailResult.recruiter_user_id, job.recruiter_user_id),
      approval_director_bu: firstNonEmpty(detailResult.approval_director_bu, job.approval_director_bu),
      approval_director_bu_date: firstNonEmpty(
        detailResult.approval_director_bu_date,
        job.approval_director_bu_date,
      ),
      approval_gm_hrd: firstNonEmpty(detailResult.approval_gm_hrd, job.approval_gm_hrd),
      approval_gm_hrd_date: firstNonEmpty(detailResult.approval_gm_hrd_date, job.approval_gm_hrd_date),
      approval_director_hrd: firstNonEmpty(detailResult.approval_director_hrd, job.approval_director_hrd),
      approval_director_hrd_date: firstNonEmpty(
        detailResult.approval_director_hrd_date,
        job.approval_director_hrd_date,
      ),
    }
    void syncDetailAttachmentPreviews()
  }

  loadingDetailJobId.value = ''
}

function closeDetailModal() {
  detailModalRequestId += 1
  detailAttachmentPreviewRequestId += 1
  showDetailModal.value = false
  selectedDetailEmployeeRequestForm.value = null
  detailCandidateRows.value = []
  detailCandidatesError.value = ''
  loadingDetailJobId.value = ''
  loadingDetailCandidates.value = false
  loadingDetailAttachmentPreviews.value = false
  detailAttachmentPreviews.value = createEmptyAttachmentPreviewState()
}

watch([searchQuery, periodStart, periodEnd], () => {
  page.value = 1
})

watch(
  () => filteredJobs.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)
</script>
