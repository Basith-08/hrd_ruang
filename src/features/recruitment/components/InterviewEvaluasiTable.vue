<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1240px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="min-w-[56px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ numberLabel }}
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'applied_position')">
              <span>{{ mainPositionLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('applied_position') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'candidate_name')">
              <span>{{ candidateNameLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('candidate_name') }}</span>
            </button>
          </th>
          <th class="min-w-[240px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'interviewer_display')">
              <span>{{ interviewerLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('interviewer_display') }}</span>
            </button>
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'flow_status')">
              <span>{{ flowStatusLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('flow_status') }}</span>
            </button>
          </th>
          <th class="min-w-[140px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'score')">
              <span>{{ scoreLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('score') }}</span>
            </button>
          </th>
          <th class="min-w-[300px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'comments')">
              <span>{{ remarksLabel }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('comments') }}</span>
            </button>
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
              <span class="app-copy-strong">{{ fallback(item.applied_position) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(item.candidate_name) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(item.interviewer_display) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span
                class="app-status-chip"
                :class="recruitmentFlowStageBadgeClass(resolveFlowStage(item))"
              >
                {{ recruitmentFlowStageLabel(resolveFlowStage(item)) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-status-chip app-status-chip-accent">
                {{ formatAverageScore(item) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle">
              <p class="text-slate-600">
                {{ fallback(item.comments) }}
              </p>
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
import type { PropType } from 'vue'

import type { RecruitmentFlowStage } from '@/domain/entities/EmployeeRequestForm'
import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

type InterviewEvaluasiRow = InterviewEvaluation & {
  evaluation_id: string
  interviewer_display: string
}

const props = defineProps({
  items: {
    type: Array as PropType<InterviewEvaluasiRow[]>,
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
  numberLabel: {
    type: String,
    required: true,
  },
  mainPositionLabel: {
    type: String,
    required: true,
  },
  candidateNameLabel: {
    type: String,
    required: true,
  },
  interviewerLabel: {
    type: String,
    required: true,
  },
  flowStatusLabel: {
    type: String,
    required: true,
  },
  scoreLabel: {
    type: String,
    required: true,
  },
  remarksLabel: {
    type: String,
    required: true,
  },
  emptyMessage: {
    type: String,
    required: true,
  },
  rowNumber: {
    type: Function as PropType<(index: number) => number>,
    required: true,
  },
  resolveFlowStage: {
    type: Function as PropType<(item: InterviewEvaluation) => RecruitmentFlowStage | null>,
    required: true,
  },
  recruitmentFlowStageBadgeClass: {
    type: Function as PropType<(stage: RecruitmentFlowStage | null) => string>,
    required: true,
  },
  recruitmentFlowStageLabel: {
    type: Function as PropType<(stage: RecruitmentFlowStage | null) => string>,
    required: true,
  },
  formatAverageScore: {
    type: Function as PropType<(item: InterviewEvaluation) => string>,
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
</script>
