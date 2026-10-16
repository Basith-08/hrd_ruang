<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[1480px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[56px]">
            {{ text('common.labels.no') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'name')">
              <span>{{ text('common.labels.name') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('name') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[120px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'role')">
              <span>Role</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('role') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'personal_email')">
              <span>{{ text('common.labels.email') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('personal_email') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'phone_number')">
              <span>{{ text('common.labels.phone') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('phone_number') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'employee_request_form')">
              <span>{{ text('common.labels.employeeRequestForm') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('employee_request_form') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'completion_status')">
              <span>{{ text('common.labels.formStatus') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('completion_status') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            {{ text('common.labels.actions') }}
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && items.length > 0">
          <tr
            v-for="(candidate, index) in items"
            :key="candidate.id || index"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 align-middle whitespace-nowrap">
              {{ pageOffset + index + 1 }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ candidateName(candidate) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span :class="roleBadge(candidate)">
                {{ roleLabel(candidate) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(candidate.personal_email) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(candidate.phone_number) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-badge-accent-soft">
                {{ candidate.employee_request_form?.main_position || text('common.empty.noEmployeeRequestForm') }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span :class="statusBadge(candidate.completion_status)">
                {{ statusLabel(candidate.completion_status) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
              <RowActionsMenu :actions="getRowActions(candidate)" />
            </td>
          </tr>
        </template>

        <tr v-else-if="loading">
          <td colspan="8" class="px-6 py-20 text-center">
            <div class="app-table-muted flex flex-col items-center justify-center gap-3">
              <svg class="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p class="text-xs font-medium">
                {{ text('common.loading') }}
              </p>
            </div>
          </td>
        </tr>

        <tr v-else>
          <td colspan="8" class="px-6 py-10">
            <div class="app-dashboard-empty">
              {{ text('common.noMatchingData') }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
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
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { CandidateForm } from '@/domain/entities/CandidateForm'
import type { RowAction } from '@/presentation/components/menus/RowActionsMenu.vue'
import RowActionsMenu from '@/presentation/components/menus/RowActionsMenu.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  items: {
    type: Array as PropType<CandidateForm[]>,
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
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
  roleLabel: {
    type: Function as PropType<(candidate: CandidateForm) => string>,
    required: true,
  },
  roleBadge: {
    type: Function as PropType<(candidate: CandidateForm) => string>,
    required: true,
  },
  statusLabel: {
    type: Function as PropType<(status: string | null | undefined) => string>,
    required: true,
  },
  statusBadge: {
    type: Function as PropType<(status: string | null | undefined) => string>,
    required: true,
  },
  getRowActions: {
    type: Function as PropType<(candidate: CandidateForm) => RowAction[]>,
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

const pageOffset = computed(() => (props.page - 1) * props.pageSize)
const pageStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})
const pageEnd = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min(props.page * props.pageSize, props.totalItems)
})

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

function candidateName(candidate: CandidateForm) {
  return (
    candidate.full_name
    || [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ')
    || '-'
  )
}
</script>
