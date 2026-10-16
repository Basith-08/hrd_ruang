<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="min-w-[56px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            No
          </th>
          <th class="min-w-[200px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'department')">
              <span>{{ departmentLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('department') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'main_position')">
              <span>{{ mainPositionLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('main_position') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'position')">
              <span>{{ positionLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('position') }}</span>
            </button>
          </th>
          <th class="min-w-[200px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'employment_status')">
              <span>{{ employmentStatusLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('employment_status') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'candidate_name')">
              <span>{{ candidateNameLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('candidate_name') }}</span>
            </button>
          </th>
          <th class="min-w-[140px] border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ actionsLabel }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && items.length > 0">
          <tr
            v-for="(item, index) in items"
            :key="item.id || index"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 align-middle text-slate-400 whitespace-nowrap">
              {{ rowNumber(index) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ item.employee_request_form?.department || '-' }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ item.employee_request_form?.main_position || '-' }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ item.employee_request_form?.position || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ item.employee_request_form?.employment_status || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ item.candidate_name || item.candidate_email || '-' }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <RowActionsMenu :actions="buildRowActions(item)" />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td colspan="7" class="px-6 py-20 text-center">
            <div class="app-table-muted flex flex-col items-center justify-center gap-3">
              <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p class="text-xs font-medium">
                Loading
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
    class="border-t border-slate-200 bg-slate-50/80 px-5 py-3"
  >
    <TablePagination
      :page="page"
      :page-size="pageSize"
      :total-items="totalItems"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'

import type { EmployeeContractFormRecord } from '@/features/recruitment/types/EmployeeContractForm.type'
import RowActionsMenu, { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  items: {
    type: Array as PropType<EmployeeContractFormRecord[]>,
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
  departmentLabel: {
    type: String,
    required: true,
  },
  mainPositionLabel: {
    type: String,
    required: true,
  },
  positionLabel: {
    type: String,
    required: true,
  },
  employmentStatusLabel: {
    type: String,
    required: true,
  },
  candidateNameLabel: {
    type: String,
    required: true,
  },
  actionsLabel: {
    type: String,
    required: true,
  },
  emptyMessage: {
    type: String,
    required: true,
  },
  buildRowActions: {
    type: Function as PropType<(item: EmployeeContractFormRecord) => RowAction[]>,
    required: true,
  },
  sortIndicator: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'sort', value: string): void
}>()

function rowNumber(index: number) {
  return (props.page - 1) * props.pageSize + index + 1
}
</script>
