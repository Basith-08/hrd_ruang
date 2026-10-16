<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="min-w-[56px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            No
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ candidateLabel }}
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ positionLabel }}
          </th>
          <th
            v-if="showInterviewerColumn"
            class="min-w-[240px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap"
          >
            {{ interviewerLabel }}
          </th>
          <th class="min-w-[170px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ interviewDateLabel }}
          </th>
          <th class="min-w-[220px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ flowStatusLabel }}
          </th>
          <th class="min-w-[160px] border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
            {{ assessmentStatusLabel }}
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
              <p class="app-copy-strong">{{ item.candidate_name || '-' }}</p>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ item.applied_position || '-' }}
            </td>
            <td
              v-if="showInterviewerColumn"
              class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap"
            >
              {{ item.interviewer_display || '-' }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ formatDateDisplay(item.interview_date) }}
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
              <span
                class="app-status-chip"
                :class="isCompletedEvaluation(item) ? 'app-status-chip-success' : 'app-status-chip-warning'"
              >
                {{ isCompletedEvaluation(item) ? completedLabel : pendingLabel }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <AppActionButton
                v-if="canOpenAssignment"
                variant="secondary"
                :label="actionLabel"
                @click="openAssignment(item)"
              />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td :colspan="showInterviewerColumn ? 8 : 7" class="px-6 py-20 text-center">
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
          <td :colspan="showInterviewerColumn ? 8 : 7" class="px-6 py-10">
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

import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'
import type { RecruitmentFlowStage } from '@/domain/entities/EmployeeRequestForm'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

type InterviewerAssignmentRow = InterviewEvaluation & {
  evaluation_id: string
  interviewer_display: string
  interviewer_result_id?: string
  interviewer_user_id?: string
  interviewer_email?: string | null
  interviewer_label?: string
}

const props = defineProps({
  items: {
    type: Array as PropType<InterviewerAssignmentRow[]>,
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
  showInterviewerColumn: {
    type: Boolean,
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
  flowStatusLabel: {
    type: String,
    required: true,
  },
  assessmentStatusLabel: {
    type: String,
    required: true,
  },
  actionsLabel: {
    type: String,
    required: true,
  },
  pendingLabel: {
    type: String,
    required: true,
  },
  completedLabel: {
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
  isCompletedEvaluation: {
    type: Function as PropType<(item: InterviewEvaluation) => boolean>,
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
  formatDateDisplay: {
    type: Function as PropType<(value: string | null | undefined) => string>,
    required: true,
  },
  actionLabel: {
    type: String,
    required: true,
  },
  canOpenAssignment: {
    type: Boolean,
    required: true,
  },
  openAssignment: {
    type: Function as PropType<(item: InterviewEvaluation) => void | Promise<void>>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:page', value: number): void
}>()
</script>
