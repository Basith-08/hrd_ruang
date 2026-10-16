<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1280px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            {{ text('userManagement.history.table.referenceDate') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[240px]">
            {{ text('userManagement.history.table.user') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
            {{ text('userManagement.history.table.username') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            {{ text('userManagement.history.table.role') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[200px]">
            {{ text('userManagement.history.table.mainPosition') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            {{ text('userManagement.history.table.status') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
            {{ text('userManagement.history.table.actions') }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && items.length > 0">
          <tr
            v-for="entry in items"
            :key="entry.id"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ formatHistoryReferenceDate(entry) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle">
              <p class="app-copy-strong whitespace-nowrap">
                {{ entry.full_name || '-' }}
              </p>
              <p class="app-helper-text mt-1 whitespace-nowrap">
                {{ entry.email || '-' }}
              </p>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ entry.username ? `@${entry.username}` : '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-status-chip app-status-chip-neutral">
                {{ entry.role || noRoleLabel }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ entry.main_position || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span
                class="app-status-chip"
                :class="entry.is_active === false ? 'app-status-chip-danger' : 'app-status-chip-success'"
              >
                {{ entry.is_active === false ? inactiveLabel : activeLabel }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <RowActionsMenu :actions="buildActions(entry)" />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td colspan="7" class="px-6 py-20 text-center">
            <div class="app-table-muted flex flex-col items-center justify-center gap-3">
              <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p class="text-xs font-medium">
                {{ loadingMessage }}
              </p>
            </div>
          </td>
        </tr>

        <tr v-else>
          <td colspan="7" class="px-6 py-10">
            <div class="app-dashboard-empty">
              {{ emptyMessage }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="!loading && totalItems > 0"
    class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
  >
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
import { computed } from 'vue'

import { useLocale } from '@/composables/useLocale'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import RowActionsMenu, { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps<{
  items: UserHistoryEntry[]
  loading: boolean
  loadingMessage: string
  emptyMessage: string
  noRoleLabel: string
  activeLabel: string
  inactiveLabel: string
  page: number
  pageSize: number
  totalItems: number
  formatHistoryReferenceDate: (entry: UserHistoryEntry) => string
  canSwitchToEmployee: (entry: UserHistoryEntry) => boolean
  buildActions: (entry: UserHistoryEntry) => RowAction[]
}>()

defineEmits<{
  (event: 'update:page', value: number): void
}>()

const { text } = useLocale()
const pageStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})
const pageEnd = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min(props.page * props.pageSize, props.totalItems)
})
</script>
