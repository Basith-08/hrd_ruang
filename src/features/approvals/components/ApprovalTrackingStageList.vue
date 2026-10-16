<template>
  <div class="space-y-2">
    <div v-if="canToggle" class="app-table-muted flex items-center justify-end text-[10px]">
      <component :is="isExpanded ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
    </div>
    <component
      :is="canOpenStage(chain, stage) ? 'button' : 'div'"
      v-for="stage in stages"
      :key="stage.key"
      class="app-state-card flex w-full items-center gap-3 px-3 py-2 text-left text-xs"
      :class="[
        borderClass(stage.state),
        canOpenStage(chain, stage)
          ? 'cursor-pointer transition hover:shadow-sm'
          : '',
      ]"
      :disabled="!canOpenStage(chain, stage)"
      @click.stop="$emit('stageClick', stage)"
    >
      <div
        class="app-stage-indicator flex h-6 w-6 shrink-0 text-[10px]"
        :class="indicatorClass(stage.state)"
      >
        <template v-if="stage.state === 'completed'">✓</template>
        <template v-else-if="stage.state === 'rejected'">✕</template>
        <template v-else>{{ stage.order }}</template>
      </div>
      <div class="min-w-0 flex-1">
        <p class="app-copy-strong font-medium">
          {{ stage.label }}
        </p>
        <p v-if="stage.actor" class="app-copy-body mt-0.5">{{ stage.actor }}</p>
        <p v-if="stage.note" class="app-helper-text mt-1 text-[11px]">{{ stage.note }}</p>
      </div>
      <div class="shrink-0 text-right">
        <span
          class="app-status-chip px-2 py-0.5 text-[10px]"
          :class="badgeClass(stage.state)"
        >
          {{ statusLabel(stage, chain) }}
        </span>
        <p v-if="stage.date" class="app-table-muted mt-0.5 text-[10px]">
          {{ formatDateTimeDisplay(stage.date) }}
        </p>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

import type { ApprovalChain } from '@/domain/entities/ApprovalChain'
import type { TrackingStage, TrackingStageState } from '@/features/approvals/types/ApprovalTrackingPage.type'

defineProps({
  chain: {
    type: Object as PropType<ApprovalChain>,
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
  borderClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  indicatorClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  badgeClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  statusLabel: {
    type: Function as PropType<(stage: TrackingStage, chain: ApprovalChain) => string>,
    required: true,
  },
  formatDateTimeDisplay: {
    type: Function as PropType<(date: string | null | undefined) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'stageClick', value: TrackingStage): void
}>()
</script>
