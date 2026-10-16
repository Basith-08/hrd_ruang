<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="min-w-[56px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            No
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'main_position')">
              <span>{{ mainPositionLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('main_position') }}</span>
            </button>
          </th>
          <th class="min-w-[180px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'business_unit')">
              <span>{{ businessUnitLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('business_unit') }}</span>
            </button>
          </th>
          <th class="min-w-[180px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'department')">
              <span>{{ departmentLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('department') }}</span>
            </button>
          </th>
          <th class="min-w-[140px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'required_date')">
              <span>{{ requiredDateLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('required_date') }}</span>
            </button>
          </th>
          <th class="min-w-[160px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'status')">
              <span>{{ statusLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('status') }}</span>
            </button>
          </th>
          <th class="min-w-[140px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'vacancy_candidate_count')">
              <span>{{ totalCandidateLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('vacancy_candidate_count') }}</span>
            </button>
          </th>
          <th class="min-w-[160px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'vacancy_interview_scheduled_count')">
              <span>{{ interviewScheduledLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('vacancy_interview_scheduled_count') }}</span>
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
              <span class="app-copy-strong">{{ fallback(item.main_position) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ fallback(item.business_unit) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ fallback(item.department) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ formatDateDisplay(item.approval_director_hrd_date) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span
                class="app-status-chip"
                :class="vacancyFlowStatusBadgeClass(item)"
              >
                {{ vacancyFlowStatusLabel(item) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ Number(item.vacancy_candidate_count ?? 0) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ Number(item.vacancy_interview_scheduled_count ?? 0) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <AppActionButton
                v-if="canOpenDetailModal"
                variant="secondary"
                :label="detailLabel"
                :loading="loadingDetailJobId === item.id"
                :loading-label="loadingLabel"
                @click="openDetailModal(item)"
              />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td :colspan="tableColumnCount" class="px-6 py-20 text-center">
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
                {{ loadingLabel }}
              </p>
            </div>
          </td>
        </tr>

        <tr v-else>
          <td :colspan="tableColumnCount" class="px-6 py-10">
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
import { computed } from 'vue'
import type { PropType } from 'vue'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  items: {
    type: Array as PropType<EmployeeRequestForm[]>,
    default: () => [],
  },
  statusMode: {
    type: String as PropType<'active' | 'closed'>,
    default: 'active',
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
  businessUnitLabel: {
    type: String,
    required: true,
  },
  mainPositionLabel: {
    type: String,
    required: true,
  },
  requiredDateLabel: {
    type: String,
    required: true,
  },
  statusLabel: {
    type: String,
    required: true,
  },
  totalCandidateLabel: {
    type: String,
    required: true,
  },
  interviewScheduledLabel: {
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
  detailLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
  loadingDetailJobId: {
    type: String,
    required: true,
  },
  canOpenDetailModal: {
    type: Boolean,
    required: true,
  },
  openDetailModal: {
    type: Function as PropType<(item: EmployeeRequestForm) => void | Promise<void>>,
    required: true,
  },
  rowNumber: {
    type: Function as PropType<(index: number) => number>,
    required: true,
  },
  vacancyFlowStatusBadgeClass: {
    type: Function as PropType<(item: EmployeeRequestForm) => string>,
    required: true,
  },
  vacancyFlowStatusLabel: {
    type: Function as PropType<(item: EmployeeRequestForm) => string>,
    required: true,
  },
  formatDateDisplay: {
    type: Function as PropType<(value: string | null | undefined) => string>,
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

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

const tableColumnCount = computed(() => 9)
</script>
