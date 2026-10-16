<template>
  <div>
    <div class="overflow-x-auto">
      <table class="app-approval-tracking-table w-full min-w-[1380px] border-separate border-spacing-0 text-left text-sm">
        <thead class="app-dashboard-table-head">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="app-approval-tracking-head-cell border-b border-slate-200 whitespace-nowrap"
              :class="column.class"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="inline-flex items-center gap-2 transition hover:text-slate-800"
                @click="$emit('sort', getColumnSortKey(column))"
              >
                <span>{{ column.label }}</span>
                <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator(getColumnSortKey(column)) }}</span>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="!loading && chains.length > 0">
            <ApprovalTrackingRow
              v-for="(chain, idx) in chains"
              :key="chain.id"
              :chain="chain"
              :row-number="getRowNumber(idx)"
              :no-position-label="noPositionLabel"
              :requested-at="getRequestedAt(chain)"
              :status-class="statusClassForChain(chain)"
              :status-label="trackingStatusLabel(chain)"
              :stages="visibleTrackingStages(chain)"
              :is-expanded="isTrackingExpanded(chain.id)"
              :can-toggle="canToggleTrackingCollapse(chain)"
              :can-open-stage="canOpenTrackingStage"
              :stage-border-class="trackingStageBorderClass"
              :stage-indicator-class="trackingStageIndicatorClass"
              :stage-badge-class="trackingStageBadgeClass"
              :stage-status-label="trackingStageStatusLabel"
              :format-date-time-display="formatDateTimeDisplay"
              @row-click="$emit('rowClick', $event)"
              @stage-click="$emit('stageClick', chain, $event)"
            />
          </template>
          <tr v-if="loading">
            <td :colspan="columns.length" class="px-6 py-20 text-center">
              <div class="app-table-muted flex flex-col items-center justify-center gap-3">
                <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p class="text-xs font-medium">
                  {{ loadingLabel }}
                </p>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filteredCount === 0">
            <td :colspan="columns.length" class="px-6 py-10">
              <div class="app-dashboard-empty">
                {{ emptyLabel }}
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filteredCount > 0">
            <td :colspan="columns.length" class="p-0">
              <div class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-sm text-slate-500">
                  <strong class="font-semibold text-slate-800">{{ pageStart }}</strong>
                  -
                  <strong class="font-semibold text-slate-800">{{ pageEnd }}</strong>
                  /
                  <strong class="font-semibold text-slate-800">{{ filteredCount }}</strong>
                </div>

                <TablePagination
                  :page="page"
                  :page-size="pageSize"
                  :total-items="filteredCount"
                  @update:page="$emit('update:page', $event)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { ApprovalChain } from '@/domain/entities/ApprovalChain'
import ApprovalTrackingRow from '@/features/approvals/components/ApprovalTrackingRow.vue'
import type {
  ApprovalTrackingColumn,
  ApprovalTrackingSortKey,
  TrackingStage,
  TrackingStageState,
} from '@/features/approvals/types/ApprovalTrackingPage.type'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  chains: {
    type: Array as PropType<ApprovalChain[]>,
    default: () => [],
  },
  filteredCount: {
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
  columns: {
    type: Array as PropType<ApprovalTrackingColumn[]>,
    required: true,
  },
  emptyLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
  noPositionLabel: {
    type: String,
    required: true,
  },
  formatDateTimeDisplay: {
    type: Function as PropType<(date: string | null | undefined) => string>,
    required: true,
  },
  getRequestedAt: {
    type: Function as PropType<(chain: ApprovalChain) => string | null>,
    required: true,
  },
  statusClassForChain: {
    type: Function as PropType<(chain: ApprovalChain) => string>,
    required: true,
  },
  trackingStatusLabel: {
    type: Function as PropType<(chain: ApprovalChain) => string>,
    required: true,
  },
  canToggleTrackingCollapse: {
    type: Function as PropType<(chain: ApprovalChain) => boolean>,
    required: true,
  },
  isTrackingExpanded: {
    type: Function as PropType<(chainId: string) => boolean>,
    required: true,
  },
  visibleTrackingStages: {
    type: Function as PropType<(chain: ApprovalChain) => TrackingStage[]>,
    required: true,
  },
  canOpenTrackingStage: {
    type: Function as PropType<(chain: ApprovalChain, stage: TrackingStage) => boolean>,
    required: true,
  },
  trackingStageBorderClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  trackingStageIndicatorClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  trackingStageBadgeClass: {
    type: Function as PropType<(state: TrackingStageState) => string>,
    required: true,
  },
  trackingStageStatusLabel: {
    type: Function as PropType<(stage: TrackingStage, chain: ApprovalChain) => string>,
    required: true,
  },
  sortIndicator: {
    type: Function as PropType<(key: ApprovalTrackingSortKey) => string>,
    required: true,
  },
})

defineEmits<{
  (event: 'update:page', value: number): void
  (event: 'rowClick', value: ApprovalChain): void
  (event: 'stageClick', chain: ApprovalChain, stage: TrackingStage): void
  (event: 'sort', value: ApprovalTrackingSortKey): void
}>()

const pageStart = computed(() => {
  if (props.filteredCount === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const pageEnd = computed(() => {
  if (props.filteredCount === 0) return 0
  return Math.min(props.page * props.pageSize, props.filteredCount)
})

function getColumnSortKey(column: ApprovalTrackingColumn): ApprovalTrackingSortKey {
  return column.sortableKey ?? (column.key as ApprovalTrackingSortKey)
}

function getRowNumber(index: number) {
  return (props.page - 1) * props.pageSize + index + 1
}
</script>

<style scoped>
.app-approval-tracking-table {
  color: #475569;
  font-size: 0.92rem;
}

.app-approval-tracking-head-cell {
  padding: 0.75rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #94a3b8;
  text-transform: uppercase;
}
</style>
