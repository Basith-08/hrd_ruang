<template>
  <div class="hidden overflow-x-auto lg:block">
    <table class="w-full min-w-[1460px] border-separate border-spacing-0 text-left text-sm">
      <thead class="app-dashboard-table-head">
        <tr>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[56px]">
            {{ text('common.labels.no') }}
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'department')">
              <span>{{ text('common.labels.department') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('department') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'business_unit')">
              <span>{{ text('common.labels.businessUnit') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('business_unit') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'main_position')">
              <span>{{ text('common.labels.mainPosition') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('main_position') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'recruiter_name')">
              <span>{{ text('common.labels.recruiter') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('recruiter_name') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'position_status')">
              <span>{{ text('common.labels.positionStatus') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('position_status') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'employment_status')">
              <span>{{ text('common.labels.employmentStatus') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('employment_status') }}</span>
            </button>
          </th>
          <th class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
            <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
              @click="$emit('sort', 'status')">
              <span>{{ text('common.labels.status') }}</span>
              <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('status') }}</span>
            </button>
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-if="!loading && items.length > 0">
          <tr
            v-for="(job, index) in items"
            :key="job.id || index"
            class="transition hover:bg-sky-50/40"
          >
            <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 align-middle whitespace-nowrap">
              {{ pageOffset + index + 1 }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ fallback(job.department) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(job.business_unit) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-copy-strong">{{ fallback(job.main_position) }}</span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(job.recruiter_name) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="app-status-chip" :class="positionStatusBadgeClass(job.position_status)">
                {{ fallback(job.position_status) }}
              </span>
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              {{ fallback(job.employment_status) }}
            </td>
            <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" :class="stageBadgeClass(job)">
                {{ stageLabel(job) }}
              </span>
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
              {{ text('picRecruitment.page.empty') }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="app-dashboard-mobile-stack lg:hidden">
    <article
      v-for="(job, index) in items"
      :key="job.id || index"
      class="app-candidate-card"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="app-table-muted text-xs font-medium">#{{ pageOffset + index + 1 }}</span>
            <span class="app-status-chip" :class="positionStatusBadgeClass(job.position_status)">
              {{ fallback(job.position_status) }}
            </span>
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" :class="stageBadgeClass(job)">
              {{ stageLabel(job) }}
            </span>
          </div>
          <h2 class="app-card-title mt-2 truncate text-base">
            {{ fallback(job.main_position) }}
          </h2>
          <p class="app-copy-body app-copy-strong mt-1 truncate">
            {{ fallback(job.department) }}
          </p>
          <p class="app-table-muted mt-1 truncate text-xs">
            {{ fallback(job.business_unit) }} • {{ fallback(job.recruiter_name) }}
          </p>
        </div>
      </div>

      <dl class="mt-4 grid gap-3 border-t app-table-divider pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt class="app-label-compact">{{ text('common.labels.employmentStatus') }}</dt>
          <dd class="app-copy-body mt-1">{{ fallback(job.employment_status) }}</dd>
        </div>
        <div>
          <dt class="app-label-compact">{{ text('common.labels.status') }}</dt>
          <dd class="app-copy-body mt-1">{{ stageLabel(job) }}</dd>
        </div>
      </dl>
    </article>

    <div v-if="!loading && items.length === 0" class="app-dashboard-empty">
      {{ text('picRecruitment.page.empty') }}
    </div>
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

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'

const props = defineProps({
  items: {
    type: Array as PropType<EmployeeRequestForm[]>,
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
  stageLabel: {
    type: Function as PropType<(job: EmployeeRequestForm) => string>,
    required: true,
  },
  stageBadgeClass: {
    type: Function as PropType<(job: EmployeeRequestForm) => string>,
    required: true,
  },
  positionStatusBadgeClass: {
    type: Function as PropType<(value: unknown) => string>,
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
</script>
