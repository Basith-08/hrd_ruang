<template>
  <section class="app-dashboard-panel">
    <div class="app-dashboard-panel-header">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-2xl">
            <p class="app-dashboard-eyebrow">
              {{ eyebrow }}
            </p>
            <h3 class="app-dashboard-title">
              {{ title }}
            </h3>
            <p class="app-dashboard-copy">
              {{ description }}
            </p>
          </div>

          <div class="app-dashboard-segmented">
            <button
              v-for="tab in statusTabs"
              :key="tab.key"
              type="button"
              class="app-dashboard-segmented-button"
              :class="
                activeStatusTab === tab.key
                  ? 'app-dashboard-segmented-button-active'
                  : ''
              "
              @click="emit('update:activeStatusTab', tab.key)"
            >
              <span>{{ tab.label }}</span>
              <span
                class="app-dashboard-badge-counter"
                :class="activeStatusTab === tab.key ? 'app-dashboard-badge-counter-inverse' : ''"
              >
                {{ tab.count }}
              </span>
            </button>
          </div>
        </div>

        <div class="app-dashboard-subpanel grid gap-3 lg:grid-cols-[minmax(180px,1.4fr)_auto_auto] lg:items-end">
          <label class="block">
            <span class="app-fieldset-label mb-1.5 block">
              {{ searchLabel }}
            </span>
            <span class="sr-only">{{ searchAriaLabel }}</span>
            <AppSearchInput
              :model-value="searchQuery"
              :placeholder="searchPlaceholder"
              @update:model-value="emit('update:searchQuery', $event)"
            />
          </label>

          <div ref="columnsMenuRootRef" class="relative">
            <button
              type="button"
              class="app-dashboard-action-secondary h-11 whitespace-nowrap px-4 py-0"
              :aria-expanded="isColumnsMenuOpen ? 'true' : 'false'"
              aria-haspopup="listbox"
              @click="isColumnsMenuOpen = !isColumnsMenuOpen"
            >
              <Eye class="h-4 w-4 shrink-0" />
              {{ columnsLabel }}
            </button>

            <div
              v-if="isColumnsMenuOpen"
              class="absolute right-0 top-full z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-[0_18px_32px_-20px_rgba(15,23,42,0.38)]"
              role="listbox"
            >
              <p class="sticky top-0 border-b border-slate-100 bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {{ columnsLabel }}
              </p>
              <label
                v-for="column in manageableColumns"
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



          <button
            v-if="totalItems > 0"
            type="button"
            class="app-dashboard-action-success"
            @click="emit('exportExcel')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ exportExcelLabel }}
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <DnDProvider>
        <table class="w-full min-w-max border-separate border-spacing-0 text-left">
          <thead class="app-dashboard-table-head">
            <tr>
              <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap"
                style="width: 56px; min-width: 56px; max-width: 56px">
                {{ numberLabel }}
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
                      :aria-label="`${reorderColumnLabel}: ${column.label}`"
                      :title="reorderColumnLabel"
                    >
                      <GripVertical class="h-3.5 w-3.5" />
                    </button>

                    <button
                      v-if="isSortableColumnKey(column.key)"
                      type="button"
                      class="inline-flex min-w-0 items-center gap-2 transition hover:text-slate-800"
                      @click="emit('sort', column.key)"
                    >
                      <span class="truncate">{{ column.label }}</span>
                      <span class="shrink-0 text-[10px] normal-case text-slate-500">{{ sortIndicator(column.key) }}</span>
                    </button>
                    <span v-else class="truncate normal-case">{{ column.label }}</span>
                  </div>

                  <button
                    type="button"
                    class="app-icon-button-subtle shrink-0"
                    :aria-label="`${hideColumnLabel}: ${column.label}`"
                    :title="hideColumnLabel"
                    @click="hideColumn(column.key)"
                  >
                    <EyeOff class="h-3.5 w-3.5" />
                  </button>
                </div>
              </DraggableColumnHeader>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="row.id"
              class="transition hover:bg-sky-50/40"
            >
              <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 whitespace-nowrap"
                style="width: 56px; min-width: 56px; max-width: 56px">
                {{ rowNumber(index) }}
              </td>
              <template v-for="column in orderedVisibleColumns" :key="column.key">
                <td v-if="column.key === 'position'" :class="columnCellClass(column.key)">
                  <span class="text-[15px] font-semibold text-slate-900">{{ row.position }}</span>
                </td>
                <td v-else-if="column.key === 'businessUnit'" :class="columnCellClass(column.key)">
                  <div class="flex flex-col gap-1.5">
                    <span class="inline-flex w-fit rounded-md bg-slate-900/6 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {{ row.businessUnit }}
                    </span>
                    <span class="inline-flex w-fit rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {{ row.department }}
                    </span>
                  </div>
                </td>
                <td v-else-if="column.key === 'positionStatus'" :class="columnCellClass(column.key)">
                  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" :class="positionStatusBadgeClass(row.positionStatus)">
                    <span class="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {{ row.positionStatus }}
                  </span>
                </td>
                <td v-else-if="column.key === 'lastApprovalDate'" :class="columnCellClass(column.key)">
                  <div class="flex flex-col gap-1">
                    <span class="text-[13px] font-medium text-slate-700 whitespace-nowrap">
                      {{ row.lastApprovalDate }}
                    </span>
                    <span
                      v-if="row.statusAgeDays !== null"
                      :class="[
                        badgeClass(row.statusAgeDays),
                        'inline-flex w-fit self-start rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                      ]"
                    >
                      {{ formatDays(row.statusAgeDays) }}
                    </span>
                    <span v-else class="text-[12px] italic text-slate-400">
                      -
                    </span>
                  </div>
                </td>
                <td v-else-if="column.key === 'recruiter'" :class="columnCellClass(column.key)">
                  <div class="flex items-center gap-2.5">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4a9fd4_0%,#12205e_100%)]">
                      <span class="h-2.5 w-2.5 rounded-full bg-white/85" />
                    </span>
                    <span :class="row.recruiter === '-' ? 'text-sm italic text-slate-400' : 'text-sm text-slate-700'">
                      {{ firstNameOnly(row.recruiter) }}
                    </span>
                  </div>
                </td>
                <td v-else-if="column.key === 'candidateName'" :class="columnCellClass(column.key)">
                  <span :class="row.candidateName === '-' ? 'text-sm italic text-slate-400' : 'text-sm font-medium text-slate-700'">
                    {{ row.candidateName }}
                  </span>
                </td>
                <td v-else-if="column.key === 'employment'" :class="columnCellClass(column.key)">
                  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" :class="employmentBadgeClass(row.employment)">
                    {{ row.employment }}
                  </span>
                </td>
                <td v-else-if="column.key === 'designation'" :class="columnCellClass(column.key)">
                  <span class="inline-flex rounded-md bg-slate-900/6 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {{ row.designation }}
                  </span>
                </td>
                <td v-else-if="column.key === 'closedCategory'" :class="columnCellClass(column.key)">
                  {{ row.closedCategory }}
                </td>
                <td v-else-if="column.key === 'closeReason'" :class="columnCellClass(column.key)">
                  {{ row.closeReason }}
                </td>
                <td v-else-if="column.key === 'notes'" :class="columnCellClass(column.key)">
                  <textarea
                    class="app-field min-h-[44px] w-full resize-y rounded-md border-slate-200 bg-white text-sm"
                    :value="notesValue(row.employeeRequestFormId, row.notes)"
                    :placeholder="notesPlaceholder"
                    :disabled="isNoteSaving(row.employeeRequestFormId)"
                    @input="emit('update:note', {
                      employeeRequestFormId: row.employeeRequestFormId,
                      value: ($event.target as HTMLTextAreaElement).value,
                    })"
                    @keydown="handleNoteKeydown($event, row.employeeRequestFormId)"
                  />
                </td>
              </template>
            </tr>

            <tr v-if="!loading && totalItems === 0">
              <td :colspan="visibleColumnCount" class="px-6 py-10">
                <div class="app-dashboard-empty">
                  {{ emptyLabel }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </DnDProvider>
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
        @update:page="emit('update:page', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DnDProvider } from '@vue-dnd-kit/core'
import { Eye, EyeOff, GripVertical } from 'lucide-vue-next'

import type { DashboardStatusMode, DetailRow, DetailSortKey } from '@/features/recruitment/types/RecruitmentDashboardPage.type'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import DraggableColumnHeader from '@/presentation/components/tables/DraggableColumnHeader.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const emit = defineEmits<{
  (event: 'exportExcel'): void
  (event: 'update:searchQuery', value: string): void
  (event: 'update:activeStatusTab', value: string): void
  (event: 'sort', key: DetailSortKey): void
  (event: 'update:page', value: number): void
  (event: 'update:note', payload: { employeeRequestFormId: string; value: string }): void
  (event: 'confirm:note', payload: { employeeRequestFormId: string }): void
}>()

const {
  eyebrow,
  title,
  description,
  exportExcelLabel,
  columnsLabel,
  hideColumnLabel,
  reorderColumnLabel,
  statusMode,
  searchLabel,
  searchAriaLabel,
  searchPlaceholder,
  searchQuery,
  statusTabs,
  activeStatusTab,
  numberLabel,
  closedCategoryLabel,
  reasonLabel,
  notesLabel,
  notesPlaceholder,
  emptyLabel,
  loading,
  page,
  pageSize,
  totalItems,
  columns,
  rows,
  sortIndicator,
  badgeClass,
  formatDays,
  rowNumber,
  noteValues,
  noteSavingIds,
} = defineProps<{
  eyebrow: string
  title: string
  description: string
  exportExcelLabel: string
  columnsLabel: string
  hideColumnLabel: string
  reorderColumnLabel: string
  statusMode: DashboardStatusMode
  searchLabel: string
  searchAriaLabel: string
  searchPlaceholder: string
  searchQuery: string
  statusTabs: Array<{
    key: string
    label: string
    count: number
  }>
  activeStatusTab: string
  numberLabel: string
  closedCategoryLabel: string
  reasonLabel: string
  notesLabel: string
  notesPlaceholder: string
  emptyLabel: string
  loading: boolean
  page: number
  pageSize: number
  totalItems: number
  columns: Array<{
    key: DetailSortKey
    label: string
  }>
  rows: DetailRow[]
  sortIndicator: (key: DetailSortKey) => string
  badgeClass: (value: number | null) => string
  formatDays: (value: number | null) => string
  rowNumber: (index: number) => number
  noteValues: Record<string, string>
  noteSavingIds: string[]
}>()

type ManageableColumnKey = DetailSortKey | 'closedCategory' | 'closeReason' | 'notes'

const columnPreferencesStorageKey = 'hrd_ruang_recruitment_dashboard_detail_columns'

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

const hiddenColumnKeys = ref<Set<ManageableColumnKey>>(
  new Set((persistedColumnPreferences?.hidden ?? []) as ManageableColumnKey[]),
)
const isColumnsMenuOpen = ref(false)
const columnsMenuRootRef = ref<HTMLElement | null>(null)

const manageableColumns = computed(() => {
  const result: Array<{ key: ManageableColumnKey; label: string }> = columns
    .filter((column) => column.key !== 'department' && column.key !== 'statusAgeDays')
    .map((column) => ({ key: column.key, label: column.label }))

  if (statusMode !== 'open') {
    result.push({ key: 'closedCategory', label: closedCategoryLabel })
    result.push({ key: 'closeReason', label: reasonLabel })
  }

  result.push({ key: 'notes', label: notesLabel })

  return result
})

const visibleColumnCount = computed(
  () => 1 + manageableColumns.value.filter((column) => isColumnVisible(column.key)).length,
)

const columnOrder = ref<ManageableColumnKey[]>((() => {
  const defaultKeys = manageableColumns.value.map((column) => column.key)
  const savedOrder = (persistedColumnPreferences?.order ?? []) as ManageableColumnKey[]
  const kept = savedOrder.filter((key) => defaultKeys.includes(key))
  const added = defaultKeys.filter((key) => !kept.includes(key))
  return kept.length > 0 ? [...kept, ...added] : defaultKeys
})())

watch(manageableColumns, (next) => {
  const nextKeys = next.map((column) => column.key)
  const kept = columnOrder.value.filter((key) => nextKeys.includes(key))
  const added = nextKeys.filter((key) => !kept.includes(key))
  columnOrder.value = [...kept, ...added]
})

const orderedVisibleColumns = computed(() => {
  const byKey = new Map(manageableColumns.value.map((column) => [column.key, column]))
  return columnOrder.value
    .map((key) => byKey.get(key))
    .filter((column): column is { key: ManageableColumnKey; label: string } => column !== undefined && isColumnVisible(column.key))
})

function setColumnOrder(nextOrder: string[]) {
  columnOrder.value = nextOrder as ManageableColumnKey[]
}

const columnWidths = ref<Record<string, number>>(persistedColumnPreferences?.widths ?? {})

function setColumnWidth(key: ManageableColumnKey, width: number) {
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

function isSortableColumnKey(key: ManageableColumnKey): key is DetailSortKey {
  return key !== 'closedCategory' && key !== 'closeReason' && key !== 'notes'
}

function columnHeaderClass(key: ManageableColumnKey) {
  const base = 'border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400'

  switch (key) {
    case 'notes':
      return `${base} min-w-[220px]`
    case 'businessUnit':
    case 'closeReason':
      return `${base} min-w-[200px]`
    case 'lastApprovalDate':
    case 'candidateName':
    case 'recruiter':
      return `${base} min-w-[170px]`
    default:
      return `${base} min-w-[150px]`
  }
}

function columnCellClass(key: ManageableColumnKey) {
  switch (key) {
    case 'closeReason':
      return 'border-b border-slate-200 px-4 py-4 align-middle whitespace-normal text-sm leading-6 text-slate-600'
    case 'notes':
      return 'border-b border-slate-200 px-4 py-4 align-top'
    case 'businessUnit':
    case 'lastApprovalDate':
      return 'border-b border-slate-200 px-4 py-4 align-middle whitespace-normal'
    default:
      return 'border-b border-slate-200 px-4 py-4 align-middle whitespace-normal break-words'
  }
}

function isColumnVisible(key: ManageableColumnKey) {
  return !hiddenColumnKeys.value.has(key)
}

function hideColumn(key: ManageableColumnKey) {
  hiddenColumnKeys.value = new Set(hiddenColumnKeys.value).add(key)
}

function toggleColumnVisibility(key: ManageableColumnKey) {
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

function notesValue(employeeRequestFormId: string, fallback: string) {
  if (Object.prototype.hasOwnProperty.call(noteValues, employeeRequestFormId)) {
    return noteValues[employeeRequestFormId] ?? ''
  }

  return fallback
}

function isNoteSaving(employeeRequestFormId: string) {
  return noteSavingIds.includes(employeeRequestFormId)
}

function handleNoteKeydown(event: KeyboardEvent, employeeRequestFormId: string) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('confirm:note', { employeeRequestFormId })
  }
}

const pageStart = computed(() => {
  if (totalItems === 0) return 0
  return (page - 1) * pageSize + 1
})

const pageEnd = computed(() => {
  if (totalItems === 0) return 0
  return Math.min(page * pageSize, totalItems)
})

function firstNameOnly(value: string) {
  if (!value || value === '-') return value
  return value.trim().split(/\s+/)[0] ?? value
}

function employmentBadgeClass(value: string) {
  const key = value.toLowerCase()

  if (key.includes('permanent')) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (key.includes('daily')) {
    return 'bg-slate-100 text-slate-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function positionStatusBadgeClass(value: string) {
  const key = value.toLowerCase()

  if (key.includes('replacement')) {
    return 'bg-amber-50 text-amber-700'
  }

  if (key.includes('non-mpp')) {
    return 'bg-indigo-50 text-indigo-700'
  }

  if (key.includes('mpp')) {
    return 'bg-sky-50 text-sky-700'
  }

  if (key.includes('intern')) {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-700'
}
</script>
