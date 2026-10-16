<template>
  <div class="flex w-full flex-col gap-4">
    <AppAlert :message="combinedError" />

    <RecruitmentDashboardHero
      :eyebrow="text('recruitment.dashboard.eyebrow')"
      :title="text('recruitment.dashboard.title')"
      :description="text('recruitment.dashboard.description')"
      :status-label="text('common.labels.status')"
      :last-updated-label="text('recruitment.dashboard.lastUpdated')"
      :last-updated-value="lastUpdatedDisplay"
      :status-mode="statusMode"
      :status-modes="statusModes"
      :loading="loading"
      :refresh-label="text('common.actions.refresh')"
      :loading-label="text('common.loading')"
      :export-excel-label="text('common.actions.exportExcel')"
      :new-erf-label="text('employeeRequestForms.list.actions.createErf')"
      :create-erf-href="createErfHref"
      :show-export="detailRows.length > 0"
      :all-label="text('common.status.all')"
      :department-label="text('common.labels.department')"
      :department-filter="selectedDepartment"
      :department-options="departmentOptions"
      :level-label="text('recruitment.dashboard.filters.level')"
      :level-filter="selectedLevel"
      :level-options="levelOptions"
      :recruiter-label="text('common.labels.recruiter')"
      :recruiter-filter="detailRecruiterFilter"
      :recruiter-options="detailRecruiterOptions"
      :from-label="text('common.labels.from')"
      :to-label="text('common.labels.to')"
      :period-start="detailPeriodStart"
      :period-end="detailPeriodEnd"
      :current-month-label="text('recruitment.dashboard.detail.currentMonth')"
      :reset-all-label="text('recruitment.dashboard.filters.resetAll')"
      @update:status-mode="statusMode = $event"
      @refresh="handleRefresh"
      @export-excel="handleDetailExportExcel"
      @update:department-filter="selectedDepartment = $event"
      @update:level-filter="selectedLevel = $event"
      @update:recruiter-filter="detailRecruiterFilter = $event"
      @update:period-start="detailPeriodStart = $event"
      @update:period-end="detailPeriodEnd = $event"
      @reset-current-month="resetDetailFiltersToCurrentMonth"
      @reset-all="resetDetailFiltersToAll"
    />

    <RecruitmentDashboardStatusSummary
      :summary-title="text('recruitment.dashboard.summaryCard.title', { status: statusModeLabel })"
      :summary-description="text('recruitment.dashboard.summaryCard.description', { status: statusModeDescriptionLabel })"
      :total-count="summaryPositionsCount"
      :current-month-count="currentMonthPositionsCount"
      :average-age-days="averageStatusAgeDays"
      :current-month-label="text('recruitment.dashboard.summaryCard.thisMonth')"
      :average-age-label="text('recruitment.dashboard.summaryCard.averageAge', { status: statusModeLabel })"
      :recruiter-ownership-title="text('recruitment.dashboard.summaryCard.recruiterOwnership')"
      :recruiter-ownership-items="recruiterOwnershipItems"
      :breakdown-items="positionStatusSummary"
      :department-title="text('recruitment.dashboard.departmentCard.title')"
      :department-description="text('recruitment.dashboard.departmentCard.description', { status: statusModeDescriptionLabel })"
      :department-filter-label="text('common.labels.department')"
      :active-department-label="selectedDepartment"
      :all-label="text('common.status.all')"
      :department-eyebrow="text('recruitment.dashboard.analytics.departmentEyebrow')"
      :trend-eyebrow="text('recruitment.dashboard.analytics.trendEyebrow')"
      :trend-title="text('recruitment.dashboard.analytics.trendTitle')"
      :trend-description="text('recruitment.dashboard.analytics.trendDescription')"
      :pipeline-eyebrow="text('recruitment.dashboard.analytics.pipelineEyebrow')"
      :pipeline-title="text('recruitment.dashboard.analytics.pipelineTitle')"
      :pipeline-description="text('recruitment.dashboard.analytics.pipelineDescription')"
      :stage-filter-label="text('recruitment.dashboard.filters.stage')"
      :active-funnel-stage-code="selectedFunnelStage"
      :active-funnel-stage-label="activeFunnelStageLabel"
      :stacked-label="text('recruitment.dashboard.analytics.stacked')"
      :grouped-label="text('recruitment.dashboard.analytics.grouped')"
      :department-table-rows="departmentChartRows"
      :department-columns="summaryColumns"
      :trend-points="trendChartPoints"
      :trend-series="trendSeries"
      :funnel-steps="funnelSteps"
      @select-department="handleDepartmentSelection"
      @clear-department="selectedDepartment = ''"
      @select-funnel-stage="handleFunnelStageSelection"
      @clear-funnel-stage="selectedFunnelStage = ''"
    />

    <RecruitmentDashboardDetailSection
      :eyebrow="text('recruitment.dashboard.detail.eyebrow')"
      :title="text('recruitment.dashboard.detail.title', { status: statusModeLabel })"
      :description="text('recruitment.dashboard.detail.description', { status: statusModeDescriptionLabel })"
      :export-excel-label="text('common.actions.exportExcel')"
      :columns-label="text('common.actions.columns')"
      :hide-column-label="text('common.actions.hideColumn')"
      :reorder-column-label="text('common.actions.reorderColumn')"
      :status-mode="statusMode"
      :search-label="text('common.labels.search')"
      :search-aria-label="text('recruitment.dashboard.detail.searchAria')"
      :search-placeholder="text('recruitment.dashboard.detail.searchPlaceholder')"
      :search-query="detailSearchQuery"
      :status-tabs="detailStatusTabs"
      :active-status-tab="detailPositionStatusFilter"
      :number-label="text('common.labels.no')"
      :closed-category-label="text('recruitment.dashboard.columns.closedCategory')"
      :reason-label="text('common.labels.reason')"
      :notes-label="text('recruitment.dashboard.columns.notes')"
      :notes-placeholder="text('recruitment.dashboard.columns.notesPlaceholder')"
      :empty-label="text('recruitment.dashboard.detail.noData', { status: statusModeDescriptionLabel })"
      :loading="loading"
      :page="detailPage"
      :page-size="detailPageSize"
      :total-items="detailRows.length"
      :columns="detailTableColumns"
      :rows="pagedDetailRows"
      :sort-indicator="detailSortIndicator"
      :badge-class="detailMetricBadgeClass"
      :format-days="formatDayDifference"
      :row-number="detailRowNumber"
      :note-values="noteValuesByEmployeeRequestFormId"
      :note-saving-ids="savingNoteEmployeeRequestFormIds"
      @update:search-query="detailSearchQuery = $event"
      @update:active-status-tab="detailPositionStatusFilter = $event as DetailPositionStatusFilter"
      @sort="toggleDetailSort"
      @update:page="detailPage = $event"
      @update:note="handleDetailNoteInput"
      @confirm:note="handleDetailNoteConfirm"
      @export-excel="handleDetailExportExcel"
    />
    <AppLoadingOverlay
      v-if="showLoadingOverlay"
      :message="loadingOverlayMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { CandidateForm } from '@/domain/entities/CandidateForm'
import type { MasterDataType } from '@/domain/entities/MasterData'
import type { RecruitmentTracking } from '@/domain/entities/RecruitmentTracking'
import { positionStatusOptions, type PositionStatus } from '@/domain/entities/EmployeeRequestForm'
import type {
  DashboardStatusMode,
  DetailRow,
  DetailSortKey,
  EnrichedTracking,
  SummaryColumn,
} from '@/features/recruitment/types/RecruitmentDashboardPage.type'
import { useLocale } from '@/composables/useLocale'
import { useAppRepositories } from '@/composables/useAppRepositories'
import { getRecruitmentTrackings } from '@/application/usecases/getRecruitmentTrackings'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { masterDataRepo } from '@/infrastructure/supabase/repositories/MasterDataRepositoryImpl'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { appendCandidateFormCollectionSheets } from '@/presentation/utils/candidateFormExcelExport'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'
import { stripLeadingNumberCode } from '@/presentation/utils/textFormat'
import {
  createMasterDataOptionState,
  type MasterDataOptionState,
} from '@/viewmodels/useMasterDataViewModel.state'
import RecruitmentDashboardDetailSection from './components/RecruitmentDashboardDetailSection.vue'
import RecruitmentDashboardHero from './components/RecruitmentDashboardHero.vue'
import RecruitmentDashboardStatusSummary from './components/RecruitmentDashboardStatusSummary.vue'

type DetailPositionStatusFilter = 'all' | 'replacement' | 'mpp' | 'non-mpp'
type FunnelStepTone =
  | 'navy'
  | 'navySoft'
  | 'blueStrong'
  | 'blue'
  | 'blueSoft'
  | 'violet'
  | 'indigo'
  | 'cyan'
  | 'amber'
  | 'amberSoft'
  | 'greenSoft'
  | 'green'

type TrendSeries = {
  key: 'submitted' | 'filled' | 'inProgress'
  label: string
  color: string
  textColor: string
}

const funnelStageDefinitions = [
  { code: 'erf_approved', label: 'ERF Approved', tone: 'navy' as const },
  { code: 'candidate_sourcing', label: 'Candidate Sourcing', tone: 'cyan' as const },
  { code: 'interview_evaluation_completed', label: 'Interview Evaluation Completed', tone: 'violet' as const },
  { code: 'hiring_completed', label: 'Hiring Completed', tone: 'green' as const },
] satisfies Array<{ code: string; label: string; tone: FunnelStepTone }>

const { text } = useLocale()
const appToast = useAppToast()
const { recruitmentTrackingRepo } = useAppRepositories()
const recruitmentDashboardMasterDataTypes = ['department', 'job_level', 'designation'] as const satisfies MasterDataType[]

async function loadRecruitmentDashboardMasterData() {
  const optionsByType = createMasterDataOptionState()
  const results = await Promise.allSettled(
    recruitmentDashboardMasterDataTypes.map((type) => masterDataRepo.getAll(type)),
  )
  const failedTypes: MasterDataType[] = []
  let loadedCount = 0

  for (const [index, result] of results.entries()) {
    const type = recruitmentDashboardMasterDataTypes[index]
    if (!type) continue

    if (result.status === 'fulfilled') {
      optionsByType[type] = result.value
      loadedCount += 1
      continue
    }

    failedTypes.push(type)
  }

  if (loadedCount === 0 && failedTypes.length > 0) {
    throw new Error(`Failed to load ${failedTypes.join(', ')} options.`)
  }

  return optionsByType
}

const recruitmentTrackingsQuery = useQuery({
  queryKey: ['recruitment-dashboard', 'trackings'],
  queryFn: () => getRecruitmentTrackings(recruitmentTrackingRepo),
})
const masterDataOptionsQuery = useQuery({
  queryKey: ['recruitment-dashboard', 'master-data', ...recruitmentDashboardMasterDataTypes],
  queryFn: loadRecruitmentDashboardMasterData,
})

const trackings = computed(() => recruitmentTrackingsQuery.data.value ?? [])
const optionsByType = computed<MasterDataOptionState>(() => masterDataOptionsQuery.data.value ?? createMasterDataOptionState())
const loading = computed(() => recruitmentTrackingsQuery.isFetching.value || masterDataOptionsQuery.isFetching.value)
const error = computed(() =>
  recruitmentTrackingsQuery.error.value instanceof Error
    ? recruitmentTrackingsQuery.error.value.message
    : '',
)
const masterDataError = computed(() =>
  masterDataOptionsQuery.error.value instanceof Error
    ? masterDataOptionsQuery.error.value.message
    : null,
)

const detailSearchQuery = ref('')
const statusMode = ref<DashboardStatusMode>('open')
const selectedDepartment = ref('')
const selectedLevel = ref('')
const selectedFunnelStage = ref('')
const detailPositionStatusFilter = ref<DetailPositionStatusFilter>('all')
const detailRecruiterFilter = ref('')
const detailSortKey = ref<DetailSortKey>('lastApprovalDate')
const detailSortDirection = ref<'asc' | 'desc'>('desc')
const detailPeriodStart = ref('')
const detailPeriodEnd = ref('')
const detailPageSize = 10
const detailPage = ref(1)
const exportActionLoading = ref(false)
const candidateNamesByEmployeeRequestFormId = ref<Record<string, string>>({})
const loadedCandidateNameEmployeeRequestFormIds = new Set<string>()
const pendingCandidateNameEmployeeRequestFormIds = new Set<string>()
const noteValuesByEmployeeRequestFormId = ref<Record<string, string>>({})
const savingNoteEmployeeRequestFormIds = ref<string[]>([])
const inFlightNoteSaveEmployeeRequestFormIds = new Set<string>()
const queuedNoteSaveEmployeeRequestFormIds = new Set<string>()
const createErfHref = '/employee-request-forms/create'

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function compactText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function exportText(value: unknown) {
  return compactText(value) || '-'
}

function updateNoteValue(employeeRequestFormId: string, value: string) {
  noteValuesByEmployeeRequestFormId.value = {
    ...noteValuesByEmployeeRequestFormId.value,
    [employeeRequestFormId]: value,
  }
}

function markNoteSaving(employeeRequestFormId: string, saving: boolean) {
  const current = new Set(savingNoteEmployeeRequestFormIds.value)
  if (saving) {
    current.add(employeeRequestFormId)
  } else {
    current.delete(employeeRequestFormId)
  }
  savingNoteEmployeeRequestFormIds.value = Array.from(current)
}

async function persistEmployeeRequestFormNote(employeeRequestFormId: string) {
  const normalizedEmployeeRequestFormId = compactText(employeeRequestFormId)
  if (!normalizedEmployeeRequestFormId) {
    return
  }

  if (inFlightNoteSaveEmployeeRequestFormIds.has(normalizedEmployeeRequestFormId)) {
    queuedNoteSaveEmployeeRequestFormIds.add(normalizedEmployeeRequestFormId)
    return
  }

  const noteValue = noteValuesByEmployeeRequestFormId.value[normalizedEmployeeRequestFormId] ?? ''

  inFlightNoteSaveEmployeeRequestFormIds.add(normalizedEmployeeRequestFormId)
  markNoteSaving(normalizedEmployeeRequestFormId, true)
  try {
    await callBackendApi(`/api/employee-request-forms/${encodeURIComponent(normalizedEmployeeRequestFormId)}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({
        notes: noteValue,
      }),
    })
  } catch (error) {
    appToast.error(error instanceof Error ? error.message : text('employeeRequestForms.updateFailed'))
  } finally {
    inFlightNoteSaveEmployeeRequestFormIds.delete(normalizedEmployeeRequestFormId)
    markNoteSaving(normalizedEmployeeRequestFormId, false)
    if (queuedNoteSaveEmployeeRequestFormIds.has(normalizedEmployeeRequestFormId)) {
      queuedNoteSaveEmployeeRequestFormIds.delete(normalizedEmployeeRequestFormId)
      void persistEmployeeRequestFormNote(normalizedEmployeeRequestFormId)
    }
  }
}

function handleDetailNoteInput(payload: { employeeRequestFormId: string; value: string }) {
  const employeeRequestFormId = compactText(payload.employeeRequestFormId)
  if (!employeeRequestFormId) {
    return
  }

  updateNoteValue(employeeRequestFormId, payload.value)
}

function handleDetailNoteConfirm(payload: { employeeRequestFormId: string }) {
  const employeeRequestFormId = compactText(payload.employeeRequestFormId)
  if (!employeeRequestFormId) {
    return
  }

  void persistEmployeeRequestFormNote(employeeRequestFormId)
}


function exportDate(value: unknown) {
  const formatted = formatDateDisplay(value as string | null | undefined)
  return formatted && formatted !== '-' ? formatted : '-'
}

function parseSearchTokens(value: string) {
  return value
    .split(/[,\s]+/g)
    .map(normalize)
    .filter(Boolean)
}

function matchesTokens(values: unknown[], query: string) {
  const tokens = parseSearchTokens(query)
  if (tokens.length === 0) {
    return true
  }

  const haystack = values
    .map(normalize)
    .filter(Boolean)
    .join(' ')

  return tokens.every((token) => haystack.includes(token))
}

function getJakartaTodayParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
  }
}

function getCurrentMonthStart() {
  const { year, month } = getJakartaTodayParts()
  return `${year}-${month}-01`
}

function getCurrentMonthEnd() {
  const { year, month } = getJakartaTodayParts()
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

function getTodayDateKey() {
  const { year, month, day } = getJakartaTodayParts()
  return `${year}-${month}-${day}`
}

function getRequestedDateKey(tracking: RecruitmentTracking) {
  return formatDateDisplay(
    tracking.employee_request_form?.requested_date
    || tracking.created_at,
  )
}

function getClosedDateKey(tracking: RecruitmentTracking) {
  return formatDateDisplay(tracking.employee_request_form?.closed_date)
}

function getLastApprovalDateKey(tracking: RecruitmentTracking) {
  const candidates = [
    formatDateDisplay(tracking.employee_request_form?.approval_director_hrd_date),
    formatDateDisplay(tracking.employee_request_form?.approval_gm_hrd_date),
    formatDateDisplay(tracking.employee_request_form?.approval_director_bu_date),
  ]

  return candidates.find((value) => value && value !== '-') ?? '-'
}

function getDateKeyForMode(tracking: RecruitmentTracking, mode: DashboardStatusMode) {
  if (mode === 'open') {
    return getRequestedDateKey(tracking)
  }

  if (mode === 'closed') {
    return getClosedDateKey(tracking)
  }

  return getRequestedDateKey(tracking)
}

function getDayDifference(startDate: string | null | undefined, endDate: string) {
  if (!startDate || startDate === '-' || !endDate || endDate === '-') return null

  const startParts = startDate.split('-').map(Number)
  const endParts = endDate.split('-').map(Number)

  if (startParts.length !== 3 || endParts.length !== 3) {
    return null
  }

  const startYear = startParts[0] ?? 0
  const startMonth = startParts[1] ?? 1
  const startDay = startParts[2] ?? 1
  const endYear = endParts[0] ?? 0
  const endMonth = endParts[1] ?? 1
  const endDay = endParts[2] ?? 1

  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay)

  return Math.max(0, Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)))
}

function formatDayDifference(value: number | null) {
  if (value === null) {
    return '-'
  }

  return text('recruitment.dashboard.dayCount', {
    count: value,
    suffix: value === 1 ? '' : 's',
  })
}

function detailMetricBadgeClass(value: number | null) {
  if (value === null) {
    return 'app-status-chip app-status-chip-neutral'
  }

  if (value <= 7) {
    return 'app-status-chip app-status-chip-success'
  }

  if (value <= 30) {
    return 'app-status-chip app-status-chip-warning'
  }

  return 'app-status-chip app-status-chip-danger'
}

function formatClosedCategory(value: 'employee hired' | 'canceled' | null | undefined) {
  if (!value) return '-'

  if (value === 'employee hired') {
    return text('employeeRequestForms.list.closeCategory.employeeHired')
  }

  if (value === 'canceled') {
    return text('employeeRequestForms.list.closeCategory.canceled')
  }

  return value
}

function resetDetailFiltersToCurrentMonth() {
  detailPeriodStart.value = getCurrentMonthStart()
  detailPeriodEnd.value = getCurrentMonthEnd()
}

function resetDetailFiltersToAll() {
  detailSearchQuery.value = ''
  selectedDepartment.value = ''
  selectedLevel.value = ''
  selectedFunnelStage.value = ''
  detailPositionStatusFilter.value = 'all'
  detailRecruiterFilter.value = ''
  detailPeriodStart.value = ''
  detailPeriodEnd.value = ''
}

function resetDetailPage() {
  detailPage.value = 1
}

function toggleDetailSort(key: DetailSortKey) {
  if (detailSortKey.value === key) {
    detailSortDirection.value = detailSortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  detailSortKey.value = key
  detailSortDirection.value = key === 'statusAgeDays' || key === 'lastApprovalDate' ? 'desc' : 'asc'
}

function detailSortIndicator(key: DetailSortKey) {
  if (detailSortKey.value !== key) return '↑↓'
  return detailSortDirection.value === 'asc' ? '↑' : '↓'
}

function resolveVisibleFunnelStage(tracking: RecruitmentTracking) {
  const stage = resolveRecruitmentFlowStage(tracking)

  switch (stage) {
    case 'erf_approved':
    case 'assign_recruiter':
      return 'erf_approved'
    case 'candidate_sourcing':
    case 'assessment_list_created':
    case 'interview_scheduled':
    case 'interview_evaluation_in_progress':
      return 'candidate_sourcing'
    case 'interview_evaluation_completed':
    case 'candidate_selected':
    case 'employee_contract_form_in_progress':
      return 'interview_evaluation_completed'
    case 'hiring_completed':
      return 'hiring_completed'
    default:
      return ''
  }
}

function formatDesignationSummaryLabel(
  designation: string | null | undefined,
  jobLevel: string | null | undefined,
) {
  return compactText(stripLeadingNumberCode(designation)) || compactText(stripLeadingNumberCode(jobLevel))
}

function extractDisplayName(value: string | null | undefined) {
  const textValue = String(value ?? '').trim()
  if (!textValue) return '-'

  return textValue.split(' - ')[0]?.trim() || textValue
}

function resolveCandidateName(employeeRequestForm: RecruitmentTracking['employee_request_form']) {
  const employeeRequestFormId = compactText(employeeRequestForm?.id)

  if (!employeeRequestFormId) {
    return compactText(employeeRequestForm?.candidate_name) || ''
  }

  return (
    compactText(candidateNamesByEmployeeRequestFormId.value[employeeRequestFormId]) ||
    compactText(employeeRequestForm?.candidate_name) ||
    ''
  )
}

function extractLevelCandidates(employeeRequestForm: RecruitmentTracking['employee_request_form']) {
  if (!employeeRequestForm) return []

  const designationSummaryLabel = formatDesignationSummaryLabel(
    employeeRequestForm.designation,
    employeeRequestForm.job_level,
  )

  return [
    designationSummaryLabel,
    stripLeadingNumberCode(employeeRequestForm.designation),
    stripLeadingNumberCode(employeeRequestForm.job_level),
    employeeRequestForm.custom_grup_1,
    employeeRequestForm.custom_grup_2,
    employeeRequestForm.custom_grup_3,
    employeeRequestForm.custom_grup_4,
    employeeRequestForm.custom_grup_5,
    employeeRequestForm.custom_grup_6,
    employeeRequestForm.main_position,
  ]
    .map(compactText)
    .filter(Boolean)
}

const masterDesignationLabels = computed(() =>
  Array.from(
    new Set(
      [...optionsByType.value.designation, ...optionsByType.value.job_level]
        .map((item) => compactText(item.name))
        .filter(Boolean),
    ),
  ),
)

const normalizedDesignationMap = computed(() => {
  const entries = new Map<string, string>()

  for (const label of masterDesignationLabels.value) {
    const aliases = [label, stripLeadingNumberCode(label)]
      .map((value) => normalize(value))
      .filter(Boolean)

    for (const alias of aliases) {
      if (!entries.has(alias)) {
        entries.set(alias, label)
      }
    }
  }

  return entries
})

function resolveLevel(employeeRequestForm: RecruitmentTracking['employee_request_form']) {
  const designationSummaryLabel = formatDesignationSummaryLabel(
    employeeRequestForm?.designation,
    employeeRequestForm?.job_level,
  )
  if (designationSummaryLabel) {
    const matchedMasterLabel = normalizedDesignationMap.value.get(normalize(designationSummaryLabel))
    if (matchedMasterLabel) {
      return {
        key: matchedMasterLabel,
        label: matchedMasterLabel,
      }
    }
  }

  const candidates = extractLevelCandidates(employeeRequestForm)

  for (const candidate of candidates) {
    const matchedMasterLabel = normalizedDesignationMap.value.get(normalize(candidate))
    if (matchedMasterLabel) {
      return {
        key: matchedMasterLabel,
        label: matchedMasterLabel,
      }
    }
  }

  return {
    key: 'Others',
    label: text('recruitment.dashboard.labels.others'),
  }
}

function resolveRecruitmentFlowStage(tracking: RecruitmentTracking) {
  const persistedStage = compactText(tracking.employee_request_form?.recruitment_flow_stage)
  if (persistedStage) {
    return persistedStage
  }

  if (tracking.employee_request_form?.status === 'closed') {
    return tracking.employee_request_form?.closed_category === 'employee hired'
      ? 'hiring_completed'
      : 'closed'
  }

  if (getLastApprovalDateKey(tracking) !== '-') {
    return compactText(tracking.employee_request_form?.recruiter_name)
      ? 'assign_recruiter'
      : 'erf_approved'
  }

  return 'erf_requested'
}

function resolveStatusAgeDays(tracking: RecruitmentTracking) {
  const todayDateKey = getTodayDateKey()
  const openDate = getRequestedDateKey(tracking)
  const closedDate = getClosedDateKey(tracking)

  if (tracking.employee_request_form?.status === 'closed') {
    return getDayDifference(openDate, closedDate)
  }

  return getDayDifference(getLastApprovalDateKey(tracking), todayDateKey)
}

function matchesDetailPositionStatusFilter(
  positionStatus: PositionStatus | string | null,
  filter: DetailPositionStatusFilter,
) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'replacement') {
    return positionStatus === 'Replacement'
  }

  if (filter === 'mpp') {
    return positionStatus === 'New Position MPP'
  }

  if (filter === 'non-mpp') {
    return positionStatus === 'New Position Non-MPP'
  }

  return true
}

function buildEmptyCounts(columns: SummaryColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.key, 0])) as Record<string, number>
}

function buildSummaryRows(trackingsSource: EnrichedTracking[], columns: SummaryColumn[]) {
  const departmentLabels = Array.from(new Set(trackingsSource.map((tracking) => tracking.departmentLabel))).sort(
    (left, right) => left.localeCompare(right),
  )

  return departmentLabels.map((department) => {
    const counts = buildEmptyCounts(columns)

    for (const tracking of trackingsSource) {
      if (tracking.departmentLabel === department) {
        counts[tracking.levelKey] = (counts[tracking.levelKey] ?? 0) + 1
      }
    }

    return {
      department,
      counts,
    }
  })
}

function handleDepartmentSelection(department: string) {
  selectedDepartment.value = selectedDepartment.value === department ? '' : department
}

function handleFunnelStageSelection(stageCode: string) {
  selectedFunnelStage.value = selectedFunnelStage.value === stageCode ? '' : stageCode
}

async function handleRefresh() {
  await Promise.allSettled([recruitmentTrackingsQuery.refetch(), masterDataOptionsQuery.refetch()])
}

async function loadClosedCandidateNames() {
  if (statusMode.value === 'open') {
    return
  }

  const employeeRequestFormIds = Array.from(
    new Set(
      statusFilteredTrackings.value
        .map((tracking) => tracking.employee_request_form)
        .filter(
          (employeeRequestForm) =>
            employeeRequestForm?.status === 'closed' &&
            !resolveCandidateName(employeeRequestForm) &&
            !loadedCandidateNameEmployeeRequestFormIds.has(employeeRequestForm.id) &&
            !pendingCandidateNameEmployeeRequestFormIds.has(employeeRequestForm.id),
        )
        .map((employeeRequestForm) => employeeRequestForm!.id),
    ),
  )

  if (employeeRequestFormIds.length === 0) {
    return
  }

  for (const employeeRequestFormId of employeeRequestFormIds) {
    pendingCandidateNameEmployeeRequestFormIds.add(employeeRequestFormId)
  }

  try {
    const response = await callBackendApi<{
      passed_candidates: Array<{
        employee_request_form_id: string
        full_name: string | null
        email: string | null
      }>
    }>('/api/employee-request-forms/passed-candidates', {
      method: 'POST',
      body: JSON.stringify({
        employee_request_form_ids: employeeRequestFormIds,
      }),
    })

    const nextCandidateNamesByEmployeeRequestFormId = {
      ...candidateNamesByEmployeeRequestFormId.value,
    }

    for (const candidate of response.passed_candidates ?? []) {
      const employeeRequestFormId = compactText(candidate.employee_request_form_id)
      const candidateName = compactText(candidate.full_name) || compactText(candidate.email)

      if (!employeeRequestFormId || !candidateName) {
        continue
      }

      const currentNames = nextCandidateNamesByEmployeeRequestFormId[employeeRequestFormId]
        ?.split(',')
        .map((value) => compactText(value))
        .filter(Boolean) ?? []

      if (!currentNames.includes(candidateName)) {
        currentNames.push(candidateName)
      }

      nextCandidateNamesByEmployeeRequestFormId[employeeRequestFormId] = currentNames.join(', ')
    }

    candidateNamesByEmployeeRequestFormId.value = nextCandidateNamesByEmployeeRequestFormId
  } catch {
    // Keep the dashboard usable even if candidate enrichment fails.
  } finally {
    for (const employeeRequestFormId of employeeRequestFormIds) {
      pendingCandidateNameEmployeeRequestFormIds.delete(employeeRequestFormId)
      loadedCandidateNameEmployeeRequestFormIds.add(employeeRequestFormId)
    }
  }
}

const combinedError = computed(() => error.value || masterDataError.value || '')
const showLoadingOverlay = computed(() => loading.value || exportActionLoading.value)
const loadingOverlayMessage = computed(() =>
  exportActionLoading.value
    ? text('common.preparingExcel')
    : text('common.loading'),
)

const statusModes = computed(() => [
  { value: 'all' as const, label: text('common.status.all') },
  { value: 'open' as const, label: text('common.status.open') },
  { value: 'closed' as const, label: text('common.status.closed') },
])

const lastUpdatedDisplay = computed(() => {
  const updatedDates = trackings.value
    .map((tracking) => formatDateDisplay(tracking.updated_at || tracking.created_at))
    .filter((value) => value && value !== '-')
    .sort()
  const latest = updatedDates[updatedDates.length - 1]

  return latest ?? '-'
})

const statusAgeLabel = computed(() => {
  if (statusMode.value === 'open') {
    return text('recruitment.dashboard.columns.daysOpenUntilToday')
  }

  if (statusMode.value === 'closed') {
    return text('recruitment.dashboard.columns.daysOpenToClose')
  }

  return text('recruitment.dashboard.columns.statusAgeDays')
})

const detailTableColumns = computed<Array<{ key: DetailSortKey; label: string }>>(() => {
  const columns: Array<{ key: DetailSortKey; label: string }> = [
    { key: 'position', label: text('common.labels.mainPosition') },
    { key: 'businessUnit', label: text('recruitment.dashboard.columns.buCategory') },
    { key: 'department', label: text('common.labels.department') },
    { key: 'positionStatus', label: text('common.labels.positionStatus') },
    { key: 'lastApprovalDate', label: text('recruitment.dashboard.columns.officialComplete') },
    { key: 'statusAgeDays', label: statusAgeLabel.value },
    { key: 'recruiter', label: text('common.labels.recruiter') },
    { key: 'employment', label: text('common.labels.employmentStatus') },
    { key: 'designation', label: text('common.labels.designation') },
  ]

  if (statusMode.value !== 'open') {
    columns.splice(7, 0, { key: 'candidateName', label: text('recruitment.dashboard.columns.candidateName') })
  }

  return columns
})

const enrichedTrackings = computed<EnrichedTracking[]>(() =>
  trackings.value.map((tracking) => {
    const departmentLabel =
      compactText(stripLeadingNumberCode(tracking.employee_request_form?.department)) || text('common.empty.noDepartment')
    const level = resolveLevel(tracking.employee_request_form ?? null)

    return {
      ...tracking,
      departmentLabel,
      levelKey: level.key,
      levelLabel: level.label,
    }
  }),
)

const departmentOptions = computed(() => {
  const values = new Map<string, string>()

  for (const option of optionsByType.value.department) {
    const displayLabel = compactText(option.name)
    const normalizedLabel = compactText(stripLeadingNumberCode(option.name))

    if (displayLabel && normalizedLabel) {
      values.set(normalizedLabel, displayLabel)
    }
  }

  for (const tracking of enrichedTrackings.value) {
    if (tracking.departmentLabel && !values.has(tracking.departmentLabel)) {
      values.set(tracking.departmentLabel, tracking.departmentLabel)
    }
  }

  return Array.from(values.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([value, label]) => ({ value, label }))
})

const levelOptions = computed(() => {
  const values = new Map<string, string>()

  for (const label of masterDesignationLabels.value) {
    values.set(label, label)
  }

  for (const tracking of enrichedTrackings.value) {
    if (tracking.levelLabel && !values.has(tracking.levelKey)) {
      values.set(tracking.levelKey, tracking.levelLabel)
    }
  }

  return Array.from(values.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([value, label]) => ({ value, label }))
})

const statusModeLabel = computed(() => {
  switch (statusMode.value) {
    case 'open':
      return text('common.status.open')
    case 'closed':
      return text('common.status.closed')
    default:
      return text('common.status.all')
  }
})

const statusModeDescriptionLabel = computed(() => statusModeLabel.value.toLowerCase())

const statusFilteredTrackings = computed(() => {
  if (statusMode.value === 'open') {
    return enrichedTrackings.value.filter((tracking) => tracking.employee_request_form?.status !== 'closed')
  }

  if (statusMode.value === 'closed') {
    return enrichedTrackings.value.filter((tracking) => tracking.employee_request_form?.status === 'closed')
  }

  return enrichedTrackings.value
})

const analyticsTrackings = computed(() =>
  statusFilteredTrackings.value.filter((tracking) => {
    if (selectedDepartment.value && tracking.departmentLabel !== selectedDepartment.value) {
      return false
    }

    if (selectedLevel.value && tracking.levelKey !== selectedLevel.value) {
      return false
    }

    if (detailRecruiterFilter.value) {
      const recruiterName = compactText(tracking.employee_request_form?.recruiter_name)
      if (detailRecruiterFilter.value === 'unassigned') {
        if (recruiterName) return false
      } else if (recruiterName !== detailRecruiterFilter.value) {
        return false
      }
    }

    if (detailPeriodStart.value || detailPeriodEnd.value) {
      const trackingDate = getDateKeyForMode(tracking, statusMode.value)
      if (trackingDate === '-') return false
      if (detailPeriodStart.value && trackingDate < detailPeriodStart.value) return false
      if (detailPeriodEnd.value && trackingDate > detailPeriodEnd.value) return false
    }

    return true
  }),
)

const detailRecruiterOptions = computed(() => {
  const names = Array.from(
    new Set(
      statusFilteredTrackings.value
        .map((t) => compactText(t.employee_request_form?.recruiter_name))
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b))

  return [
    { value: 'unassigned', label: 'Without recruiter' },
    ...names.map((name) => ({ value: name, label: name })),
  ]
})

const detailSearchFilteredTrackings = computed(() => {
  if (!detailSearchQuery.value.trim()) {
    return analyticsTrackings.value
  }

  return analyticsTrackings.value.filter((tracking) => matchesTokens([
    tracking.departmentLabel,
    tracking.employee_request_form?.business_unit,
    tracking.employee_request_form?.pt_pembebanan,
    tracking.employee_request_form?.main_position,
    tracking.employee_request_form?.recruiter_name,
    tracking.employee_request_form?.site,
    resolveCandidateName(tracking.employee_request_form ?? null),
    tracking.employee_request_form?.employment_status,
    tracking.employee_request_form?.required_date,
    tracking.levelLabel,
    resolveRecruitmentFlowStage(tracking),
    ...extractLevelCandidates(tracking.employee_request_form ?? null),
  ], detailSearchQuery.value))
})

const detailStatusTabs = computed(() => [
  {
    key: 'all' as const,
    label: text('common.status.all'),
    count: detailSearchFilteredTrackings.value.length,
  },
  {
    key: 'replacement' as const,
    label: 'Replacement',
    count: detailSearchFilteredTrackings.value.filter(
      (tracking) => tracking.employee_request_form?.position_status === 'Replacement',
    ).length,
  },
  {
    key: 'mpp' as const,
    label: 'MPP',
    count: detailSearchFilteredTrackings.value.filter(
      (tracking) => tracking.employee_request_form?.position_status === 'New Position MPP',
    ).length,
  },
  {
    key: 'non-mpp' as const,
    label: 'Non-MPP',
    count: detailSearchFilteredTrackings.value.filter(
      (tracking) => tracking.employee_request_form?.position_status === 'New Position Non-MPP',
    ).length,
  },
])

const summaryPositionsCount = computed(() => analyticsTrackings.value.length)

const currentMonthPositionsCount = computed(() => {
  const monthStart = getCurrentMonthStart()
  const monthEnd = getCurrentMonthEnd()

  return analyticsTrackings.value.filter((tracking) => {
    const dateKey = getDateKeyForMode(tracking, statusMode.value)
    return dateKey !== '-' && dateKey >= monthStart && dateKey <= monthEnd
  }).length
})

const averageStatusAgeDays = computed(() => {
  const values = analyticsTrackings.value
    .map((tracking) => resolveStatusAgeDays(tracking))
    .filter((value): value is number => value !== null)

  if (values.length === 0) {
    return null
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
})

const recruiterOwnershipItems = computed(() => {
  const counts = new Map<string, number>()

  for (const tracking of analyticsTrackings.value) {
    const recruiterLabel = extractDisplayName(tracking.employee_request_form?.recruiter_name)
    const key = recruiterLabel !== '-' ? recruiterLabel : text('recruitment.dashboard.summaryCard.unrecruiter')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1]
      }

      return left[0].localeCompare(right[0])
    })
    .map(([label, count]) => ({ label, count }))
})

const positionStatusSummary = computed(() =>
  positionStatusOptions.map((status) => ({
    label: status,
    count: analyticsTrackings.value.filter(
      (tracking) => tracking.employee_request_form?.position_status === status,
    ).length,
  })),
)

const hasOthersColumn = computed(() =>
  analyticsTrackings.value.some((tracking) => tracking.levelKey === 'Others'),
)

const summaryColumns = computed<SummaryColumn[]>(() => {
  const masterColumns = masterDesignationLabels.value.map((label) => ({
    key: label,
    label,
  }))

  return hasOthersColumn.value
    ? [...masterColumns, { key: 'Others', label: text('recruitment.dashboard.labels.others') }]
    : masterColumns
})

const departmentSourceTrackings = computed(() => {
  if (!selectedFunnelStage.value) {
    return analyticsTrackings.value
  }

  return analyticsTrackings.value.filter(
    (tracking) => resolveVisibleFunnelStage(tracking) === selectedFunnelStage.value,
  )
})

const departmentChartRows = computed(() =>
  buildSummaryRows(departmentSourceTrackings.value, summaryColumns.value),
)

function getMonthBucketDate(offset: number) {
  const { year, month } = getJakartaTodayParts()
  return new Date(Date.UTC(Number(year), Number(month) - 1 + offset, 1))
}

function formatTrendMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

function getMonthBucketKey(value: string | null | undefined) {
  const dateKey = formatDateDisplay(value)
  if (!dateKey || dateKey === '-') {
    return ''
  }

  return dateKey.slice(0, 7)
}

const trendChartPoints = computed(() => {
  const bucketDates = Array.from({ length: 6 }, (_, index) => getMonthBucketDate(index - 5))

  return bucketDates.map((bucketDate) => {
    const bucketKey = `${bucketDate.getUTCFullYear()}-${String(bucketDate.getUTCMonth() + 1).padStart(2, '0')}`
    const submitted = analyticsTrackings.value.filter((tracking) =>
      getMonthBucketKey(getDateKeyForMode(tracking, statusMode.value)) === bucketKey,
    ).length
    const filled = analyticsTrackings.value.filter(
      (tracking) =>
        tracking.employee_request_form?.closed_category === 'employee hired'
        && getMonthBucketKey(tracking.employee_request_form?.closed_date) === bucketKey,
    ).length
    const inProgress = analyticsTrackings.value.filter(
      (tracking) =>
        tracking.employee_request_form?.status !== 'closed'
        && getMonthBucketKey(tracking.employee_request_form?.requested_date || tracking.created_at) === bucketKey,
    ).length

    return {
      label: formatTrendMonthLabel(bucketDate),
      submitted,
      filled,
      inProgress,
    }
  })
})

const trendSeries = computed<TrendSeries[]>(() => {
  if (statusMode.value === 'open') {
    return [{ key: 'inProgress', label: 'In Progress', color: '#f6c384', textColor: '#b7791f' }]
  }

  if (statusMode.value === 'closed') {
    return [{ key: 'filled', label: 'Filled', color: '#8dd3b0', textColor: '#2f855a' }]
  }

  return [
    { key: 'filled', label: 'Filled', color: '#8dd3b0', textColor: '#2f855a' },
    { key: 'inProgress', label: 'In Progress', color: '#f6c384', textColor: '#b7791f' },
  ]
})

const funnelSteps = computed(() => {
  const rawSteps = funnelStageDefinitions.map((stage) => ({
    code: stage.code,
    label: stage.label,
    value: analyticsTrackings.value.filter(
      (tracking) => resolveVisibleFunnelStage(tracking) === stage.code,
    ).length,
    tone: stage.tone,
  }))

  return rawSteps.map((step) => ({
    ...step,
    percentage: analyticsTrackings.value.length > 0 ? Math.round((step.value / analyticsTrackings.value.length) * 100) : 0,
  }))
})

const activeFunnelStageLabel = computed(() =>
  funnelStageDefinitions.find((stage) => stage.code === selectedFunnelStage.value)?.label ?? '',
)

const detailRows = computed<DetailRow[]>(() => {
  const rows = detailSearchFilteredTrackings.value
    .filter((tracking) => matchesDetailPositionStatusFilter(
      tracking.employee_request_form?.position_status ?? null,
      detailPositionStatusFilter.value,
    ))
    .map((tracking) => {
      const lastApprovalDate = getLastApprovalDateKey(tracking)

      return {
        id: tracking.id,
        employeeRequestFormId: compactText(tracking.employee_request_form?.id) || compactText(tracking.employee_request_form_id),
        position: compactText(tracking.employee_request_form?.main_position) || '-',
        businessUnit: compactText(tracking.employee_request_form?.business_unit) || '-',
        recruiter: compactText(tracking.employee_request_form?.recruiter_name) || '-',
        candidateName: resolveCandidateName(tracking.employee_request_form ?? null) || '-',
        employment: compactText(tracking.employee_request_form?.employment_status) || '-',
        positionStatus: compactText(tracking.employee_request_form?.position_status) || '-',
        department: tracking.departmentLabel,
        designation:
          formatDesignationSummaryLabel(
            tracking.employee_request_form?.designation,
            tracking.employee_request_form?.job_level,
          ) || '-',
        directHead: extractDisplayName(tracking.employee_request_form?.direct_manager),
        site: compactText(tracking.employee_request_form?.site) || '-',
        workingLocation: compactText(tracking.employee_request_form?.working_location) || '-',
        costCenterPt: compactText(tracking.employee_request_form?.pt_pembebanan) || '-',
        lastApprovalDate,
        statusAgeDays: resolveStatusAgeDays(tracking),
        closedCategory: formatClosedCategory(tracking.employee_request_form?.closed_category),
        closeReason: compactText(tracking.employee_request_form?.reason) || '-',
        notes: noteValuesByEmployeeRequestFormId.value[
          compactText(tracking.employee_request_form?.id) || compactText(tracking.employee_request_form_id)
        ] ?? compactText(tracking.employee_request_form?.notes),
      }
    })

  return [...rows].sort((left, right) => {
    const direction = detailSortDirection.value === 'asc' ? 1 : -1
    const leftValue = left[detailSortKey.value]
    const rightValue = right[detailSortKey.value]

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction
    }

    if (leftValue === null && rightValue === null) {
      return 0
    }

    if (leftValue === null) {
      return 1
    }

    if (rightValue === null) {
      return -1
    }

    const normalizedLeft = String(leftValue === '-' ? '9999-99-99' : leftValue).toLowerCase()
    const normalizedRight = String(rightValue === '-' ? '9999-99-99' : rightValue).toLowerCase()

    return normalizedLeft.localeCompare(normalizedRight) * direction
  })
})

const pagedDetailRows = computed(() => {
  const start = (detailPage.value - 1) * detailPageSize
  return detailRows.value.slice(start, start + detailPageSize)
})

function detailRowNumber(index: number) {
  return (detailPage.value - 1) * detailPageSize + index + 1
}

async function loadClosedExportCandidates(employeeRequestFormIds: string[]) {
  const normalizedEmployeeRequestFormIds = Array.from(
    new Set(employeeRequestFormIds.map(compactText).filter(Boolean)),
  )

  if (normalizedEmployeeRequestFormIds.length === 0) {
    return [] as CandidateForm[]
  }

  const response = await callBackendApi<{
    candidate_forms?: CandidateForm[]
  }>('/api/employee-request-forms/export-candidates', {
    method: 'POST',
    body: JSON.stringify({
      employee_request_form_ids: normalizedEmployeeRequestFormIds,
    }),
  })

  return Array.isArray(response.candidate_forms) ? response.candidate_forms : []
}

function handleDetailExportExcel() {
  if (exportActionLoading.value) {
    return
  }

  exportActionLoading.value = true
  appToast.success(text('recruitment.dashboard.toasts.exportPreparing'))
  void runDetailExportExcel()
}

async function runDetailExportExcel() {
  await Promise.resolve()

  try {
    const { utils, writeFile } = await import('xlsx-js-style')
    const rows = detailRows.value
    if (rows.length === 0) return

    const headers: Record<
      | 'position'
      | 'businessUnit'
      | 'positionStatus'
      | 'department'
      | 'recruiter'
      | 'candidateName'
      | 'employment'
      | 'designation'
      | 'lastApprovalDate'
      | 'statusAgeDays'
      | 'closedCategory'
      | 'closeReason'
      | 'notes',
      string
    > = {
      position: text('common.labels.mainPosition'),
      businessUnit: text('recruitment.dashboard.columns.buCategory'),
      positionStatus: text('common.labels.positionStatus'),
      department: text('common.labels.department'),
      recruiter: text('common.labels.recruiter'),
      candidateName: text('recruitment.dashboard.columns.candidateName'),
      employment: text('common.labels.employmentStatus'),
      designation: text('common.labels.designation'),
      lastApprovalDate: text('recruitment.dashboard.columns.officialComplete'),
      statusAgeDays: statusAgeLabel.value,
      closedCategory: text('recruitment.dashboard.columns.closedCategory'),
      closeReason: text('common.labels.reason'),
      notes: text('recruitment.dashboard.columns.notes'),
    }

    let exportRows: Array<Record<string, string | number>> = []
    let exportCandidateForms: CandidateForm[] = []

    exportCandidateForms = await loadClosedExportCandidates(rows.map((row) => row.employeeRequestFormId))

    if (statusMode.value !== 'open') {
      exportRows = rows.map((row, idx) => {
        return {
          'No': idx + 1,
          [headers.position]: row.position,
          [headers.businessUnit]: row.businessUnit,
          [headers.department]: row.department,
          [headers.positionStatus]: row.positionStatus,
          [headers.lastApprovalDate]: row.lastApprovalDate,
          [headers.statusAgeDays]: row.statusAgeDays !== null ? formatDayDifference(row.statusAgeDays) : '-',
          [headers.recruiter]: row.recruiter,
          [headers.candidateName]: row.candidateName,
          [headers.employment]: row.employment,
          [headers.designation]: row.designation,
          [headers.closedCategory]: row.closedCategory,
          [headers.closeReason]: row.closeReason,
          [headers.notes]: row.notes,
        }
      })
    } else {
      exportRows = rows.map((row, idx) => {
        return {
          'No': idx + 1,
          [headers.position]: row.position,
          [headers.businessUnit]: row.businessUnit,
          [headers.department]: row.department,
          [headers.positionStatus]: row.positionStatus,
          [headers.lastApprovalDate]: row.lastApprovalDate,
          [headers.statusAgeDays]: row.statusAgeDays !== null ? formatDayDifference(row.statusAgeDays) : '-',
          [headers.recruiter]: row.recruiter,
          [headers.employment]: row.employment,
          [headers.designation]: row.designation,
          [headers.notes]: row.notes,
        }
      })
    }

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: '1D4ED8' } },
      alignment: { horizontal: 'center', wrapText: true },
    }

    const detailSheet = utils.json_to_sheet(exportRows)
    const detailColCount = Object.keys(exportRows[0]!).length
    for (let i = 0; i < detailColCount; i++) {
      const col = i < 26 ? String.fromCharCode(65 + i) : `A${String.fromCharCode(65 + i - 26)}`
      const cell = detailSheet[`${col}1`] as { s?: unknown } | undefined
      if (cell) cell.s = headerStyle
    }
    detailSheet['!cols'] = Object.keys(exportRows[0]!).map((header) => ({ wch: Math.max(header.length + 2, 14) }))

    const workbook = utils.book_new()
    const detailSheetName = statusMode.value === 'open'
      ? 'Open ERF'
      : statusMode.value === 'closed'
        ? 'Closed ERF'
        : 'All ERF'
    utils.book_append_sheet(workbook, detailSheet, detailSheetName)

    if (statusMode.value !== 'open' && exportCandidateForms.length > 0) {
      appendCandidateFormCollectionSheets(workbook, utils, exportCandidateForms)
    }

    writeFile(workbook, `recruitment-detail-${statusMode.value}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    appToast.success(text('recruitment.dashboard.toasts.exported'))
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : text('recruitment.dashboard.errors.exportFailed')
    appToast.error(message)
  } finally {
    exportActionLoading.value = false
  }
}

watch(
  [
    detailSearchQuery,
    statusMode,
    detailPeriodStart,
    detailPeriodEnd,
    detailPositionStatusFilter,
    detailRecruiterFilter,
    selectedDepartment,
    selectedLevel,
    selectedFunnelStage,
  ],
  resetDetailPage,
)
watch(statusMode, () => {
  detailPositionStatusFilter.value = 'all'
  detailSortKey.value = 'lastApprovalDate'
  detailSortDirection.value = 'desc'
})
watch(trackings, (items) => {
  const next = { ...noteValuesByEmployeeRequestFormId.value }
  for (const tracking of items) {
    const employeeRequestFormId = compactText(tracking.employee_request_form?.id || tracking.employee_request_form_id)
    if (!employeeRequestFormId) {
      continue
    }

    if (Object.prototype.hasOwnProperty.call(next, employeeRequestFormId)) {
      continue
    }

    next[employeeRequestFormId] = compactText(tracking.employee_request_form?.notes)
  }

  noteValuesByEmployeeRequestFormId.value = next
}, { immediate: true })
watch([statusMode, trackings, detailPeriodStart, detailPeriodEnd, selectedDepartment, selectedLevel], () => {
  void loadClosedCandidateNames()
}, { immediate: true })

onBeforeUnmount(() => {
  queuedNoteSaveEmployeeRequestFormIds.clear()
  inFlightNoteSaveEmployeeRequestFormIds.clear()
})
</script>
