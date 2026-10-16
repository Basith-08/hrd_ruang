<template>
  <div class="flex w-full flex-col gap-4">
    <AppAlert :message="error" />

    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('employeeRequestForms.list.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('employeeRequestForms.list.title') }}
          </h1>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton class="inline-flex min-h-11 min-w-[120px] items-center justify-center" variant="secondary"
            :loading="loading" :label="text('common.actions.refresh')" :loading-label="text('common.loading')"
            @click="refresh" />
          <AppActionButton
            v-if="canExportEmployeeRequestFormExcel"
            class="inline-flex min-h-11 min-w-[140px] items-center justify-center"
            variant="success"
            :label="text('common.actions.exportExcel')"
            :loading="excelActionLoading"
            :loading-label="text('common.preparingExcel')"
            :disabled="visibleJobs.length === 0"
            @click="handleExportExcel"
          />
          <AppActionButton v-if="canCreateEmployeeRequestForm"
            class="inline-flex min-h-11 min-w-[140px] items-center justify-center" variant="primary"
            :label="text('employeeRequestForms.list.actions.createErf')" @click="goToCreate" />
        </div>
      </div>
    </section>

    <section class="app-dashboard-panel">
      <div class="app-dashboard-panel-header">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-2xl">
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('employeeRequestForms.list.listTitle') }}
              </h2>
              <p class="app-dashboard-copy mt-1">
                {{ text('employeeRequestForms.list.listDescription') }}
              </p>
            </div>

            <AppActionButton class="h-11 px-4 py-0 xl:flex-none" variant="ghost"
              :label="text('employeeRequestForms.list.filters.reset')" :disabled="!hasActiveFilters"
              @click="resetFilters" />
          </div>

          <div class="grid gap-3 xl:grid-cols-[minmax(280px,1.4fr)_repeat(4,minmax(180px,1fr))]">
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput v-model="searchQuery"
                :placeholder="text('employeeRequestForms.list.filters.searchPlaceholder')" class="w-full" />
            </label>
            <label v-for="filter in selectFilters" :key="filter.key" class="block min-w-0">
              <span class="app-fieldset-label mb-1.5 block">
                {{ filter.label }}
              </span>
              <SearchableSelect :model-value="filter.modelValue" :options="filter.options"
                :placeholder="filter.placeholder" show-empty-option :empty-label="filter.emptyLabel" class="w-full"
                @update:model-value="filter.update" />
            </label>
          </div>
        </div>
      </div>

      <EmployeeRequestFormTable v-model:page="page" :items="pagedJobs" :loading="loading" :page-size="pageSize"
        :total-items="sortedJobs.length" :text="text" :status-label="employeeRequestFormStatusLabel"
        :status-badge-class="employeeRequestFormStatusBadgeClass" :get-row-actions="getRowActions"
        :sort-indicator="sortIndicator" @sort="toggleSort" />
    </section>
  </div>

  <EmployeeRequestFormCloseModal v-if="showCloseModal" v-model="closeForm" :saving="saving" :text="text"
    @cancel="showCloseModal = false" @submit="handleClose" />

  <AppLoadingOverlay v-if="deletingEmployeeRequestForm" :message="text('employeeRequestForms.list.loading.deleting')" />
  <AppLoadingOverlay v-if="pdfActionLoading" :message="text('common.preparingPdf')" />
  <AppLoadingOverlay v-if="excelActionLoading" :message="text('common.preparingExcel')" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '#imports'

import EmployeeRequestFormCloseModal from '@/features/employeeRequestForms/components/EmployeeRequestFormCloseModal.vue'
import EmployeeRequestFormTable from '@/features/employeeRequestForms/components/EmployeeRequestFormTable.vue'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import type { RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import {
  createEmployeeRequestFormCloseState,
  type EmployeeRequestFormCloseState,
} from '@/features/employeeRequestForms/EmployeeRequestFormList.state'
import type {
  EmployeeRequestFormListSelectOption,
  EmployeeRequestFormListSortDirection,
  EmployeeRequestFormListSortKey,
} from '@/features/employeeRequestForms/types/EmployeeRequestFormList.type'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { exportEmployeeRequestFormPdf } from '@/presentation/utils/employeeRequestFormPdfTemplate'
import { closePdfPreviewWindow, openPdfPreviewWindow } from '@/presentation/utils/pdfPreviewWindow'
import { useLocale } from '@/composables/useLocale'
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '@/domain/utils/recruitmentFlowStage'
import { buildApprovalProgressSummary } from '@/domain/utils/approvalSummary'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'

const router = useRouter()
const { jobs, loading, error, saving, remove, refresh, close, getById } = useEmployeeRequestFormViewModel({
  mode: 'list',
})
const authViewModel = useAuthViewModel()
const { hasPermission } = authViewModel
const { text } = useLocale()
const appToast = useAppToast()
const appConfirm = useAppConfirm()

// Close Modal State
const showCloseModal = ref(false)
const selectedJobId = ref('')
const closeForm = ref<EmployeeRequestFormCloseState>(createEmployeeRequestFormCloseState())

const searchQuery = ref('')
const departmentFilter = ref('')
const businessUnitFilter = ref('')
const positionStatusFilter = ref('')
const employmentFilter = ref('')
const sortKey = ref<EmployeeRequestFormListSortKey | ''>('')
const sortDirection = ref<EmployeeRequestFormListSortDirection>('asc')
const pageSize = 10
const page = ref(1)
const pdfActionLoading = ref(false)
const excelActionLoading = ref(false)
const deletingEmployeeRequestForm = ref(false)
const canCreateEmployeeRequestForm = computed(() => hasPermission('employee_request_form:create'))
const canUpdateEmployeeRequestForm = computed(() => hasPermission('employee_request_form:update'))
const canCloseEmployeeRequestForm = computed(() => hasPermission('employee_request_form:close'))
const canExportEmployeeRequestFormPdf = computed(() => hasPermission('employee_request_form:export_pdf'))
const canReadEmployeeRequestForms = computed(() => hasPermission('employee_request_form:read'))
const canReadApprovedEmployeeRequestForms = computed(() =>
  hasPermission('recruitment:approved_erf_read'),
)
const canExportEmployeeRequestFormExcel = computed(() =>
  canReadEmployeeRequestForms.value || canReadApprovedEmployeeRequestForms.value,
)

function isApprovedEmployeeRequestForm(job: EmployeeRequestForm) {
  return Boolean(job.approval_director_hrd_date)
}

const visibleJobs = computed(() => {
  if (canReadEmployeeRequestForms.value) {
    return jobs.value
  }

  if (canReadApprovedEmployeeRequestForms.value) {
    return jobs.value.filter(isApprovedEmployeeRequestForm)
  }

  return []
})

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function getApprovalSummary(job: EmployeeRequestForm) {
  return buildApprovalProgressSummary(job.approval_steps, {
    approval_director_bu: job.approval_director_bu,
    approval_director_bu_date: job.approval_director_bu_date,
    approval_gm_hrd: job.approval_gm_hrd,
    approval_gm_hrd_date: job.approval_gm_hrd_date,
    approval_director_hrd: job.approval_director_hrd,
    approval_director_hrd_date: job.approval_director_hrd_date,
  })
}

function employeeRequestFormApprovalProgressLabel(job: EmployeeRequestForm) {
  const summary = getApprovalSummary(job)
  return `${summary.approvedCount}/${summary.totalCount} ${text('employeeRequestForms.list.table.approvalProgressSuffix')}`
}

function employeeRequestFormCurrentApprovalLabel(job: EmployeeRequestForm) {
  return getApprovalSummary(job).currentApprovalLabel
}

const departmentOptions = computed(() => {
  const set = new Set<string>()
  for (const j of visibleJobs.value) {
    if (j.department) set.add(j.department)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const businessUnitOptions = computed(() => {
  const set = new Set<string>()
  for (const j of visibleJobs.value) {
    if (j.business_unit) set.add(j.business_unit)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const positionStatusOptions = computed(() => {
  const set = new Set<string>()
  for (const j of visibleJobs.value) {
    if (j.position_status) set.add(j.position_status)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const employmentOptions = computed(() => {
  const set = new Set<string>()
  for (const j of visibleJobs.value) {
    if (j.employment_status) set.add(j.employment_status)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const departmentSelectOptions = computed<EmployeeRequestFormListSelectOption[]>(() =>
  departmentOptions.value.map((opt) => ({ value: opt, label: opt })),
)
const businessUnitSelectOptions = computed<EmployeeRequestFormListSelectOption[]>(() =>
  businessUnitOptions.value.map((opt) => ({ value: opt, label: opt })),
)
const positionStatusSelectOptions = computed<EmployeeRequestFormListSelectOption[]>(() =>
  positionStatusOptions.value.map((opt) => ({ value: opt, label: opt })),
)
const employmentSelectOptions = computed<EmployeeRequestFormListSelectOption[]>(() =>
  employmentOptions.value.map((opt) => ({ value: opt, label: opt })),
)
const selectFilters = computed(() => [
  {
    key: 'department',
    label: text('common.labels.department'),
    modelValue: departmentFilter.value,
    options: departmentSelectOptions.value,
    placeholder: text('employeeRequestForms.list.filters.departmentPlaceholder'),
    emptyLabel: text('employeeRequestForms.list.filters.allDepartments'),
    update: (value: string | number | null) => {
      departmentFilter.value = String(value ?? '')
    },
  },
  {
    key: 'business_unit',
    label: text('employeeRequestForms.list.table.buCategory'),
    modelValue: businessUnitFilter.value,
    options: businessUnitSelectOptions.value,
    placeholder: text('employeeRequestForms.list.filters.businessUnitPlaceholder'),
    emptyLabel: text('employeeRequestForms.list.filters.allBusinessUnits'),
    update: (value: string | number | null) => {
      businessUnitFilter.value = String(value ?? '')
    },
  },
  {
    key: 'position_status',
    label: text('common.labels.positionStatus'),
    modelValue: positionStatusFilter.value,
    options: positionStatusSelectOptions.value,
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
    options: employmentSelectOptions.value,
    placeholder: text('employeeRequestForms.list.filters.employmentPlaceholder'),
    emptyLabel: text('employeeRequestForms.list.filters.allEmployment'),
    update: (value: string | number | null) => {
      employmentFilter.value = String(value ?? '')
    },
  },
])
const hasActiveFilters = computed(() =>
  Boolean(
    searchQuery.value.trim()
    || departmentFilter.value
    || businessUnitFilter.value
    || positionStatusFilter.value
    || employmentFilter.value,
  ),
)
const filteredJobs = computed(() => {
  const q = normalize(searchQuery.value)
  return visibleJobs.value.filter((j) => {
    if (departmentFilter.value && j.department !== departmentFilter.value) return false
    if (businessUnitFilter.value && j.business_unit !== businessUnitFilter.value) return false
    if (positionStatusFilter.value && j.position_status !== positionStatusFilter.value) return false
    if (employmentFilter.value && j.employment_status !== employmentFilter.value) return false
    if (!q) return true

    const haystack = [
      j.main_position,
      j.recruiter_name,
      j.department,
      j.business_unit,
      j.position_status,
      j.employment_status,
      j.required_date,
      employeeRequestFormApprovalProgressLabel(j),
      employeeRequestFormCurrentApprovalLabel(j),
      employeeRequestFormStatusLabel(j),
      j.approval_director_bu_date,
      j.approval_gm_hrd_date,
      j.approval_director_hrd_date,
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(q)
  })
})

function compareNullableValues(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
  direction: EmployeeRequestFormListSortDirection,
) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1

  const factor = direction === 'asc' ? 1 : -1

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * factor
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * factor
}

function parseDateValue(value: string | null | undefined) {
  const timestamp = Date.parse(String(value ?? '').trim())
  return Number.isNaN(timestamp) ? null : timestamp
}

function compareJobs(
  left: EmployeeRequestForm,
  right: EmployeeRequestForm,
  activeSortKey: EmployeeRequestFormListSortKey,
  direction: EmployeeRequestFormListSortDirection,
) {
  switch (activeSortKey) {
    case 'main_position':
    case 'department':
    case 'business_unit':
    case 'recruiter_name':
    case 'position_status':
    case 'employment_status':
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
    case 'required_date':
    case 'closed_date':
      return compareNullableValues(
        parseDateValue(left[activeSortKey]),
        parseDateValue(right[activeSortKey]),
        direction,
      )
    case 'approval_progress': {
      const leftSummary = getApprovalSummary(left)
      const rightSummary = getApprovalSummary(right)
      return (
        compareNullableValues(leftSummary.approvedCount, rightSummary.approvedCount, direction)
        || compareNullableValues(leftSummary.totalCount, rightSummary.totalCount, direction)
      )
    }
    case 'current_approval':
      return compareNullableValues(
        employeeRequestFormCurrentApprovalLabel(left),
        employeeRequestFormCurrentApprovalLabel(right),
        direction,
      )
    case 'last_approval_date':
      return compareNullableValues(
        parseDateValue(getApprovalSummary(left).lastApprovalDate),
        parseDateValue(getApprovalSummary(right).lastApprovalDate),
        direction,
      )
    case 'status':
      return compareNullableValues(
        employeeRequestFormStatusLabel(left),
        employeeRequestFormStatusLabel(right),
        direction,
      )
    default:
      return 0
  }
}

const sortedJobs = computed(() => {
  const activeSortKey = sortKey.value

  if (!activeSortKey) {
    return filteredJobs.value
  }

  return [...filteredJobs.value].sort((left, right) =>
    compareJobs(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedJobs.value.length / pageSize)))
const pagedJobs = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedJobs.value.slice(start, start + pageSize)
})

function resetPage() {
  page.value = 1
}

watch([searchQuery, departmentFilter, businessUnitFilter, positionStatusFilter, employmentFilter], resetPage)
watch(
  () => sortedJobs.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)

function resetFilters() {
  searchQuery.value = ''
  departmentFilter.value = ''
  businessUnitFilter.value = ''
  positionStatusFilter.value = ''
  employmentFilter.value = ''
}

function toggleSort(key: EmployeeRequestFormListSortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = ['required_date', 'last_approval_date', 'closed_date'].includes(key)
    ? 'desc'
    : 'asc'
}

function sortIndicator(key: EmployeeRequestFormListSortKey) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function goToCreate() {
  router.push('/employee-request-forms/create')
}

function goToDetail(id: string) {
  router.push(`/employee-request-forms/${id}`)
}

function goToEdit(id: string) {
  router.push(`/employee-request-forms/${id}/edit`)
}

function employeeRequestFormStatusLabel(job: EmployeeRequestForm) {
  return recruitmentFlowStageLabel(resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  }))
}

function employeeRequestFormStatusBadgeClass(job: EmployeeRequestForm) {
  return recruitmentFlowStageBadgeClass(resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  }))
}

function displayValue(value: string | null | undefined) {
  return String(value ?? '').trim() || '-'
}

function buildEmployeeRequestFormExcelRows(items: EmployeeRequestForm[]) {
  return items.map((job, index) => ({
    'No': index + 1,
    'ERF ID': displayValue(job.id),
    [text('employeeRequestForms.form.fields.requester')]: displayValue(job.created_by_name),
    [text('common.labels.mainPosition')]: displayValue(job.main_position),
    [text('employeeRequestForms.form.fields.costCenterPt')]: displayValue(job.pt_pembebanan),
    [text('common.labels.department')]: displayValue(job.department),
    [text('employeeRequestForms.list.table.buCategory')]: displayValue(job.business_unit),
    [text('common.labels.designation')]: displayValue(job.designation),
    [text('common.labels.recruiter')]: displayValue(job.recruiter_name),
    [text('common.labels.positionStatus')]: displayValue(job.position_status),
    [text('common.labels.employmentStatus')]: displayValue(job.employment_status),
    [text('employeeRequestForms.form.fields.directHead')]: displayValue(job.direct_manager),
    [text('employeeRequestForms.form.fields.site')]: displayValue(job.site),
    [text('employeeRequestForms.form.fields.workingLocation')]: displayValue(job.working_location),
    [text('employeeRequestForms.form.fields.requestedDate')]: formatDateDisplay(job.requested_date || job.created_at),
    [text('common.labels.requiredDate')]: formatDateDisplay(job.required_date),
    [text('employeeRequestForms.form.fields.probationPeriodMonths')]: job.periode_probation ?? '-',
    [text('employeeRequestForms.form.fields.customGroup', { index: 1 })]: displayValue(job.custom_grup_1),
    [text('employeeRequestForms.form.fields.customGroup', { index: 2 })]: displayValue(job.custom_grup_2),
    [text('employeeRequestForms.form.fields.customGroup', { index: 3 })]: displayValue(job.custom_grup_3),
    [text('employeeRequestForms.form.fields.customGroup', { index: 4 })]: displayValue(job.custom_grup_4),
    [text('employeeRequestForms.form.fields.customGroup', { index: 5 })]: displayValue(job.custom_grup_5),
    [text('employeeRequestForms.form.fields.customGroup', { index: 6 })]: displayValue(job.custom_grup_6),
    [text('employeeRequestForms.list.table.approvalProgress')]: employeeRequestFormApprovalProgressLabel(job),
    [text('employeeRequestForms.list.table.currentApproval')]: employeeRequestFormCurrentApprovalLabel(job),
    'BU Director ': displayValue(job.approval_director_bu),
    'BU Director Approval Date': formatDateDisplay(job.approval_director_bu_date),
    'GM HRD': displayValue(job.approval_gm_hrd),
    'GM HRD Approval Date': formatDateDisplay(job.approval_gm_hrd_date),
    'Director HRD': displayValue(job.approval_director_hrd),
    'Director HRD Approval Date': formatDateDisplay(job.approval_director_hrd_date),
    [text('employeeRequestForms.list.table.lastApprovalDate')]: formatDateDisplay(
      getApprovalSummary(job).lastApprovalDate,
    ),
    [text('common.labels.status')]: employeeRequestFormStatusLabel(job),
    'Vacancy Status': displayValue(job.vacancy_status),
    'Passed Candidate': displayValue(job.passed_candidate_name),
    [text('common.labels.closedDate')]: job.status === 'closed'
      ? formatDateDisplay(job.closed_date)
      : '-',
    'Closed Category': displayValue(job.closed_category),
    [text('common.labels.reason')]: displayValue(job.reason),
    'Created At': formatDateDisplay(job.created_at),
    'Updated At': formatDateDisplay(job.updated_at),
  }))
}

function applyExcelHeaderStyle(sheet: Record<string, unknown>, headerCount: number) {
  const style = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '1D4ED8' } },
    alignment: { horizontal: 'center', wrapText: true },
  }

  for (let index = 0; index < headerCount; index += 1) {
    const column = index < 26
      ? String.fromCharCode(65 + index)
      : `A${String.fromCharCode(65 + index - 26)}`
    const cell = `${column}1`
    const cellData = sheet[cell] as { s?: unknown } | undefined
    if (cellData) {
      cellData.s = style
    }
  }
}

function buildEmployeeRequestFormExportFilename() {
  return `employee-request-forms-${new Date().toISOString().slice(0, 10)}.xlsx`
}

function getRowActions(job: EmployeeRequestForm): RowAction[] {
  const actions: RowAction[] = [
    { label: text('common.actions.detail'), onClick: () => goToDetail(job.id) },
  ]
  const flowStage = resolveRecruitmentFlowStage({
    employeeRequestForm: job,
  })
  const canEditJob = canUpdateEmployeeRequestForm.value && job.status !== 'closed'
  const isTerminalActionHiddenStage = ['hiring_completed', 'closed', 'rejected'].includes(flowStage)

  if (canEditJob) {
    actions.splice(1, 0, {
      label: text('common.actions.edit'),
      disabled: saving.value,
      onClick: () => goToEdit(job.id),
    })
  }

  if (job.status !== 'closed' && !isTerminalActionHiddenStage && canCloseEmployeeRequestForm.value) {
    actions.push({
      label: text('employeeRequestForms.list.actions.closeErf'),
      disabled: saving.value,
      onClick: () => openCloseModal(job.id),
    })
  }

  if (canExportEmployeeRequestFormPdf.value) {
    actions.push({
      label: text('common.actions.exportPdf'),
      disabled: saving.value,
      onClick: () => handleExportPdf(job),
    })
  }

  if (canUpdateEmployeeRequestForm.value) {
    actions.push({
      label: text('common.actions.delete'),
      tone: 'danger',
      disabled: saving.value,
      onClick: () => handleDelete(job.id, job.main_position || ''),
    })
  }

  return actions
}

async function handleDelete(id: string, mainPosition: string) {
  const confirmed = await appConfirm.confirm({
    title: text('common.actions.confirm'),
    message: text('employeeRequestForms.list.confirm.delete', { position: mainPosition }),
    confirmLabel: text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: 'danger',
  })
  if (!confirmed) return
  try {
    deletingEmployeeRequestForm.value = true
    await remove(id)
    appToast.success(text('employeeRequestForms.list.toasts.deleted'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('employeeRequestForms.list.errors.deleteFailed')
    appToast.error(message)
  } finally {
    deletingEmployeeRequestForm.value = false
  }
}

async function handleExportPdf(job: EmployeeRequestForm) {
  let previewWindow: Window | null = null
  pdfActionLoading.value = true

  try {
    previewWindow = openPdfPreviewWindow('The PDF preview window could not be opened.')
    const printableJob = await getById(job.id)
    exportEmployeeRequestFormPdf(printableJob ?? job, { previewWindow })
    appToast.success(text('employeeRequestForms.list.toasts.exported'))
  } catch (err) {
    closePdfPreviewWindow(previewWindow)
    const message = err instanceof Error ? err.message : text('employeeRequestForms.list.errors.exportFailed')
    appToast.error(message)
  } finally {
    pdfActionLoading.value = false
  }
}

function handleExportExcel() {
  if (excelActionLoading.value || visibleJobs.value.length === 0) {
    return
  }

  excelActionLoading.value = true
  appToast.success(text('employeeRequestForms.list.toasts.exportPreparing'))
  void runExportExcel()
}

async function runExportExcel() {
  await Promise.resolve()

  try {
    const { utils, writeFile } = await import('xlsx-js-style')
    const workbook = utils.book_new()
    const exportRows = buildEmployeeRequestFormExcelRows(visibleJobs.value)
    const sheet = utils.json_to_sheet(exportRows)
    const headers = Object.keys(exportRows[0] ?? {})

    applyExcelHeaderStyle(sheet as Record<string, unknown>, headers.length)
    sheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 2, 18) }))
    utils.book_append_sheet(workbook, sheet, 'Employee Request Forms')
    writeFile(workbook, buildEmployeeRequestFormExportFilename())

    appToast.success(text('employeeRequestForms.list.toasts.exportedExcel'))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('employeeRequestForms.list.errors.exportExcelFailed')
    appToast.error(message)
  } finally {
    excelActionLoading.value = false
  }
}

function openCloseModal(id: string) {
  if (!canCloseEmployeeRequestForm.value) {
    appToast.error(text('employeeRequestForms.list.errors.closePermissionDenied'))
    return
  }

  selectedJobId.value = id
  closeForm.value = createEmployeeRequestFormCloseState()
  showCloseModal.value = true
}

async function handleClose() {
  if (!canCloseEmployeeRequestForm.value) {
    appToast.error(text('employeeRequestForms.list.errors.closePermissionDenied'))
    return
  }

  if (!closeForm.value.category || !closeForm.value.reason) return

  try {
    await close(
      selectedJobId.value,
      closeForm.value.category as 'canceled' | 'done',
      closeForm.value.reason,
    )
    appToast.success(text('employeeRequestForms.list.toasts.closed'))
    showCloseModal.value = false
  } catch (err) {
    const message = err instanceof Error ? err.message : text('employeeRequestForms.list.errors.closeFailed')
    appToast.error(message)
  }
}
</script>
