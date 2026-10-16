<template>
  <div class="hidden lg:block">
    <div class="flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-2">
      <div ref="columnsMenuRootRef" class="relative">
        <button
          type="button"
          class="app-dashboard-action-secondary h-9 whitespace-nowrap px-3 py-0 text-xs"
          :aria-expanded="isColumnsMenuOpen ? 'true' : 'false'"
          aria-haspopup="listbox"
          @click="isColumnsMenuOpen = !isColumnsMenuOpen"
        >
          <Eye class="h-3.5 w-3.5 shrink-0" />
          {{ text('common.actions.columns') }}
        </button>

        <div
          v-if="isColumnsMenuOpen"
          class="absolute right-0 top-full z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.38)]"
          role="listbox"
        >
          <p class="sticky top-0 border-b border-slate-100 bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {{ text('common.actions.columns') }}
          </p>
          <label
            v-for="column in columnDefinitions"
            :key="column.key"
            class="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-left text-sm text-slate-600 transition last:border-b-0 hover:bg-slate-50"
          >
            <span class="truncate">{{ column.label }}</span>
            <input
              type="checkbox"
              class="h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              :checked="isColumnVisible(column.key)"
              @change="toggleColumnVisibility(column.key)"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <DnDProvider>
        <table class="w-full border-separate border-spacing-0 text-left text-sm">
          <thead class="app-dashboard-table-head">
            <tr>
              <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap"
                style="width: 56px; min-width: 56px; max-width: 56px">
                {{ text('common.labels.no') }}
              </th>

              <DraggableColumnHeader
                v-for="column in orderedVisibleColumns"
                :key="column.key"
                :column-key="column.key"
                :order="columnOrder"
                :width="columnWidths[column.key]"
                :class="columnHeaderClass(column.key)"
                @reorder="setColumnOrder"
                @resize="(width) => setColumnWidth(column.key, width)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-1.5">
                    <button
                      type="button"
                      data-column-drag-handle
                      class="app-icon-button-subtle shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                      :aria-label="`${text('common.actions.reorderColumn')}: ${column.label}`"
                      :title="text('common.actions.reorderColumn')"
                    >
                      <GripVertical class="h-3.5 w-3.5" />
                    </button>

                    <button v-if="isSortableColumnKey(column.key)" type="button"
                      class="inline-flex min-w-0 items-center gap-2 transition hover:text-slate-800"
                      @click="$emit('sort', column.key)">
                      <span class="truncate">{{ column.label }}</span>
                      <span class="shrink-0 text-[10px] normal-case text-slate-500">{{ sortIndicator(column.key) }}</span>
                    </button>
                    <span v-else class="truncate normal-case">{{ column.label }}</span>
                  </div>

                  <button
                    type="button"
                    class="app-icon-button-subtle shrink-0"
                    :aria-label="`${text('common.actions.hideColumn')}: ${column.label}`"
                    :title="text('common.actions.hideColumn')"
                    @click="hideColumn(column.key)"
                  >
                    <EyeOff class="h-3.5 w-3.5" />
                  </button>
                </div>
              </DraggableColumnHeader>
            </tr>
          </thead>

          <tbody>
            <template v-if="!loading && items.length > 0">
              <tr
                v-for="(job, index) in items"
                :key="job.id || index"
                class="transition hover:bg-sky-50/40"
              >
                <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 align-middle whitespace-nowrap"
                  style="width: 56px; min-width: 56px; max-width: 56px">
                  {{ pageOffset + index + 1 }}
                </td>

                <template v-for="column in orderedVisibleColumns" :key="column.key">
                  <td v-if="column.key === 'main_position'" :class="columnCellClass(column.key)">
                    <span class="app-copy-strong">{{ fallback(job.main_position) }}</span>
                  </td>
                  <td v-else-if="column.key === 'department'" :class="columnCellClass(column.key)">
                    <span class="app-copy-strong">{{ fallback(job.department) }}</span>
                  </td>
                  <td v-else-if="column.key === 'business_unit'" :class="columnCellClass(column.key)">
                    {{ fallback(job.business_unit) }}
                  </td>
                  <td v-else-if="column.key === 'recruiter_name'" :class="columnCellClass(column.key)">
                    {{ fallback(job.recruiter_name) }}
                  </td>
                  <td v-else-if="column.key === 'position_status'" :class="columnCellClass(column.key)">
                    <span class="app-status-chip app-erf-position-status-chip" :class="positionStatusBadgeClass(job)">
                      {{ job.position_status || text('common.status.noStatus') }}
                    </span>
                  </td>
                  <td v-else-if="column.key === 'employment_status'" :class="columnCellClass(column.key)">
                    {{ fallback(job.employment_status) }}
                  </td>
                  <td v-else-if="column.key === 'required_date'" :class="columnCellClass(column.key)">
                    {{ dateValue(job.required_date) }}
                  </td>
                  <td v-else-if="column.key === 'approval_progress'" :class="columnCellClass(column.key)">
                    {{ approvalProgressLabel(job) }}
                  </td>
                  <td v-else-if="column.key === 'current_approval'" :class="columnCellClass(column.key)">
                    {{ currentApprovalLabel(job) }}
                  </td>
                  <td v-else-if="column.key === 'last_approval_date'" :class="columnCellClass(column.key)">
                    {{ lastApprovalDateValue(job) }}
                  </td>
                  <td v-else-if="column.key === 'status'" :class="columnCellClass(column.key)">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" :class="statusBadgeClass(job)">
                      {{ statusLabel(job) }}
                    </span>
                  </td>
                  <td v-else-if="column.key === 'closed_date'" :class="columnCellClass(column.key)">
                    {{ job.status === 'closed' && job.closed_date ? dateValue(job.closed_date) : '-' }}
                  </td>
                  <td v-else-if="column.key === 'actions'" :class="columnCellClass(column.key)">
                    <RowActionsMenu :actions="getRowActions(job)" />
                  </td>
                </template>
              </tr>
            </template>

            <tr v-else-if="loading">
              <td :colspan="visibleColumnCount" class="px-6 py-20 text-center">
                <div class="app-table-muted flex flex-col items-center justify-center gap-3">
                  <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p class="text-xs font-medium">
                    {{ text('common.loading') }}
                  </p>
                </div>
              </td>
            </tr>

            <tr v-else>
              <td :colspan="visibleColumnCount" class="px-6 py-10">
                <div class="app-dashboard-empty">
                  {{ text('common.noMatchingData') }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </DnDProvider>
    </div>
  </div>

  <div class="app-dashboard-mobile-stack lg:hidden">
    <article
      v-for="(job, index) in items"
      :key="job.id || index"
      class="app-candidate-card"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="app-table-muted text-xs font-medium">#{{ pageOffset + index + 1 }}</span>
            <span class="app-status-chip app-erf-position-status-chip" :class="positionStatusBadgeClass(job)">
              {{ job.position_status || text('common.status.noStatus') }}
            </span>
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" :class="statusBadgeClass(job)">
              {{ statusLabel(job) }}
            </span>
          </div>
          <h2 class="app-card-title mt-2 truncate text-base">
            {{ fallback(job.main_position) }}
          </h2>
          <p class="app-copy-body app-copy-strong mt-1 truncate">
            {{ fallback(job.department) }}
          </p>
          <p class="app-table-muted mt-1 truncate text-xs">
            {{ fallback(job.business_unit) }} • {{ fallback(job.recruiter_name) }}
          </p>
        </div>
      </div>

      <dl class="mt-4 grid gap-3 border-t app-table-divider pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt class="app-label-compact">{{ text('common.labels.employmentStatus') }}</dt>
          <dd class="app-copy-body mt-1">{{ fallback(job.employment_status) }}</dd>
        </div>
        <div>
          <dt class="app-label-compact">{{ text('common.labels.requiredDate') }}</dt>
          <dd class="app-copy-body mt-1">{{ dateValue(job.required_date) }}</dd>
        </div>
        <div>
          <dt class="app-label-compact">{{ text('employeeRequestForms.list.table.approvalProgress') }}</dt>
          <dd class="app-copy-body mt-1">{{ approvalProgressLabel(job) }}</dd>
        </div>
        <div>
          <dt class="app-label-compact">{{ text('employeeRequestForms.list.table.currentApproval') }}</dt>
          <dd class="app-copy-body mt-1">{{ currentApprovalLabel(job) }}</dd>
        </div>
      </dl>

      <div class="mt-4 flex flex-wrap gap-2">
        <RowActionsMenu :actions="getRowActions(job)" />
      </div>
    </article>

    <div v-if="!loading && items.length === 0" class="app-dashboard-empty">
      {{ text('common.noMatchingData') }}
    </div>
  </div>

  <div v-if="!loading && totalItems > 0" class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="text-sm text-slate-500">
      <strong class="font-semibold text-slate-800">{{ pageStart }}</strong>
      -
      <strong class="font-semibold text-slate-800">{{ pageEnd }}</strong>
      /
      <strong class="font-semibold text-slate-800">{{ totalItems }}</strong>
    </div>

    <TablePagination
      :page="page"
      :page-size="pageSize"
      :total-items="totalItems"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'
import { DnDProvider } from '@vue-dnd-kit/core'
import { Eye, EyeOff, GripVertical } from 'lucide-vue-next'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type {
  EmployeeRequestFormListSortKey,
} from '@/features/employeeRequestForms/types/EmployeeRequestFormList.type'
import RowActionsMenu from '@/presentation/components/menus/RowActionsMenu.vue'
import type { RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import DraggableColumnHeader from '@/presentation/components/tables/DraggableColumnHeader.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'
import { buildApprovalProgressSummary } from '@/domain/utils/approvalSummary'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'

type SortableColumnKey = EmployeeRequestFormListSortKey
type ColumnKey = SortableColumnKey | 'actions'

const props = defineProps({
  items: {
    type: Array as PropType<EmployeeRequestForm[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
  statusLabel: {
    type: Function as PropType<(job: EmployeeRequestForm) => string>,
    required: true,
  },
  statusBadgeClass: {
    type: Function as PropType<(job: EmployeeRequestForm) => string>,
    required: true,
  },
  getRowActions: {
    type: Function as PropType<(job: EmployeeRequestForm) => RowAction[]>,
    required: true,
  },
  sortIndicator: {
    type: Function as PropType<(key: EmployeeRequestFormListSortKey) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'sort', key: EmployeeRequestFormListSortKey): void
}>()

const pageOffset = computed(() => (props.page - 1) * props.pageSize)
const pageStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})
const pageEnd = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min(props.page * props.pageSize, props.totalItems)
})

const columnDefinitions = computed<Array<{ key: ColumnKey; label: string }>>(() => [
  { key: 'main_position', label: props.text('common.labels.mainPosition') },
  { key: 'department', label: props.text('common.labels.department') },
  { key: 'business_unit', label: props.text('employeeRequestForms.list.table.buCategory') },
  { key: 'recruiter_name', label: props.text('common.labels.recruiter') },
  { key: 'position_status', label: props.text('common.labels.positionStatus') },
  { key: 'employment_status', label: props.text('common.labels.employmentStatus') },
  { key: 'required_date', label: props.text('common.labels.requiredDate') },
  { key: 'approval_progress', label: props.text('employeeRequestForms.list.table.approvalProgress') },
  { key: 'current_approval', label: props.text('employeeRequestForms.list.table.currentApproval') },
  { key: 'last_approval_date', label: props.text('employeeRequestForms.list.table.lastApprovalDate') },
  { key: 'status', label: props.text('common.labels.status') },
  { key: 'closed_date', label: props.text('common.labels.closedDate') },
  { key: 'actions', label: props.text('common.labels.actions') },
])

function isSortableColumnKey(key: ColumnKey): key is SortableColumnKey {
  return key !== 'actions'
}

const columnPreferencesStorageKey = 'hrd_ruang_employee_request_form_table_columns'

type PersistedColumnPreferences = {
  order: string[]
  widths: Record<string, number>
  hidden: string[]
}

function readPersistedColumnPreferences(): PersistedColumnPreferences | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(columnPreferencesStorageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((key: unknown): key is string => typeof key === 'string')
      : []
    const widths = parsed.widths && typeof parsed.widths === 'object' ? parsed.widths : {}
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((key: unknown): key is string => typeof key === 'string')
      : []

    return { order, widths, hidden }
  } catch {
    return null
  }
}

function writePersistedColumnPreferences(preferences: PersistedColumnPreferences) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(columnPreferencesStorageKey, JSON.stringify(preferences))
  } catch {
    // ignore storage failures (e.g. private browsing quota)
  }
}

const persistedColumnPreferences = readPersistedColumnPreferences()

const hiddenColumnKeys = ref<Set<ColumnKey>>(
  new Set((persistedColumnPreferences?.hidden ?? []) as ColumnKey[]),
)
const isColumnsMenuOpen = ref(false)
const columnsMenuRootRef = ref<HTMLElement | null>(null)

const columnOrder = ref<ColumnKey[]>((() => {
  const defaultKeys = columnDefinitions.value.map((column) => column.key)
  const savedOrder = (persistedColumnPreferences?.order ?? []) as ColumnKey[]
  const kept = savedOrder.filter((key) => defaultKeys.includes(key))
  const added = defaultKeys.filter((key) => !kept.includes(key))
  return kept.length > 0 ? [...kept, ...added] : defaultKeys
})())

const orderedVisibleColumns = computed(() => {
  const byKey = new Map(columnDefinitions.value.map((column) => [column.key, column]))
  return columnOrder.value
    .map((key) => byKey.get(key))
    .filter((column): column is { key: ColumnKey; label: string } => column !== undefined && isColumnVisible(column.key))
})

const visibleColumnCount = computed(() => 1 + orderedVisibleColumns.value.length)

function setColumnOrder(nextOrder: string[]) {
  columnOrder.value = nextOrder as ColumnKey[]
}

const columnWidths = ref<Record<string, number>>(persistedColumnPreferences?.widths ?? {})

function setColumnWidth(key: ColumnKey, width: number) {
  columnWidths.value = { ...columnWidths.value, [key]: width }
}

watch(
  [columnOrder, columnWidths, hiddenColumnKeys],
  ([order, widths, hidden]) => {
    writePersistedColumnPreferences({
      order,
      widths,
      hidden: Array.from(hidden),
    })
  },
)

function isColumnVisible(key: ColumnKey) {
  return !hiddenColumnKeys.value.has(key)
}

function hideColumn(key: ColumnKey) {
  hiddenColumnKeys.value = new Set(hiddenColumnKeys.value).add(key)
}

function toggleColumnVisibility(key: ColumnKey) {
  const next = new Set(hiddenColumnKeys.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  hiddenColumnKeys.value = next
}

function handleColumnsMenuPointerDown(event: PointerEvent) {
  if (!columnsMenuRootRef.value) return

  if (!columnsMenuRootRef.value.contains(event.target as Node)) {
    isColumnsMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleColumnsMenuPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleColumnsMenuPointerDown)
})

function columnHeaderClass(key: ColumnKey) {
  const base = 'border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'

  switch (key) {
    case 'main_position':
    case 'actions':
      return `${base} min-w-[220px]`
    case 'required_date':
    case 'last_approval_date':
    case 'closed_date':
      return `${base} min-w-[160px]`
    case 'approval_progress':
      return `${base} min-w-[170px]`
    default:
      return `${base} min-w-[180px]`
  }
}

function columnCellClass(key: ColumnKey) {
  const base = 'border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap'

  if (key === 'required_date' || key === 'closed_date') {
    return `${base} text-slate-600`
  }

  if (key === 'actions') {
    return `${base} text-right`
  }

  return base
}

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

function normalizeStatus(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function positionStatusBadgeClass(job: EmployeeRequestForm) {
  const baseClass = 'app-status-chip app-erf-position-status-chip whitespace-nowrap'

  switch (normalizeStatus(job.position_status)) {
    case 'replacement':
      return `${baseClass} app-status-job-replacement`
    case 'new position mpp':
      return `${baseClass} app-status-job-new`
    case 'new position non-mpp':
      return `${baseClass} app-status-job-growth`
    case 'internship':
      return `${baseClass} app-status-job-internship`
    default:
      return `${baseClass} app-status-job-default`
  }
}

function dateValue(value: string | null | undefined) {
  return formatDateDisplay(value)
}

function approvalProgressLabel(job: EmployeeRequestForm) {
  const summary = buildApprovalProgressSummary(job.approval_steps, {
    approval_director_bu: job.approval_director_bu,
    approval_director_bu_date: job.approval_director_bu_date,
    approval_gm_hrd: job.approval_gm_hrd,
    approval_gm_hrd_date: job.approval_gm_hrd_date,
    approval_director_hrd: job.approval_director_hrd,
    approval_director_hrd_date: job.approval_director_hrd_date,
  })

  return `${summary.approvedCount}/${summary.totalCount} ${props.text('employeeRequestForms.list.table.approvalProgressSuffix')}`
}

function currentApprovalLabel(job: EmployeeRequestForm) {
  const summary = buildApprovalProgressSummary(job.approval_steps, {
    approval_director_bu: job.approval_director_bu,
    approval_director_bu_date: job.approval_director_bu_date,
    approval_gm_hrd: job.approval_gm_hrd,
    approval_gm_hrd_date: job.approval_gm_hrd_date,
    approval_director_hrd: job.approval_director_hrd,
    approval_director_hrd_date: job.approval_director_hrd_date,
  })

  return summary.currentApprovalLabel
}

function lastApprovalDateValue(job: EmployeeRequestForm) {
  const summary = buildApprovalProgressSummary(job.approval_steps, {
    approval_director_bu: job.approval_director_bu,
    approval_director_bu_date: job.approval_director_bu_date,
    approval_gm_hrd: job.approval_gm_hrd,
    approval_gm_hrd_date: job.approval_gm_hrd_date,
    approval_director_hrd: job.approval_director_hrd,
    approval_director_hrd_date: job.approval_director_hrd_date,
  })

  return dateValue(summary.lastApprovalDate)
}
</script>

<style scoped>
:deep(.app-erf-position-status-chip) {
  padding: 0.18rem 0.5rem;
  font-size: 0.61rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: none;
}
</style>
