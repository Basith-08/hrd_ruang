<template>
  <section class="space-y-3">
    <div class="grid gap-3 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)]">
      <article class="relative overflow-hidden rounded-[0.875rem] bg-[linear-gradient(145deg,#20357c_0%,#2d4cb2_55%,#2e63df_100%)] px-5 py-5 text-white shadow-[0_24px_42px_-34px_rgba(15,23,42,0.75)] xl:min-h-[248px]">
        <div class="absolute right-[-1.25rem] top-4 h-32 w-32 rounded-full bg-white/6" />
        <div class="absolute bottom-[-1.5rem] right-6 h-24 w-24 rounded-full bg-sky-200/10" />

        <div class="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
              {{ summaryTitle }}
            </p>
            <p class="mt-4 text-[3rem] leading-none font-semibold tracking-[-0.05em]">
              {{ totalCount }}
            </p>
            <p class="mt-3 max-w-lg text-sm leading-6 text-white/62">
              {{ summaryDescription }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div class="rounded-md bg-white/9 px-4 py-3 backdrop-blur-sm xl:min-h-[76px]">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {{ currentMonthLabel }}
              </p>
              <p class="mt-2 text-[1.65rem] leading-none font-semibold">
                {{ currentMonthCount }}
              </p>
            </div>
            <div class="rounded-md bg-white/9 px-4 py-3 backdrop-blur-sm xl:min-h-[76px]">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {{ averageAgeLabel }}
              </p>
              <p class="mt-2 text-[1.65rem] leading-none font-semibold">
                {{ averageAgeDays === null ? '-' : averageAgeDays }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div class="mt-5 rounded-md bg-white/9 px-4 py-4 backdrop-blur-sm">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {{ recruiterOwnershipTitle }}
            </p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <div
                v-for="item in recruiterOwnershipItems"
                :key="`recruiter-ownership-${item.label}`"
                class="flex items-center justify-between rounded-md bg-white/8 px-3 py-2 text-sm"
              >
                <span class="truncate pr-3 text-white/72">{{ item.label }}</span>
                <strong class="shrink-0 font-semibold text-white">{{ item.count }}</strong>
              </div>
              <div
                v-if="recruiterOwnershipItems.length === 0"
                class="rounded-md bg-white/8 px-3 py-2 text-sm text-white/62 sm:col-span-2"
              >
                -
              </div>
            </div>
          </div>
        </div>
      </article>

      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="item in breakdownCards"
          :key="item.label"
          class="min-h-[156px] rounded-[0.8rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_34px_-28px_rgba(15,23,42,0.52)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ item.label }}
              </p>
              <p class="mt-5 text-[2.35rem] leading-none font-semibold tracking-[-0.04em] text-[#1d2f6f]">
                {{ item.count }}
              </p>
            </div>
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg" :class="item.iconClass">
              <span class="h-3 w-3 rounded-full bg-current" />
            </span>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <div class="h-2 flex-1 rounded-full bg-slate-100">
              <div class="h-2 rounded-full" :class="item.barClass" :style="{ width: `${item.percentage}%` }" />
            </div>
            <span class="text-xs text-slate-400">{{ item.percentage }}%</span>
          </div>
        </article>
      </div>
    </div>

    <article class="app-dashboard-card">
      <div class="app-dashboard-panel-header flex items-start justify-between gap-4">
        <div>
          <p class="app-dashboard-eyebrow">
            {{ trendEyebrow }}
          </p>
          <h3 class="mt-1 text-[1.05rem] font-semibold text-[#1d2f6f]">
            {{ trendTitle }}
          </h3>
          <p class="app-dashboard-copy mt-1">
            {{ trendDescription }}
          </p>
        </div>

        <div class="app-dashboard-segmented text-sm">
          <button
            type="button"
            class="app-dashboard-segmented-button px-3 py-1.5"
            :class="trendWindow === 6 ? 'app-dashboard-segmented-button-active' : ''"
            @click="trendWindow = 6"
          >
            6M
          </button>
          <button
            type="button"
            class="app-dashboard-segmented-button px-3 py-1.5"
            :class="trendWindow === 3 ? 'app-dashboard-segmented-button-active' : ''"
            @click="trendWindow = 3"
          >
            3M
          </button>
        </div>
      </div>

      <div class="px-5 py-5">
        <svg viewBox="0 0 900 280" class="h-[320px] w-full">
          <g>
            <line
              v-for="tick in yTicks"
              :key="`trend-grid-${tick}`"
              x1="24"
              :x2="876"
              :y1="chartY(tick)"
              :y2="chartY(tick)"
              stroke="#dbe6f3"
              stroke-dasharray="4 6"
            />
          </g>

          <g v-for="(point, index) in visibleTrendPoints" :key="`trend-point-${point.label}`">
            <g
              v-for="(series, seriesIndex) in trendSeries"
              :key="`${point.label}-${series.key}`"
            >
              <rect
                :x="barX(index, seriesIndex)"
                :y="chartY(point[series.key])"
                :width="barWidth"
                :height="chartFloorY - chartY(point[series.key])"
                rx="4"
                :fill="series.color"
              />
              <text
                v-if="point[series.key] > 0"
                :x="barX(index, seriesIndex) + barWidth / 2"
                :y="barValueY(point[series.key])"
                text-anchor="middle"
                font-size="11"
                font-weight="700"
                :fill="series.textColor"
            >
                {{ point[series.key] }}
              </text>
            </g>
            <text :x="bucketCenterX(index)" y="260" text-anchor="middle" font-size="14" fill="#94a3b8">{{ point.label }}</text>
          </g>
        </svg>

        <div class="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <div
            v-for="series in trendSeries"
            :key="`legend-${series.key}`"
            class="flex items-center gap-2"
          >
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: series.color }" />
            {{ series.label }}
            <strong class="font-semibold text-[#1d2f6f]">{{ visibleTrendTotals[series.key] }}</strong>
          </div>
        </div>
      </div>
    </article>

    <div class="grid gap-3 xl:grid-cols-2">
      <article class="app-dashboard-card order-2">
        <div class="app-dashboard-panel-header flex items-start justify-between gap-4">
          <div>
            <p class="app-dashboard-eyebrow">
              {{ departmentEyebrow }}
            </p>
            <h3 class="mt-1 text-[1.05rem] font-semibold text-[#1d2f6f]">
              {{ departmentTitle }}
            </h3>
            <p class="app-dashboard-copy mt-1">
              {{ departmentDescription }}
            </p>
            <p
              v-if="activeDepartmentLabel || activeFunnelStageLabel"
              class="mt-2 text-sm font-medium text-blue-700"
            >
              <span v-if="activeDepartmentLabel">{{ departmentFilterLabel }}: {{ activeDepartmentLabel }}</span>
              <span v-if="activeDepartmentLabel && activeFunnelStageLabel"> • </span>
              <span v-if="activeFunnelStageLabel">{{ stageFilterLabel }}: {{ activeFunnelStageLabel }}</span>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div class="app-dashboard-segmented text-sm">
              <button
                type="button"
                class="app-dashboard-segmented-button px-3 py-1.5"
                :class="departmentMode === 'stacked' ? 'app-dashboard-segmented-button-active' : ''"
                @click="departmentMode = 'stacked'"
              >
                {{ stackedLabel }}
              </button>
              <button
                type="button"
                class="app-dashboard-segmented-button px-3 py-1.5"
                :class="departmentMode === 'grouped' ? 'app-dashboard-segmented-button-active' : ''"
                @click="departmentMode = 'grouped'"
              >
                {{ groupedLabel }}
              </button>
            </div>
            <button
              v-if="activeDepartmentLabel"
              type="button"
              class="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              @click="$emit('clearDepartment')"
            >
              {{ allLabel }}
            </button>
          </div>
        </div>

        <div class="px-5 py-5">
          <div class="max-h-[560px] overflow-y-auto">
            <svg
              v-if="departmentMode === 'stacked'"
              :viewBox="`0 0 760 ${departmentChartHeight}`"
              :style="{ height: `${departmentChartHeight}px` }"
              class="w-full"
            >
              <g>
                <line
                  v-for="tick in departmentAxisTicks"
                  :key="`department-grid-${tick}`"
                  :x1="departmentChartX(tick)"
                  :x2="departmentChartX(tick)"
                  y1="18"
                  :y2="departmentChartBottomY"
                  stroke="#dbe6f3"
                  stroke-dasharray="4 6"
                />
              </g>

              <g v-for="row in stackedDepartmentChartRows" :key="`stacked-${row.department}`">
                <text
                  x="112"
                  :y="row.y + 18"
                  text-anchor="end"
                  font-size="12"
                  :fill="activeDepartmentLabel === row.department ? '#1d4ed8' : '#94a3b8'"
                >
                  {{ row.label }}
                </text>

                <rect
                  x="120"
                  :y="row.y"
                  width="600"
                  height="28"
                  rx="4"
                  :fill="activeDepartmentLabel === row.department ? '#e0f2fe' : '#f8fafc'"
                  class="cursor-pointer"
                  @click="$emit('selectDepartment', row.department)"
                />

                <g
                  v-for="segment in row.segments"
                  :key="`${row.department}-${segment.key}`"
                >
                  <title>{{ `${row.department} · ${segment.shortLabel}: ${segment.count}` }}</title>
                  <rect
                    :x="segment.x"
                    :y="row.y"
                    :width="segment.width"
                    height="28"
                    rx="4"
                    :fill="segment.color"
                    class="cursor-pointer transition-opacity hover:opacity-80"
                    @click="$emit('selectDepartment', row.department)"
                  />
                  <text
                    v-if="segment.width >= 18"
                    :x="segment.x + segment.width / 2"
                    :y="row.y + 18"
                    text-anchor="middle"
                    font-size="11"
                    font-weight="700"
                    :fill="segment.textClass === 'text-slate-700' ? '#334155' : '#ffffff'"
                    class="pointer-events-none"
                  >
                    {{ segment.count }}
                  </text>
                </g>
              </g>
            </svg>

            <div v-else class="space-y-4">
              <button
                v-for="row in chartDepartmentRows"
                :key="row.department"
                type="button"
                class="grid w-full grid-cols-[112px_minmax(0,1fr)] items-center gap-4 rounded-md px-2 py-2 text-left transition hover:bg-slate-50"
                :class="activeDepartmentLabel === row.department ? 'bg-blue-50/60' : ''"
                @click="$emit('selectDepartment', row.department)"
              >
                <div class="truncate text-sm" :class="activeDepartmentLabel === row.department ? 'text-blue-700' : 'text-slate-400'">
                  {{ row.department }}
                </div>

                <div class="space-y-2">
                  <div v-for="segment in row.segments.filter((item) => item.count > 0)" :key="`${row.department}-${segment.key}-grouped`" class="flex items-center gap-2">
                    <span class="w-16 truncate text-[11px] font-medium text-slate-400">{{ segment.shortLabel }}</span>
                    <div class="h-4 flex-1 overflow-hidden rounded-[4px] bg-slate-50">
                      <div
                        class="flex h-4 items-center justify-end rounded-[4px] px-1.5 text-[10px] font-semibold"
                        :class="[segment.textClass, segment.barClass]"
                        :style="{ width: `${segment.width}%` }"
                        :title="`${row.department} · ${segment.shortLabel}: ${segment.count}`"
                      >
                        {{ segment.count }}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="departmentLegendItems.length > 0"
            class="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600"
          >
            <div
              v-for="item in departmentLegendItems"
              :key="`department-legend-${item.key}`"
              class="flex items-center gap-2"
            >
              <span
                class="inline-block h-3 w-3 rounded-full ring-1 ring-slate-200/80"
                :style="{ backgroundColor: item.color }"
              />
              <span>{{ item.label }}: <strong class="font-semibold text-[#1d2f6f]">{{ item.count }}</strong></span>
            </div>
          </div>
        </div>
      </article>

      <article class="app-dashboard-card order-1">
        <div class="app-dashboard-panel-header flex items-start justify-between gap-4">
          <div>
            <p class="app-dashboard-eyebrow">
              {{ pipelineEyebrow }}
            </p>
            <h3 class="mt-1 text-[1.05rem] font-semibold text-[#1d2f6f]">
              {{ pipelineTitle }}
            </h3>
            <p class="app-dashboard-copy mt-1">
              {{ pipelineDescription }}
            </p>
            <p
              v-if="activeDepartmentLabel || activeFunnelStageLabel"
              class="mt-2 text-sm font-medium text-blue-700"
            >
              <span v-if="activeDepartmentLabel">{{ departmentFilterLabel }}: {{ activeDepartmentLabel }}</span>
              <span v-if="activeDepartmentLabel && activeFunnelStageLabel"> • </span>
              <span v-if="activeFunnelStageLabel">{{ stageFilterLabel }}: {{ activeFunnelStageLabel }}</span>
            </p>
          </div>

          <button
            v-if="activeFunnelStageLabel"
            type="button"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            @click="$emit('clearFunnelStage')"
          >
            {{ allLabel }}
          </button>
        </div>

        <div class="max-h-[520px] space-y-3 overflow-y-auto px-5 py-5">
          <button
            v-for="step in funnelSteps"
            :key="step.code"
            type="button"
            class="grid w-full grid-cols-[168px_minmax(0,1fr)] items-center gap-4 rounded-md px-2 py-2 text-left transition"
            :class="activeFunnelStageCode === step.code ? 'bg-blue-50/60' : 'hover:bg-slate-50'"
            @click="$emit('selectFunnelStage', step.code)"
            >
              <div class="text-[13px] leading-5" :class="activeFunnelStageCode === step.code ? 'font-semibold text-blue-700' : 'text-slate-400'">
                {{ step.label }}
              </div>
              <div class="flex items-center">
                <div class="h-7 w-full overflow-hidden rounded-[4px] bg-slate-50">
                  <div
                    class="flex h-7 items-center justify-end rounded-[4px] px-3 text-sm font-semibold text-white"
                    :class="funnelToneClass(step.tone)"
                    :style="{ width: `${Math.max(step.percentage, step.value > 0 ? 16 : 0)}%` }"
                  >
                    {{ step.value }}
                  </div>
                </div>
              </div>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { SummaryColumn } from '@/features/recruitment/types/RecruitmentDashboardPage.type'

type DepartmentChartRow = {
  department: string
  counts: Record<string, number>
}

type TrendPoint = {
  label: string
  submitted: number
  filled: number
  inProgress: number
}

type TrendSeries = {
  key: 'submitted' | 'filled' | 'inProgress'
  label: string
  color: string
  textColor: string
}

type FunnelStepTone =
  | 'navy'
  | 'navySoft'
  | 'blueStrong'
  | 'blue'
  | 'blueSoft'
  | 'violet'
  | 'indigo'
  | 'cyan'
  | 'amber'
  | 'amberSoft'
  | 'greenSoft'
  | 'green'

defineEmits<{
  (event: 'selectDepartment', value: string): void
  (event: 'clearDepartment'): void
  (event: 'selectFunnelStage', value: string): void
  (event: 'clearFunnelStage'): void
}>()

const props = defineProps<{
  summaryTitle: string
  summaryDescription: string
  totalCount: number
  currentMonthCount: number
  averageAgeDays: number | null
  currentMonthLabel: string
  averageAgeLabel: string
  recruiterOwnershipTitle: string
  recruiterOwnershipItems: Array<{
    label: string
    count: number
  }>
  breakdownItems: Array<{
    label: string
    count: number
  }>
  departmentTitle: string
  departmentDescription: string
  departmentFilterLabel: string
  activeDepartmentLabel: string
  allLabel: string
  departmentEyebrow: string
  trendEyebrow: string
  trendTitle: string
  trendDescription: string
  pipelineEyebrow: string
  pipelineTitle: string
  pipelineDescription: string
  stageFilterLabel: string
  activeFunnelStageCode: string
  activeFunnelStageLabel: string
  stackedLabel: string
  groupedLabel: string
  departmentTableRows: DepartmentChartRow[]
  departmentColumns: SummaryColumn[]
  trendPoints: TrendPoint[]
  trendSeries: TrendSeries[]
  funnelSteps: Array<{
    code: string
    label: string
    value: number
    percentage: number
    tone: FunnelStepTone
  }>
}>()

const departmentMode = ref<'stacked' | 'grouped'>('stacked')
const trendWindow = ref<3 | 6>(6)

const cardToneMap: Record<string, { barClass: string; iconClass: string }> = {
  replacement: {
    barClass: 'bg-[linear-gradient(90deg,#f8d9a5_0%,#f6c384_100%)]',
    iconClass: 'bg-amber-50 text-amber-400',
  },
  'new position mpp': {
    barClass: 'bg-[linear-gradient(90deg,#bfe8ef_0%,#8fd6e1_100%)]',
    iconClass: 'bg-cyan-50 text-cyan-500',
  },
  'new position non-mpp': {
    barClass: 'bg-[linear-gradient(90deg,#d8cef6_0%,#bda9f1_100%)]',
    iconClass: 'bg-violet-50 text-violet-500',
  },
  internship: {
    barClass: 'bg-[linear-gradient(90deg,#f6c7d4_0%,#eea9be_100%)]',
    iconClass: 'bg-rose-50 text-rose-400',
  },
}

const breakdownCards = computed(() =>
  props.breakdownItems.map((item) => {
    const key = item.label.toLowerCase()
    const tone = cardToneMap[key] ?? {
      barClass: 'bg-[linear-gradient(90deg,#1d2f6f_0%,#4a9fd4_100%)]',
      iconClass: 'bg-slate-100 text-slate-500',
    }

    return {
      ...item,
      percentage: props.totalCount > 0 ? Math.round((item.count / props.totalCount) * 100) : 0,
      ...tone,
    }
  }),
)

function normalizeLevelKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function departmentSegmentStyle(columnKey: string) {
  const key = normalizeLevelKey(columnKey)

  if (key.includes('non staff')) {
    return { barClass: 'bg-slate-200', shortLabel: 'Non Staff', textClass: 'text-slate-700', color: '#e2e8f0' }
  }
  if (key.includes('staff')) {
    return { barClass: 'bg-sky-300', shortLabel: 'Staff', textClass: 'text-slate-700', color: '#7dd3fc' }
  }
  if (key.includes('spv')) {
    return { barClass: 'bg-violet-300', shortLabel: 'Spv', textClass: 'text-slate-700', color: '#c4b5fd' }
  }
  if (key.includes('mgr')) {
    return { barClass: 'bg-fuchsia-300', shortLabel: 'Mgr', textClass: 'text-slate-700', color: '#f0abfc' }
  }
  if (key.includes('dir')) {
    return { barClass: 'bg-emerald-300', shortLabel: 'Dir', textClass: 'text-slate-700', color: '#86efac' }
  }
  if (key.includes('other')) {
    return { barClass: 'bg-slate-300', shortLabel: 'Other', textClass: 'text-slate-700', color: '#cbd5e1' }
  }

  return { barClass: 'bg-slate-300', shortLabel: columnKey, textClass: 'text-slate-700', color: '#cbd5e1' }
}

const maxDepartmentTotal = computed(() =>
  Math.max(
    1,
    ...props.departmentTableRows.map((row) =>
      props.departmentColumns.reduce((sum, column) => sum + (row.counts[column.key] ?? 0), 0),
    ),
  ),
)

const chartDepartmentRows = computed(() =>
  props.departmentTableRows.map((row) => ({
    department: row.department,
    segments: props.departmentColumns.map((column) => {
      const count = row.counts[column.key] ?? 0
      const segmentStyle = departmentSegmentStyle(column.key)
      return {
        key: column.key,
        count,
        width: (count / maxDepartmentTotal.value) * 100,
        ...segmentStyle,
      }
    }),
  })),
)

const departmentLegendItems = computed(() =>
  props.departmentColumns
    .map((column) => {
      const segmentStyle = departmentSegmentStyle(column.key)
      const count = props.departmentTableRows.reduce((sum, row) => sum + (row.counts[column.key] ?? 0), 0)

      return {
        key: column.key,
        label: segmentStyle.shortLabel || column.label,
        count,
        color: segmentStyle.color,
      }
    })
    .filter((item) => item.count > 0),
)

function abbreviateDepartmentLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 15)}...` : value
}

const departmentAxisTicks = computed(() =>
  Array.from({ length: maxDepartmentTotal.value + 1 }, (_, index) => index),
)

function departmentChartX(value: number) {
  const chartStart = 120
  const chartWidth = 600
  return chartStart + (value / maxDepartmentTotal.value) * chartWidth
}

const stackedDepartmentChartRows = computed(() =>
  chartDepartmentRows.value.map((row, index) => {
    let currentX = 120

    return {
      department: row.department,
      label: abbreviateDepartmentLabel(row.department),
      y: 24 + index * 40,
      segments: row.segments
        .filter((segment) => segment.count > 0)
        .map((segment) => {
          const width = (segment.count / maxDepartmentTotal.value) * 600
          const nextSegment = {
            ...segment,
            x: currentX,
            width,
            color: segment.color,
          }
          currentX += width
          return nextSegment
        }),
    }
  }),
)

const departmentChartHeight = computed(() =>
  Math.max(116, stackedDepartmentChartRows.value.length * 40 + 36),
)

const departmentChartBottomY = computed(() => departmentChartHeight.value - 28)

const visibleTrendPoints = computed(() =>
  trendWindow.value === 3
    ? props.trendPoints.slice(-3)
    : props.trendPoints,
)

const visibleTrendTotals = computed(() =>
  visibleTrendPoints.value.reduce(
    (total, point) => ({
      submitted: total.submitted + point.submitted,
      filled: total.filled + point.filled,
      inProgress: total.inProgress + point.inProgress,
    }),
    { submitted: 0, filled: 0, inProgress: 0 },
  ),
)

const trendMax = computed(() =>
  Math.max(
    1,
    ...visibleTrendPoints.value.flatMap((point) => props.trendSeries.map((series) => point[series.key])),
  ),
)

const yTicks = computed(() =>
  Array.from({ length: trendMax.value + 1 }, (_, index) => index),
)

const chartFloorY = 220

function chartY(value: number) {
  return chartFloorY - (value / trendMax.value) * 170
}

const barWidth = computed(() => {
  const bucketWidth = 820 / Math.max(1, visibleTrendPoints.value.length)
  return Math.max(18, Math.min(36, Math.floor((bucketWidth - 22) / Math.max(1, props.trendSeries.length))))
})

function bucketStartX(index: number) {
  return 48 + (800 / Math.max(1, visibleTrendPoints.value.length)) * index + 18
}

function barX(index: number, seriesIndex: number) {
  return bucketStartX(index) + seriesIndex * (barWidth.value + 6)
}

function bucketCenterX(index: number) {
  const seriesWidth = barWidth.value * Math.max(1, props.trendSeries.length) + 6 * Math.max(0, props.trendSeries.length - 1)
  return bucketStartX(index) + seriesWidth / 2 - 3
}

function barValueY(value: number) {
  return chartY(value) - 8
}

function funnelToneClass(tone: FunnelStepTone) {
  switch (tone) {
    case 'navy':
      return 'bg-[linear-gradient(90deg,#c9d4f6_0%,#b8c6ef_100%)] text-slate-700'
    case 'navySoft':
      return 'bg-[linear-gradient(90deg,#d7def5_0%,#c4d0ef_100%)] text-slate-700'
    case 'blueStrong':
      return 'bg-[linear-gradient(90deg,#cfe0fb_0%,#bdd4f7_100%)] text-slate-700'
    case 'blue':
      return 'bg-[linear-gradient(90deg,#d8e7fb_0%,#c7dcf6_100%)] text-slate-700'
    case 'blueSoft':
      return 'bg-[linear-gradient(90deg,#d9edf7_0%,#c5e3f2_100%)] text-slate-700'
    case 'violet':
      return 'bg-[linear-gradient(90deg,#e4daf9_0%,#d3c4f5_100%)] text-slate-700'
    case 'indigo':
      return 'bg-[linear-gradient(90deg,#dbdcfb_0%,#c8cbf6_100%)] text-slate-700'
    case 'cyan':
      return 'bg-[linear-gradient(90deg,#d2f0ee_0%,#bde7e2_100%)] text-slate-700'
    case 'amber':
      return 'bg-[linear-gradient(90deg,#f8e3b6_0%,#f4d291_100%)] text-slate-700'
    case 'amberSoft':
      return 'bg-[linear-gradient(90deg,#f8e7c4_0%,#f5ddb0_100%)] text-slate-700'
    case 'greenSoft':
      return 'bg-[linear-gradient(90deg,#d3eddc_0%,#bde3cb_100%)] text-slate-700'
    case 'green':
      return 'bg-[linear-gradient(90deg,#d5edd8_0%,#c0e5c8_100%)] text-slate-700'
    default:
      return 'bg-slate-500'
  }
}
</script>
