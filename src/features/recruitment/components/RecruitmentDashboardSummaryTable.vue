<template>
  <section class="app-dashboard-panel">
    <div class="app-dashboard-panel-header">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p class="app-dashboard-eyebrow">
            {{ eyebrow }}
          </p>
          <h2 class="app-dashboard-title">
            {{ title }}
          </h2>
          <p class="app-dashboard-copy max-w-3xl">
            {{ description }}
          </p>
        </div>

        <label class="block xl:w-full xl:max-w-[320px]">
          <span class="app-fieldset-label mb-1.5 block">
            {{ searchLabel }}
          </span>
          <AppSearchInput
            :model-value="searchQuery"
            :placeholder="searchPlaceholder"
            @update:model-value="$emit('update:searchQuery', $event)"
          />
        </label>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
        <thead class="app-dashboard-table-head">
          <tr>
            <th class="sticky left-0 z-10 min-w-[220px] border-b border-r border-slate-200 bg-slate-50/90 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap">
              {{ departmentLabel }}
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              class="min-w-[120px] border-b border-r border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap last:border-r-0"
            >
              {{ column.label }}
            </th>
            <th class="min-w-[110px] border-b border-slate-200 bg-sky-50 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 whitespace-nowrap">
              {{ totalLabel }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.department" class="transition hover:bg-sky-50/35">
            <td class="sticky left-0 border-b border-r border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
              {{ row.department }}
            </td>
            <td
              v-for="column in columns"
              :key="`${row.department}-${column.key}`"
              class="border-b border-r border-slate-200 px-4 py-3 text-center whitespace-nowrap last:border-r-0"
            >
              <span
                class="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold"
                :class="(row.counts[column.key] ?? 0) > 0 ? 'bg-sky-50 text-sky-700' : 'text-slate-400'"
              >
                {{ row.counts[column.key] ?? 0 }}
              </span>
            </td>
            <td class="border-b border-slate-200 bg-sky-50/60 px-4 py-3 text-center text-sm font-semibold text-blue-700 whitespace-nowrap">
              {{ rowTotal(row) }}
            </td>
          </tr>

          <tr v-if="!loading && rows.length === 0">
            <td :colspan="columns.length + 2" class="px-6 py-10">
              <div class="app-dashboard-empty">
                {{ emptyLabel }}
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot v-if="rows.length > 0" class="app-dashboard-table-head text-sm font-semibold">
          <tr>
            <th class="sticky left-0 z-10 border-r border-slate-200 bg-slate-50/90 px-4 py-3 text-left whitespace-nowrap text-slate-900">
              {{ totalLabel }}
            </th>
            <th
              v-for="column in columns"
              :key="`total-${column.key}`"
              class="border-r border-slate-200 px-4 py-3 text-center whitespace-nowrap text-slate-900 last:border-r-0"
            >
              {{ totals[column.key] }}
            </th>
            <th class="bg-sky-100 px-4 py-3 text-center text-base font-semibold text-blue-700 whitespace-nowrap">
              {{ grandTotal }}
            </th>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-if="rows.length > 0" class="overflow-x-auto border-t border-slate-200 px-5 py-5">
      <div class="grid min-w-[1120px] gap-3" :style="summaryStripStyle">
        <div v-for="column in columns" :key="`visual-${column.key}`" class="space-y-2 rounded-md border border-slate-200 bg-slate-50/80 px-4 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {{ column.label }}
          </p>
          <div class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ totals[column.key] ?? 0 }}
          </div>
          <div class="h-1.5 rounded-full bg-slate-200">
            <div
              class="h-1.5 rounded-full bg-[linear-gradient(90deg,#12205e_0%,#4a9fd4_100%)]"
              :style="{ width: `${sharePercentage(totals[column.key] ?? 0)}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { SummaryColumn } from '@/features/recruitment/types/RecruitmentDashboardPage.type'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'

defineEmits<{
  (event: 'update:searchQuery', value: string): void
}>()

const {
  eyebrow,
  title,
  description,
  searchLabel,
  searchPlaceholder,
  searchQuery,
  departmentLabel,
  totalLabel,
  emptyLabel,
  loading,
  columns,
  rows,
  totals,
} = defineProps<{
  eyebrow: string
  title: string
  description: string
  searchLabel: string
  searchPlaceholder: string
  searchQuery: string
  departmentLabel: string
  totalLabel: string
  emptyLabel: string
  loading: boolean
  columns: SummaryColumn[]
  rows: Array<{
    department: string
    counts: Record<string, number>
  }>
  totals: Record<string, number>
}>()

const grandTotal = computed(() =>
  columns.reduce((sum, column) => sum + (totals[column.key] ?? 0), 0),
)

const summaryStripStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.min(columns.length, 6)}, minmax(0, 1fr))`,
}))

function rowTotal(row: { counts: Record<string, number> }) {
  return columns.reduce((sum, column) => sum + (row.counts[column.key] ?? 0), 0)
}

function sharePercentage(value: number) {
  if (grandTotal.value === 0) {
    return 0
  }

  return Math.round((value / grandTotal.value) * 100)
}
</script>
