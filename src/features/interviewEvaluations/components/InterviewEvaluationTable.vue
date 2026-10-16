<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1260px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="min-w-[56px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            No
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'candidate_name')">
              <span>{{ candidateLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('candidate_name') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'applied_position')">
              <span>{{ positionLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('applied_position') }}</span>
            </button>
          </th>
          <th class="min-w-[300px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'interviewer')">
              <span>{{ interviewerLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('interviewer') }}</span>
            </button>
          </th>
          <th class="min-w-[170px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'interview_date')">
              <span>{{ interviewDateLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('interview_date') }}</span>
            </button>
          </th>
          <th class="min-w-[120px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'average_score')">
              <span>{{ averageLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('average_score') }}</span>
            </button>
          </th>
          <th class="min-w-[160px] border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ actionsLabel }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && evaluations.length > 0">
          <tr
            v-for="(evaluation, index) in evaluations"
            :key="evaluation.id || index"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 align-middle text-slate-400 whitespace-nowrap">
              {{ rowNumber(index) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <p class="app-copy-strong">
                {{ evaluation.candidate_name || '-' }}
              </p>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ evaluation.applied_position || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle">
              <p class="whitespace-pre-line leading-6 text-slate-600">
                {{ formatInterviewerDisplay(evaluation) }}
              </p>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ formatDate(evaluation.interview_date) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-status-chip app-status-chip-accent">
                {{ formatAverageScore(evaluation) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <RowActionsMenu :actions="buildRowActions(evaluation)" />
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
              {{ emptyLabel }}
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
import type { PropType } from 'vue'

import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'
import RowActionsMenu, { type RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  evaluations: {
    type: Array as PropType<InterviewEvaluation[]>,
    default: () => [],
  },
  totalItems: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  page: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  emptyLabel: {
    type: String,
    required: true,
  },
  candidateLabel: {
    type: String,
    required: true,
  },
  positionLabel: {
    type: String,
    required: true,
  },
  interviewerLabel: {
    type: String,
    required: true,
  },
  interviewDateLabel: {
    type: String,
    required: true,
  },
  averageLabel: {
    type: String,
    required: true,
  },
  actionsLabel: {
    type: String,
    required: true,
  },
  formatDate: {
    type: Function as PropType<(value: string | null) => string>,
    required: true,
  },
  formatInterviewerDisplay: {
    type: Function as PropType<(evaluation: InterviewEvaluation) => string>,
    required: true,
  },
  formatAverageScore: {
    type: Function as PropType<(evaluation: InterviewEvaluation) => string>,
    required: true,
  },
  buildRowActions: {
    type: Function as PropType<(evaluation: InterviewEvaluation) => RowAction[]>,
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
