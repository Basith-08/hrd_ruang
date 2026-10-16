<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('approvals.tracking.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('approvals.tracking.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('approvals.tracking.description') }}
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :loading="loading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refreshChains"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="app-dashboard-panel-header">
        <ApprovalTrackingFilters
          v-model:search-query="searchQuery"
          v-model:status-filter="statusFilter"
          :status-options="statusSelectOptions"
          :search-label="text('common.labels.search')"
          :status-label="text('common.labels.status')"
          :search-placeholder="text('approvals.tracking.searchPlaceholder')"
          :status-placeholder="text('approvals.tracking.searchStatusPlaceholder')"
          :all-statuses-label="text('approvals.tracking.allStatuses')"
          :filter-eyebrow="text('approvals.tracking.filters.title')"
          :filter-title="text('approvals.tracking.filters.subtitle')"
          :reset-label="text('approvals.tracking.filters.reset')"
          :has-active-filters="hasActiveFilters"
          :tip="text('approvals.tracking.tip')"
          @reset="resetFilters"
        />
      </div>

      <ApprovalTrackingTable
        v-model:page="page"
        :chains="pagedChains"
        :filtered-count="sortedChains.length"
        :loading="loading"
        :page-size="pageSize"
        :columns="trackingTableColumns"
        :empty-label="text('common.noMatchingData')"
        :loading-label="text('common.loading')"
        :no-position-label="text('approvals.tracking.noPosition')"
        :format-date-time-display="formatDateTimeDisplay"
        :get-requested-at="getRequestedAt"
        :status-class-for-chain="statusClassForChain"
        :tracking-status-label="trackingStatusLabel"
        :can-toggle-tracking-collapse="canToggleTrackingCollapse"
        :is-tracking-expanded="isTrackingExpanded"
        :visible-tracking-stages="visibleTrackingStages"
        :can-open-tracking-stage="canOpenTrackingStage"
        :tracking-stage-border-class="trackingStageBorderClass"
        :tracking-stage-indicator-class="trackingStageIndicatorClass"
        :tracking-stage-badge-class="trackingStageBadgeClass"
        :tracking-stage-status-label="trackingStageStatusLabel"
        :sort-indicator="sortIndicator"
        @row-click="handleTrackingRowClick"
        @stage-click="handleTrackingStageClick"
        @sort="toggleSort"
      />
    </section>

    <ApprovalTrackingDetailModal
      v-if="selectedChain && selectedStep"
      :chain="selectedChain"
      :step="selectedStep"
      :detail-fields="selectedEmployeeRequestFormFields"
      :attachment-sections="erfAttachmentSections"
      :loading-files="loadingErfAttachmentPreviews"
      :eyebrow="text('approvals.tracking.detail.eyebrow')"
      :no-position-label="text('approvals.tracking.noPosition')"
      :close-label="text('common.actions.close')"
      :erf-detail-label="text('approvals.tracking.detail.erfDetail')"
      :loading-files-label="text('approvals.tracking.detail.loadingFiles')"
      :no-files-label="text('common.noFilesUploaded')"
      :file-click-hint-label="text('approvals.tracking.detail.fileClickHint')"
      :approval-scope-label="text('approvals.tracking.detail.approvalScope')"
      :approval-scope-text="selectedApprovalScopeText"
      :signed-in-as-text="
        text('approvals.tracking.detail.signedInAs', { email: user?.email || '-' })
      "
      :notice="selectedStepNotice"
      :can-approve="canApproveSelectedStep"
      :notes-label="text('approvals.tracking.detail.notes')"
      :note-value="selectedStepNote"
      :notes-placeholder="text('approvals.tracking.detail.notesPlaceholder')"
      :approve-label="saving ? text('common.processing') : text('common.actions.approve')"
      :reject-label="saving ? text('common.processing') : text('common.actions.reject')"
      :saving="saving"
      @close="closeStepDetail"
      @update:note-value="setSelectedStepNote"
      @approve="handleApprove"
      @reject="handleReject"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type {
  ApprovalChain,
  ApprovalChainStatus,
  ApprovalStep,
} from '@/domain/entities/ApprovalChain'
import type {
  EmployeeRequestForm,
  RecruitmentFlowStage,
} from '@/domain/entities/EmployeeRequestForm'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { supabase } from '@/infrastructure/supabase/client'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import { buildApprovalSummary } from '@/domain/utils/approvalSummary'
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '@/domain/utils/recruitmentFlowStage'
import ApprovalTrackingDetailModal from '@/features/approvals/components/ApprovalTrackingDetailModal.vue'
import ApprovalTrackingFilters from '@/features/approvals/components/ApprovalTrackingFilters.vue'
import ApprovalTrackingTable from '@/features/approvals/components/ApprovalTrackingTable.vue'
import {
  createApprovalTrackingPageFilterState,
  type ApprovalTrackingExpandedState,
  type ApprovalTrackingNotesState,
} from '@/features/approvals/ApprovalTrackingPage.state'
import type {
  ApprovalTrackingAttachmentSection,
  ApprovalTrackingColumn,
  ApprovalTrackingDetailField,
  ApprovalTrackingNotice,
  ApprovalTrackingSortKey,
  ApprovalTrackingSelectOption,
  ErfAttachmentFieldKey,
  ErfAttachmentPreviewItem,
  TrackingStageState,
  TrackingStage,
} from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { formatDateDisplay, formatDateTimeDisplay } from '@/presentation/utils/dateFormat'
import {
  compareNullableValues,
  parseSortDate,
  type TableSortDirection,
} from '@/presentation/utils/tableSort'
import { stripLeadingNumberCode } from '@/presentation/utils/textFormat'
import { useLocale } from '@/composables/useLocale'
import { useApprovalViewModel } from '@/viewmodels/useApprovalViewModel'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'

const { user, userRole, hasPermission, hasAnyPermission } = useAuthViewModel()
const { text } = useLocale()
const { chains, loading, saving, error, refreshChains, approveAssignedStep, rejectAssignedStep } =
  useApprovalViewModel()
const appToast = useAppToast()
const { erfDocumentBucket } = getPublicAppConfig()

type ApprovalTrackingStatusPayload = {
  recruitment_flow_stages?: Array<{
    employee_request_form_id: string
    stage: RecruitmentFlowStage | null
  }>
  vacancy_statuses?: Array<{
    employee_request_form_id: string
    status: EmployeeRequestForm['vacancy_status']
  }>
}

const initialFilterState = createApprovalTrackingPageFilterState()
const searchQuery = ref(initialFilterState.searchQuery)
const statusFilter = ref(initialFilterState.statusFilter)
const selectedChainId = ref(initialFilterState.selectedChainId)
const selectedStepId = ref(initialFilterState.selectedStepId)
const notesByStep = ref<ApprovalTrackingNotesState>({})
const expandedTrackingChains = ref<ApprovalTrackingExpandedState>({})
const collapsedStageLimit = 1
const pageSize = 5
const page = ref(initialFilterState.page)
const sortKey = ref<ApprovalTrackingSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const recruitmentFlowStageByEmployeeRequestFormId = ref<
  Record<string, RecruitmentFlowStage | null>
>({})
const vacancyStatusByEmployeeRequestFormId = ref<
  Record<string, EmployeeRequestForm['vacancy_status'] | null>
>({})
const recruitmentStatusLoadedByEmployeeRequestFormId = ref<Record<string, boolean>>({})
let approvalTrackingStatusRequestId = 0

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

const isAdminRole = computed(() => normalize(userRole.value) === 'super_admin')
const canUseApprovalAction = computed(() => hasPermission('approval:action'))
const canReadRecruitmentStatuses = computed(() =>
  hasAnyPermission([
    'approval:read',
    'employee_request_form:read',
    'recruitment:approved_erf_read',
  ]),
)

const statusOptions = computed(() => {
  const set = new Set<string>()
  for (const c of chains.value) {
    if (c.status) set.add(c.status)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const statusSelectOptions = computed<ApprovalTrackingSelectOption[]>(() =>
  statusOptions.value.map((opt) => ({
    value: opt,
    label: statusLabel(opt as ApprovalChainStatus),
  })),
)
const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim() || statusFilter.value))

const trackingTableColumns = computed<ApprovalTrackingColumn[]>(() => [
  { key: 'number', label: text('common.labels.no'), class: 'w-14' },
  {
    key: 'position',
    label: text('approvals.tracking.headers.position'),
    class: 'min-w-[220px]',
    sortable: true,
    sortableKey: 'position',
  },
  {
    key: 'site',
    label: text('approvals.tracking.headers.site'),
    class: 'min-w-[160px]',
    sortable: true,
    sortableKey: 'site',
  },
  {
    key: 'submitted',
    label: text('approvals.tracking.headers.submitted'),
    class: 'min-w-[180px]',
    sortable: true,
    sortableKey: 'submitted',
  },
  {
    key: 'approvalStatus',
    label: text('approvals.tracking.headers.approvalStatus'),
    class: 'min-w-[220px]',
    sortable: true,
    sortableKey: 'approvalStatus',
  },
  {
    key: 'approvalSteps',
    label: text('approvals.tracking.headers.approvalSteps'),
    class: 'min-w-[420px]',
  },
])

const filteredChains = computed(() => {
  const q = normalize(searchQuery.value)
  return chains.value.filter((c) => {
    if (statusFilter.value && c.status !== statusFilter.value) return false
    if (!q) return true

    const haystack = [
      c.employee_request_form?.main_position,
      c.employee_request_form?.site,
      c.employee_request_form?.department,
      c.employee_request_form?.designation,
      c.status,
      ...c.steps.map(
        (step) => `${approvalRoleLabel(c, step.step_order)} ${stepApproverName(step)}`,
      ),
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(q)
  })
})

function compareChains(
  left: ApprovalChain,
  right: ApprovalChain,
  activeSortKey: ApprovalTrackingSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'position':
      return compareNullableValues(
        left.employee_request_form?.main_position,
        right.employee_request_form?.main_position,
        direction,
      )
    case 'site':
      return compareNullableValues(
        left.employee_request_form?.site,
        right.employee_request_form?.site,
        direction,
      )
    case 'submitted':
      return compareNullableValues(
        parseSortDate(getRequestedAt(left)),
        parseSortDate(getRequestedAt(right)),
        direction,
      )
    case 'approvalStatus':
      return compareNullableValues(trackingStatusLabel(left), trackingStatusLabel(right), direction)
    default:
      return 0
  }
}

const sortedChains = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredChains.value

  return [...filteredChains.value].sort((left, right) =>
    compareChains(left, right, activeSortKey, sortDirection.value),
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedChains.value.length / pageSize)))
const pagedChains = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedChains.value.slice(start, start + pageSize)
})

const selectedChain = computed(
  () => chains.value.find((chain) => chain.id === selectedChainId.value) ?? null,
)
const selectedStep = computed(
  () => selectedChain.value?.steps.find((step) => step.id === selectedStepId.value) ?? null,
)
const loadingErfAttachmentPreviews = ref(false)
const erfAttachmentPreviews = ref<Record<ErfAttachmentFieldKey, ErfAttachmentPreviewItem[]>>(
  createEmptyErfAttachmentPreviewState(),
)
let erfAttachmentPreviewRequestId = 0

const erfAttachmentSections = computed<ApprovalTrackingAttachmentSection[]>(() => [
  {
    key: 'organizational_structure' as const,
    label: text('approvals.tracking.attachments.organizationalStructure'),
    items: erfAttachmentPreviews.value.organizational_structure,
  },
  {
    key: 'job_description' as const,
    label: text('approvals.tracking.attachments.jobDescription'),
    items: erfAttachmentPreviews.value.job_description,
  },
])

const canApproveSelectedStep = computed(() => {
  if (!selectedChain.value || !selectedStep.value) return false
  return canProcessStep(selectedChain.value, selectedStep.value)
})

const selectedEmployeeRequestFormFields = computed<ApprovalTrackingDetailField[]>(() =>
  selectedChain.value ? buildEmployeeRequestFormFields(selectedChain.value) : [],
)
const selectedApprovalScopeText = computed(() =>
  selectedStep.value
    ? `Step ${selectedStep.value.step_order} | ${stepApproverName(selectedStep.value)} | ${approvalRoleLabel(selectedChain.value, selectedStep.value.step_order)}`
    : '-',
)
const selectedStepNote = computed(() =>
  selectedStep.value ? notesByStep.value[selectedStep.value.id] || '' : '',
)
const selectedStepNotice = computed<ApprovalTrackingNotice>(() => {
  if (!selectedChain.value || !selectedStep.value) {
    return {
      text: '',
      className: 'app-state-card app-state-card-neutral',
    }
  }

  if (canApproveSelectedStep.value) {
    return {
      text: text('approvals.tracking.detail.readyForApproval'),
      className: 'app-state-card app-state-card-success',
    }
  }

  if (isAdminRole.value) {
    return {
      text: text('approvals.tracking.detail.adminNotice'),
      className: 'app-state-card app-state-card-neutral',
    }
  }

  if (isWaitingPreviousStage(selectedChain.value, selectedStep.value)) {
    return {
      text: text('approvals.tracking.detail.waitingPreviousStage'),
      className: 'app-state-card app-state-card-warning',
    }
  }

  if (selectedStep.value.status === 'approved') {
    return {
      text: text('approvals.tracking.detail.approvedOn', {
        date: formatDateTimeDisplay(selectedStep.value.approved_at),
      }),
      className: 'app-state-card app-state-card-accent',
    }
  }

  if (selectedStep.value.status === 'rejected') {
    return {
      text: text('approvals.tracking.detail.rejectedOn', {
        date: formatDateTimeDisplay(selectedStep.value.approved_at),
      }),
      className: 'app-state-card app-state-card-danger',
    }
  }

  return {
    text: text('approvals.tracking.detail.onlyOwnApproverEmail'),
    className: 'app-state-card app-state-card-neutral',
  }
})

function resetPage() {
  page.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  resetPage()
}

watch([searchQuery, statusFilter], resetPage)
watch(
  () => filteredChains.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)
watch(
  () =>
    chains.value
      .map((chain) =>
        [
          chain.id,
          chain.employee_request_form_id,
          chain.status,
          chain.updated_at,
          chain.employee_request_form?.recruitment_flow_stage ?? '',
          chain.steps
            .map((step) => `${step.id}:${step.status}:${step.approved_at ?? ''}`)
            .join(','),
        ].join('|'),
      )
      .join('||'),
  () => {
    void syncApprovalTrackingStatuses()
  },
  { immediate: true },
)
watch(selectedChain, () => {
  void syncSelectedChainAttachmentPreviews()
})

function createEmptyErfAttachmentPreviewState(): Record<
  ErfAttachmentFieldKey,
  ErfAttachmentPreviewItem[]
> {
  return {
    organizational_structure: [],
    job_description: [],
  }
}

function normalizeErfAttachmentPaths(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getErfAttachmentPaths(fieldKey: ErfAttachmentFieldKey) {
  return normalizeErfAttachmentPaths(selectedChain.value?.employee_request_form?.[fieldKey])
}

function getErfAttachmentFileExtension(value: string) {
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

function getErfAttachmentTitle(fieldKey: ErfAttachmentFieldKey) {
  if (fieldKey === 'organizational_structure') {
    return text('approvals.tracking.attachments.organizationalStructure')
  }

  return text('approvals.tracking.attachments.jobDescription')
}

function getErfAttachmentFileName(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  index: number,
  totalItems: number,
) {
  const title = getErfAttachmentTitle(fieldKey)
  const suffix = totalItems > 1 ? ` ${index + 1}` : ''
  const extension = getErfAttachmentFileExtension(path)

  return extension ? `${title}${suffix}.${extension}` : `${title}${suffix}`
}

function createErfAttachmentPreview(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  url: string,
  index: number,
  totalItems: number,
): ErfAttachmentPreviewItem {
  return {
    path,
    name: getErfAttachmentFileName(fieldKey, path, index, totalItems),
    url,
  }
}

async function resolveErfAttachmentPreview(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  index: number,
  totalItems: number,
) {
  const normalizedPath = String(path ?? '').trim()

  if (!normalizedPath) {
    return createErfAttachmentPreview(fieldKey, '', '', index, totalItems)
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return createErfAttachmentPreview(fieldKey, normalizedPath, normalizedPath, index, totalItems)
  }

  const { data, error } = await supabase.storage
    .from(erfDocumentBucket)
    .createSignedUrl(normalizedPath, 60 * 60)

  return createErfAttachmentPreview(
    fieldKey,
    normalizedPath,
    error ? '' : data.signedUrl,
    index,
    totalItems,
  )
}

async function syncSelectedChainAttachmentPreviews() {
  const requestId = ++erfAttachmentPreviewRequestId
  const hasAnyAttachment =
    getErfAttachmentPaths('organizational_structure').length > 0 ||
    getErfAttachmentPaths('job_description').length > 0

  if (!hasAnyAttachment) {
    erfAttachmentPreviews.value = createEmptyErfAttachmentPreviewState()
    loadingErfAttachmentPreviews.value = false
    return
  }

  loadingErfAttachmentPreviews.value = true

  try {
    const nextState = createEmptyErfAttachmentPreviewState()

    const organizationalStructurePaths = getErfAttachmentPaths('organizational_structure')
    const jobDescriptionPaths = getErfAttachmentPaths('job_description')
    const [organizationalStructure, jobDescription] = await Promise.all([
      Promise.all(
        organizationalStructurePaths.map((path, index) =>
          resolveErfAttachmentPreview(
            'organizational_structure',
            path,
            index,
            organizationalStructurePaths.length,
          ),
        ),
      ),
      Promise.all(
        jobDescriptionPaths.map((path, index) =>
          resolveErfAttachmentPreview('job_description', path, index, jobDescriptionPaths.length),
        ),
      ),
    ])

    nextState.organizational_structure = organizationalStructure
    nextState.job_description = jobDescription

    if (requestId !== erfAttachmentPreviewRequestId) {
      return
    }

    erfAttachmentPreviews.value = nextState
  } finally {
    if (requestId === erfAttachmentPreviewRequestId) {
      loadingErfAttachmentPreviews.value = false
    }
  }
}

function statusClass(status: ApprovalChainStatus) {
  const map: Record<ApprovalChainStatus, string> = {
    draft: 'app-status-chip-neutral',
    pending: 'app-status-chip-warning',
    approved: 'app-status-chip-success',
    rejected: 'app-status-chip-danger',
  }
  return map[status] || 'app-status-chip-neutral'
}

function statusClassForChain(chain: ApprovalChain) {
  const displayedFlowStage = resolveDisplayedFlowStage(chain)
  if (!displayedFlowStage) {
    return 'app-status-chip-neutral'
  }

  return recruitmentFlowStageBadgeClass(displayedFlowStage)
}

function resolveChainStatus(chain: ApprovalChain): ApprovalChainStatus {
  if (chain.status === 'draft' || chain.status === 'approved') {
    return chain.status
  }
  if (isRejectedChain(chain)) {
    return 'rejected'
  }
  return 'pending'
}

function statusLabel(status: ApprovalChainStatus) {
  const map: Record<ApprovalChainStatus, string> = {
    draft: text('approvals.tracking.statusLabels.requested'),
    pending: text('approvals.tracking.statusLabels.pendingApproval'),
    approved: text('approvals.tracking.statusLabels.requestApproved'),
    rejected: text('approvals.tracking.statusLabels.requestRejected'),
  }
  return map[status] || status
}

function toggleSort(key: ApprovalTrackingSortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = key === 'submitted' ? 'desc' : 'asc'
}

function sortIndicator(key: ApprovalTrackingSortKey) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function approvalStatusPrefixFromStepOrder(stepOrder: number) {
  return String.fromCharCode(65 + stepOrder)
}

function approvalRoleLabel(chain: ApprovalChain | null | undefined, stepOrder: number) {
  const storedLabel = String(
    chain?.steps.find((item) => item.step_order === stepOrder)?.approval_role_label ?? '',
  ).trim()

  if (storedLabel) {
    return storedLabel
  }

  return text('approvals.tracking.stepRoles.step', { number: stepOrder })
}

function stepApproverName(step: ApprovalStep) {
  return String(step.approver_name ?? step.approver_email ?? '').trim() || '-'
}

function stepAssignedToCurrentUser(step: ApprovalStep) {
  return normalize(step.approver_email) === normalize(user.value?.email)
}

function arePreviousStepsApproved(chain: ApprovalChain, step: ApprovalStep) {
  return chain.steps
    .filter((item) => item.step_order < step.step_order)
    .every((item) => item.status === 'approved')
}

function canOpenStepDetail(step: ApprovalStep) {
  return isAdminRole.value || stepAssignedToCurrentUser(step)
}

function canProcessStep(chain: ApprovalChain, step: ApprovalStep) {
  if (!canUseApprovalAction.value) return false
  if (step.status !== 'pending') return false
  if (!arePreviousStepsApproved(chain, step)) return false
  return stepAssignedToCurrentUser(step)
}

function isWaitingPreviousStage(chain: ApprovalChain, step: ApprovalStep) {
  if (!stepAssignedToCurrentUser(step)) return false
  if (step.status !== 'pending') return false
  return !arePreviousStepsApproved(chain, step)
}

function getCurrentPendingStep(chain: ApprovalChain) {
  if (isRejectedChain(chain)) {
    return null
  }

  return chain.steps.find((step) => step.status === 'pending') ?? null
}

function getRejectedStep(chain: ApprovalChain) {
  return chain.steps.find((step) => step.status === 'rejected') ?? null
}

function isRejectedChain(chain: ApprovalChain) {
  return chain.status === 'rejected' || getRejectedStep(chain) !== null
}

function getFinalStatusDate(chain: ApprovalChain) {
  if (chain.status === 'approved') {
    const approvedSteps = [...chain.steps]
      .filter((step) => step.status === 'approved')
      .sort((left, right) => left.step_order - right.step_order)
    const latestApprovedStep = approvedSteps[approvedSteps.length - 1]

    return latestApprovedStep?.approved_at ?? null
  }

  if (isRejectedChain(chain)) {
    return getRejectedStep(chain)?.approved_at ?? null
  }

  return null
}

function getRequestedAt(chain: ApprovalChain) {
  return (
    chain.employee_request_form?.requested_date ??
    chain.employee_request_form?.created_at ??
    chain.created_at
  )
}

async function syncApprovalTrackingStatuses() {
  const requestId = ++approvalTrackingStatusRequestId
  const employeeRequestFormIds = Array.from(
    new Set(chains.value.map((chain) => chain.employee_request_form_id).filter(Boolean)),
  )

  if (!canReadRecruitmentStatuses.value || employeeRequestFormIds.length === 0) {
    recruitmentFlowStageByEmployeeRequestFormId.value = {}
    vacancyStatusByEmployeeRequestFormId.value = {}
    recruitmentStatusLoadedByEmployeeRequestFormId.value = {}
    return
  }

  recruitmentStatusLoadedByEmployeeRequestFormId.value = Object.fromEntries(
    employeeRequestFormIds.map((employeeRequestFormId) => [employeeRequestFormId, false]),
  )

  try {
    const payload = await callBackendApi<ApprovalTrackingStatusPayload>(
      '/api/employee-request-forms/list-statuses',
      {
        method: 'POST',
        body: JSON.stringify({
          employee_request_form_ids: employeeRequestFormIds,
        }),
      },
    )

    if (requestId !== approvalTrackingStatusRequestId) {
      return
    }

    const nextRecruitmentFlowStages: Record<string, RecruitmentFlowStage | null> = {}
    const nextVacancyStatuses: Record<string, EmployeeRequestForm['vacancy_status'] | null> = {}

    for (const item of payload.recruitment_flow_stages ?? []) {
      const employeeRequestFormId = String(item.employee_request_form_id ?? '').trim()
      if (employeeRequestFormId) {
        nextRecruitmentFlowStages[employeeRequestFormId] = item.stage ?? null
      }
    }

    for (const item of payload.vacancy_statuses ?? []) {
      const employeeRequestFormId = String(item.employee_request_form_id ?? '').trim()
      if (employeeRequestFormId) {
        nextVacancyStatuses[employeeRequestFormId] = item.status ?? null
      }
    }

    recruitmentFlowStageByEmployeeRequestFormId.value = nextRecruitmentFlowStages
    vacancyStatusByEmployeeRequestFormId.value = nextVacancyStatuses
    recruitmentStatusLoadedByEmployeeRequestFormId.value = Object.fromEntries(
      employeeRequestFormIds.map((employeeRequestFormId) => [employeeRequestFormId, true]),
    )
  } catch (err) {
    console.error('Failed to load approval tracking recruitment statuses:', err)

    if (requestId === approvalTrackingStatusRequestId) {
      recruitmentFlowStageByEmployeeRequestFormId.value = {}
      vacancyStatusByEmployeeRequestFormId.value = {}
      recruitmentStatusLoadedByEmployeeRequestFormId.value = Object.fromEntries(
        employeeRequestFormIds.map((employeeRequestFormId) => [employeeRequestFormId, true]),
      )
    }
  }
}

function resolveTrackingStageState(
  step: ApprovalStep,
  currentPendingStep: ApprovalStep | null,
): TrackingStageState {
  if (step.status === 'approved') return 'completed'
  if (step.status === 'rejected') return 'rejected'
  if (currentPendingStep?.id === step.id) return 'current'
  return 'upcoming'
}

function buildTrackingStages(chain: ApprovalChain): TrackingStage[] {
  const currentPendingStep = getCurrentPendingStep(chain)
  const rejectedChain = isRejectedChain(chain)
  const approvalStages = chain.steps.map((step) => ({
    key: step.id,
    order: step.step_order + 1,
    label:
      resolveTrackingStageState(step, currentPendingStep) === 'completed'
        ? text('approvals.tracking.stageLabels.approved')
        : resolveTrackingStageState(step, currentPendingStep) === 'rejected'
          ? text('approvals.tracking.stageLabels.rejected')
          : rejectedChain
            ? text('approvals.tracking.stageLabels.notReached')
            : text('approvals.tracking.stageLabels.waitingFor'),
    actor: `Step ${step.step_order} | ${stepApproverName(step)} | ${approvalRoleLabel(chain, step.step_order)}`,
    note: step.notes?.trim() || null,
    date: step.approved_at,
    state: resolveTrackingStageState(step, currentPendingStep),
    stepId: step.id,
  }))

  const finalState: TrackingStageState =
    chain.status === 'approved' ? 'completed' : rejectedChain ? 'rejected' : 'upcoming'

  return [
    {
      key: `${chain.id}-requested`,
      order: 1,
      label: text('approvals.tracking.stageLabels.requested'),
      actor: null,
      note: null,
      date: getRequestedAt(chain),
      state: 'completed',
      stepId: null,
    },
    ...approvalStages,
    {
      key: `${chain.id}-final`,
      order: chain.steps.length + 2,
      label: rejectedChain
        ? text('approvals.tracking.stageLabels.requestRejected')
        : text('approvals.tracking.stageLabels.requestApproved'),
      actor: null,
      note: null,
      date: getFinalStatusDate(chain),
      state: finalState,
      stepId: null,
    },
  ]
}

function isTrackingExpanded(chainId: string) {
  return expandedTrackingChains.value[chainId] === true
}

function toggleTrackingCollapse(chainId: string) {
  expandedTrackingChains.value = {
    ...expandedTrackingChains.value,
    [chainId]: !isTrackingExpanded(chainId),
  }
}

function canToggleTrackingCollapse(chain: ApprovalChain) {
  return buildTrackingStages(chain).length > collapsedStageLimit
}

function handleTrackingRowClick(chain: ApprovalChain) {
  if (!canToggleTrackingCollapse(chain)) {
    return
  }

  toggleTrackingCollapse(chain.id)
}

function handleTrackingStageClick(chain: ApprovalChain, stage: TrackingStage) {
  if (canOpenTrackingStage(chain, stage)) {
    openTrackingStageDetail(chain.id, stage)
  }
}

function visibleTrackingStages(chain: ApprovalChain) {
  const stages = buildTrackingStages(chain)
  if (isTrackingExpanded(chain.id)) {
    return stages
  }

  return stages.slice(0, collapsedStageLimit)
}

function trackingStatusLabel(chain: ApprovalChain) {
  const displayedFlowStage = resolveDisplayedFlowStage(chain)
  if (!displayedFlowStage) {
    return text('common.loading')
  }

  return recruitmentFlowStageLabel(displayedFlowStage)
}

function resolveDisplayedFlowStage(chain: ApprovalChain) {
  if (
    canReadRecruitmentStatuses.value &&
    !recruitmentStatusLoadedByEmployeeRequestFormId.value[chain.employee_request_form_id]
  ) {
    return null
  }

  const latestRecruitmentFlowStage =
    recruitmentFlowStageByEmployeeRequestFormId.value[chain.employee_request_form_id] ?? null

  if (latestRecruitmentFlowStage) {
    return latestRecruitmentFlowStage
  }

  return resolveFlowStage(chain)
}

function resolveFlowStage(chain: ApprovalChain) {
  const latestRecruitmentFlowStage =
    recruitmentFlowStageByEmployeeRequestFormId.value[chain.employee_request_form_id] ?? null
  const latestVacancyStatus =
    vacancyStatusByEmployeeRequestFormId.value[chain.employee_request_form_id] ?? null
  const approvalSummary = buildApprovalSummary(
    chain.steps,
    chain.employee_request_form ?? undefined,
  )
  const persistedRecruitmentFlowStage = normalizeRecruitmentFlowStage(
    chain.employee_request_form?.recruitment_flow_stage ?? null,
  )
  const shouldIgnoreStaleApprovedStageFallback =
    chain.status === 'approved' &&
    ['erf_requested', 'approval_in_progress'].includes(String(persistedRecruitmentFlowStage ?? ''))
  const shouldIgnoreApprovedStageFallback =
    chain.status === 'approved' &&
    !latestRecruitmentFlowStage &&
    ['sourcing', 'interview', 'accepted'].includes(String(latestVacancyStatus ?? ''))
  const preferredRecruitmentFlowStage =
    chain.status === 'approved'
      ? (latestRecruitmentFlowStage ??
        (shouldIgnoreApprovedStageFallback
          ? null
          : shouldIgnoreStaleApprovedStageFallback
            ? null
            : (chain.employee_request_form?.recruitment_flow_stage ?? null)))
      : (chain.employee_request_form?.recruitment_flow_stage ?? latestRecruitmentFlowStage)
  const recruitmentFlowStage = normalizeRecruitmentFlowStage(preferredRecruitmentFlowStage)
  const resolvedEmployeeRequestForm: Partial<EmployeeRequestForm> | null =
    chain.employee_request_form
      ? {
          status: chain.employee_request_form.status ?? undefined,
          closed_category: chain.employee_request_form.closed_category,
          recruitment_flow_stage: recruitmentFlowStage,
          approval_director_bu_date: approvalSummary.approval_director_bu_date,
          approval_gm_hrd_date: approvalSummary.approval_gm_hrd_date,
          approval_director_hrd_date: approvalSummary.approval_director_hrd_date,
          vacancy_status: latestVacancyStatus ?? chain.employee_request_form.vacancy_status ?? null,
        }
      : null

  return resolveRecruitmentFlowStage({
    employeeRequestForm: resolvedEmployeeRequestForm,
    approvalChain: chain,
  })
}

function normalizeRecruitmentFlowStage(value: unknown): RecruitmentFlowStage | null | undefined {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) {
    return null
  }

  const knownStages = new Set<RecruitmentFlowStage>([
    'erf_requested',
    'approval_in_progress',
    'erf_approved',
    'assign_recruiter',
    'candidate_sourcing',
    'assessment_list_created',
    'interview_scheduled',
    'interview_evaluation_in_progress',
    'interview_evaluation_completed',
    'candidate_selected',
    'employee_contract_form_in_progress',
    'hiring_completed',
    'closed',
    'rejected',
  ])

  if (
    [
      'approval_in_progress',
      'waiting_bu_director_approval',
      'waiting_gm_hrd_approval',
      'waiting_hr_director_approval',
    ].includes(normalizedValue)
  ) {
    return 'approval_in_progress'
  }

  return knownStages.has(normalizedValue as RecruitmentFlowStage)
    ? (normalizedValue as RecruitmentFlowStage)
    : null
}

function trackingStageBorderClass(state: TrackingStageState) {
  const map: Record<TrackingStageState, string> = {
    completed: 'app-state-card-success',
    current: 'app-state-card-warning',
    upcoming: 'app-state-card-neutral',
    rejected: 'app-state-card-danger',
  }
  return map[state]
}

function trackingStageIndicatorClass(state: TrackingStageState) {
  const map: Record<TrackingStageState, string> = {
    completed: 'app-stage-indicator-success',
    current: 'app-stage-indicator-warning',
    upcoming: 'app-stage-indicator-neutral',
    rejected: 'app-stage-indicator-danger',
  }
  return map[state]
}

function trackingStageBadgeClass(state: TrackingStageState) {
  const map: Record<TrackingStageState, string> = {
    completed: 'app-status-chip-success',
    current: 'app-status-chip-warning',
    upcoming: 'app-status-chip-neutral',
    rejected: 'app-status-chip-danger',
  }
  return map[state]
}

function trackingStageStatusLabel(stage: TrackingStage, chain: ApprovalChain) {
  if (stage.state === 'upcoming' && isRejectedChain(chain)) {
    return text('approvals.tracking.stageStatus.notReached')
  }

  const map: Record<TrackingStageState, string> = {
    completed: text('approvals.tracking.stageStatus.done'),
    current: text('approvals.tracking.stageStatus.current'),
    upcoming: text('approvals.tracking.stageStatus.pending'),
    rejected: text('approvals.tracking.stageLabels.rejected'),
  }
  return map[stage.state]
}

function extractDisplayName(value: string | null | undefined) {
  const text = String(value ?? '').trim()
  if (!text) return '-'

  return text.split(' - ')[0]?.trim() || text
}

function buildEmployeeRequestFormFields(chain: ApprovalChain) {
  const employeeRequestForm = chain.employee_request_form
  const approvalFields = chain.steps.flatMap((step) => [
    {
      label: approvalRoleLabel(chain, step.step_order),
      value: stepApproverName(step),
    },
    {
      label: text('approvals.tracking.fieldLabels.approvalDate'),
      value: formatDateTimeDisplay(step.status === 'approved' ? step.approved_at : null),
    },
  ])

  return [
    {
      label: text('approvals.tracking.fieldLabels.requestDate'),
      value: formatDateDisplay(
        employeeRequestForm?.requested_date ||
          employeeRequestForm?.created_at ||
          chain.created_at ||
          null,
      ),
    },
    {
      label: text('approvals.tracking.fieldLabels.mainPosition'),
      value: employeeRequestForm?.main_position || '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.department'),
      value: String(stripLeadingNumberCode(employeeRequestForm?.department) ?? '').trim() || '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.designation'),
      value: String(stripLeadingNumberCode(employeeRequestForm?.designation) ?? '').trim() || '-',
    },
    { label: text('approvals.tracking.headers.site'), value: employeeRequestForm?.site || '-' },
    {
      label: text('approvals.tracking.fieldLabels.workingLocation'),
      value: employeeRequestForm?.working_location || '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.requiredDate'),
      value: formatDateDisplay(employeeRequestForm?.required_date || null),
    },
    {
      label: text('approvals.tracking.fieldLabels.employmentStatus'),
      value: employeeRequestForm?.employment_status || '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.costCenterPt'),
      value: employeeRequestForm?.pt_pembebanan || '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.probationPeriod'),
      value: employeeRequestForm?.periode_probation
        ? text('approvals.tracking.fieldLabels.probationMonths', {
            months: employeeRequestForm.periode_probation,
          })
        : '-',
    },
    {
      label: text('approvals.tracking.fieldLabels.directHead'),
      value: extractDisplayName(employeeRequestForm?.direct_manager),
    },
    {
      label: text('approvals.tracking.fieldLabels.positionStatus'),
      value: employeeRequestForm?.position_status || '-',
    },
    ...approvalFields,
  ]
}

function getTrackingStageStep(chain: ApprovalChain, stage: TrackingStage) {
  if (!stage.stepId) return null
  return chain.steps.find((step) => step.id === stage.stepId) ?? null
}

function canOpenTrackingStage(chain: ApprovalChain, stage: TrackingStage) {
  const step = getTrackingStageStep(chain, stage)
  if (!step) return false
  return canOpenStepDetail(step)
}

function openTrackingStageDetail(chainId: string, stage: TrackingStage) {
  if (!stage.stepId) return
  openStepDetail(chainId, stage.stepId)
}

function openStepDetail(chainId: string, stepId: string) {
  const chain = chains.value.find((item) => item.id === chainId)
  const step = chain?.steps.find((item) => item.id === stepId)
  if (!chain || !step || !canOpenStepDetail(step)) return

  selectedChainId.value = chainId
  selectedStepId.value = stepId
}

function closeStepDetail() {
  selectedChainId.value = ''
  selectedStepId.value = ''
}

function setSelectedStepNote(value: string) {
  if (!selectedStep.value) return

  notesByStep.value = {
    ...notesByStep.value,
    [selectedStep.value.id]: value,
  }
}

async function handleApprove() {
  if (!selectedStep.value) return

  try {
    await approveAssignedStep(
      selectedStep.value.id,
      notesByStep.value[selectedStep.value.id] || undefined,
    )
    await syncApprovalTrackingStatuses()
    appToast.success(text('approvals.tracking.toasts.approved'))
    closeStepDetail()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : text('approvals.tracking.toasts.approvedFailed')
    appToast.error(message)
  }
}

async function handleReject() {
  if (!selectedStep.value) return

  try {
    await rejectAssignedStep(
      selectedStep.value.id,
      notesByStep.value[selectedStep.value.id] || undefined,
    )
    await syncApprovalTrackingStatuses()
    appToast.success(text('approvals.tracking.toasts.rejected'))
    closeStepDetail()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : text('approvals.tracking.toasts.rejectedFailed')
    appToast.error(message)
  }
}
</script>
