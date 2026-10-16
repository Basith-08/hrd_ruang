<template>
  <tr
    class="app-table-row transition hover:bg-sky-50/40"
    :class="canToggle ? 'cursor-pointer' : ''"
    @click="$emit('rowClick', chain)"
  >
    <td class="app-table-muted border-b border-slate-200 px-4 py-4 align-top whitespace-nowrap">
      {{ rowNumber }}
    </td>
    <td class="border-b border-slate-200 px-4 py-4 align-top whitespace-nowrap">
      <p class="app-copy-strong text-base">
        {{ chain.employee_request_form?.main_position || noPositionLabel }}
      </p>
    </td>
    <td class="border-b border-slate-200 px-4 py-4 align-top whitespace-nowrap">
      <p>{{ chain.employee_request_form?.site || '-' }}</p>
    </td>
    <td class="border-b border-slate-200 px-4 py-4 align-top whitespace-nowrap text-slate-600">
      <p>{{ formatDateTimeDisplay(requestedAt) }}</p>
    </td>
    <td class="border-b border-slate-200 px-4 py-4 align-top whitespace-nowrap">
      <span
        class="app-status-chip app-approval-tracking-status-chip"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </td>
    <td class="border-b border-slate-200 px-4 py-4 align-top">
      <ApprovalTrackingStageList
        :chain="chain"
        :stages="stages"
        :is-expanded="isExpanded"
        :can-toggle="canToggle"
        :can-open-stage="canOpenStage"
        :border-class="stageBorderClass"
        :indicator-class="stageIndicatorClass"
        :badge-class="stageBadgeClass"
        :status-label="stageStatusLabel"
        :format-date-time-display="formatDateTimeDisplay"
        @stage-click="$emit('stageClick', $event)"
      />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { ApprovalChain } from '@/domain/entities/ApprovalChain'
import ApprovalTrackingStageList from '@/features/approvals/components/ApprovalTrackingStageList.vue'
import type { TrackingStage, TrackingStageState } from '@/features/approvals/types/ApprovalTrackingPage.type'

defineProps({
  chain: {
    type: Object as PropType<ApprovalChain>,
    required: true,
  },
  rowNumber: {
    type: Number,
    required: true,
  },
  noPositionLabel: {
    type: String,
    required: true,
  },
  requestedAt: {
    type: String as PropType<string | null>,
    default: null,
  },
  statusClass: {
    type: String,
    required: true,
  },
  statusLabel: {
    type: String,
    required: true,
  },
  stages: {
    type: Array as PropType<TrackingStage[]>,
    default: () => [],
  },
  isExpanded: {
    type: Boolean,
    required: true,
  },
  canToggle: {
    type: Boolean,
    required: true,
  },
  canOpenStage: {
    type: Function as PropType<(chain: ApprovalChain, stage: TrackingStage) => boolean>,
    required: true,
  },
  stageBorderClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  stageIndicatorClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  stageBadgeClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  stageStatusLabel: {
    type: Function as PropType<(stage: TrackingStage, chain: ApprovalChain) => string>,
    required: true,
  },
  formatDateTimeDisplay: {
    type: Function as PropType<(date: string | null | undefined) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'rowClick', value: ApprovalChain): void
  (event: 'stageClick', value: TrackingStage): void
}>()
</script>

<style scoped>
.app-approval-tracking-status-chip {
  padding: 0.45rem 0.9rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}
</style>
