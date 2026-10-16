<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
          {{ text('interviewEvaluasi.page.eyebrow') }}
        </p>
          <h1 class="app-dashboard-title mt-3">
          {{ text('interviewEvaluasi.page.title') }}
        </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('interviewEvaluasi.page.description') }}
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :loading="loading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refresh"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div class="min-w-0 flex-1 max-w-2xl">
              <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
                {{ text('interviewEvaluasi.page.title') }}
              </h2>
              <p class="app-dashboard-copy mt-1">
                {{ text('interviewEvaluasi.page.description') }}
              </p>
            </div>

            <div class="grid gap-3 xl:grid-cols-[minmax(280px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] xl:items-end">
              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">{{ text('common.labels.search') }}</span>
                <AppSearchInput
                  v-model="searchQuery"
                  :placeholder="text('interviewEvaluasi.page.searchPlaceholder')"
                  class="w-full"
                />
              </label>
              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">{{ text('common.labels.from') }}</span>
                <input
                  v-model="periodStart"
                  type="date"
                  class="app-field"
                >
              </label>
              <label class="block">
                <span class="app-fieldset-label mb-1.5 block">{{ text('common.labels.to') }}</span>
                <input
                  v-model="periodEnd"
                  type="date"
                  class="app-field"
                >
              </label>
              <AppActionButton
                class="inline-flex min-h-11 min-w-[140px] items-center justify-center"
                variant="secondary"
                :label="text('recruitment.dashboard.detail.currentMonth')"
                @click="resetPeriodToCurrentMonth"
              />
            </div>
          </div>
        </div>
      </div>

      <InterviewEvaluasiTable
          v-model:page="page"
          :items="pagedEvaluations"
          :loading="loading"
          :page-size="pageSize"
          :total-items="sortedEvaluations.length"
          :number-label="text('interviewEvaluasi.page.columns.no')"
          :main-position-label="text('interviewEvaluasi.page.columns.mainPosition')"
          :candidate-name-label="text('interviewEvaluasi.page.columns.candidateName')"
          :interviewer-label="text('interviewEvaluasi.page.columns.interviewer')"
          :flow-status-label="'Flow Status'"
          :score-label="text('interviewEvaluasi.page.columns.score')"
          :remarks-label="text('interviewEvaluasi.page.columns.remarks')"
          :empty-message="text('interviewEvaluasi.page.empty')"
          :row-number="rowNumber"
          :resolve-flow-stage="resolveFlowStage"
          :recruitment-flow-stage-badge-class="recruitmentFlowStageBadgeClass"
          :recruitment-flow-stage-label="recruitmentFlowStageLabel"
          :format-average-score="formatAverageScore"
          :sort-indicator="sortIndicator"
          @sort="toggleSort"
        />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type {
  InterviewEvaluation,
  InterviewEvaluationInterviewerResult,
} from '@/domain/entities/InterviewEvaluation'
import { useLocale } from '@/composables/useLocale'
import InterviewEvaluasiTable from '@/features/recruitment/components/InterviewEvaluasiTable.vue'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from '@/domain/utils/recruitmentFlowStage'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'
import { compareNullableValues, type TableSortDirection } from '@/presentation/utils/tableSort'
import { useInterviewEvaluationViewModel } from '@/viewmodels/useInterviewEvaluationViewModel'

type InterviewEvaluasiRow = InterviewEvaluation & {
  evaluation_id: string
  interviewer_display: string
}

type InterviewEvaluasiSortKey =
  | 'applied_position'
  | 'candidate_name'
  | 'interviewer_display'
  | 'flow_status'
  | 'score'
  | 'comments'

const { text } = useLocale()
const { error, interviewEvaluations, loading, refresh } = useInterviewEvaluationViewModel({
  loadCandidateOptionsOnMounted: false,
})

const searchQuery = ref('')
const periodStart = ref('')
const periodEnd = ref('')
const sortKey = ref<InterviewEvaluasiSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const pageSize = 10
const page = ref(1)
const evaluationRows = computed<InterviewEvaluasiRow[]>(() =>
  interviewEvaluations.value.flatMap((evaluation) => mapEvaluationRowsByInterviewer(evaluation)),
)

const periodFilteredEvaluations = computed(() =>
  evaluationRows.value.filter((evaluation) => {
    const interviewDate = getEvaluationDateKey(evaluation)
    if (interviewDate === '-') return !periodStart.value && !periodEnd.value
    if (periodStart.value && interviewDate < periodStart.value) return false
    if (periodEnd.value && interviewDate > periodEnd.value) return false
    return true
  }),
)

const filteredEvaluations = computed(() => {
  const query = normalize(searchQuery.value)
  if (!query) return periodFilteredEvaluations.value

  return periodFilteredEvaluations.value.filter((evaluation) =>
    [
      evaluation.applied_position,
      evaluation.candidate_name,
      evaluation.interviewer_display,
      recruitmentFlowStageLabel(resolveFlowStage(evaluation)),
      evaluation.comments,
      formatAverageScore(evaluation),
    ]
      .map(normalize)
      .join(' ')
      .includes(query),
  )
})

function numericAverageScore(evaluation: InterviewEvaluation) {
  const validScores = getScoresForAverage(evaluation)
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score) && score > 0)

  if (!validScores.length) return null

  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length
}

function compareEvaluations(
  left: InterviewEvaluasiRow,
  right: InterviewEvaluasiRow,
  activeSortKey: InterviewEvaluasiSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case 'flow_status':
      return compareNullableValues(
        recruitmentFlowStageLabel(resolveFlowStage(left)),
        recruitmentFlowStageLabel(resolveFlowStage(right)),
        direction,
      )
    case 'score':
      return compareNullableValues(numericAverageScore(left), numericAverageScore(right), direction)
    default:
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
  }
}

const sortedEvaluations = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredEvaluations.value

  return [...filteredEvaluations.value].sort((left, right) =>
    compareEvaluations(left, right, activeSortKey, sortDirection.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedEvaluations.value.length / pageSize)))
const pagedEvaluations = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedEvaluations.value.slice(start, start + pageSize)
})

function fallback(value: unknown) {
  return String(value ?? '').trim() || '-'
}

function getJakartaTodayParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: byType.year,
    month: byType.month,
    day: byType.day,
  }
}

function getCurrentMonthStart() {
  const { year, month } = getJakartaTodayParts()
  return `${year}-${month}-01`
}

function getCurrentMonthEnd() {
  const { year, month } = getJakartaTodayParts()
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

function resetPeriodToCurrentMonth() {
  periodStart.value = getCurrentMonthStart()
  periodEnd.value = getCurrentMonthEnd()
}

function getEvaluationDateKey(evaluation: InterviewEvaluation) {
  return formatDateDisplay(evaluation.interview_date)
}

function resolveFlowStage(evaluation: InterviewEvaluation) {
  if (evaluation.recruitment_flow_stage) {
    return evaluation.recruitment_flow_stage
  }

  return resolveRecruitmentFlowStage({
    employeeRequestForm: {
      id: String(evaluation.employee_request_form_id ?? ''),
      recruitment_flow_stage: evaluation.recruitment_flow_stage ?? null,
      vacancy_status: evaluation.vacancy_status ?? null,
    },
  })
}

function mapEvaluationRowsByInterviewer(evaluation: InterviewEvaluation): InterviewEvaluasiRow[] {
  const interviewerResults = (Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results
    : [])
    .filter(isInterviewerResultDefined)

  if (interviewerResults.length > 0) {
    return interviewerResults.map((result, index) => ({
      ...evaluation,
      id: `${evaluation.id}:result:${result.id || index + 1}`,
      evaluation_id: evaluation.id,
      interviewer_name: result.interviewer.label || result.interviewer.name,
      interviewer_display: formatSingleInterviewerDisplay(
        result.interviewer.label || result.interviewer.name,
        hasSubmittedScores(result.scores),
      ),
      comments: result.comments,
      recommendation: result.recommendation,
      scores: result.scores,
    }))
  }

  const recipients = (Array.isArray(evaluation.interviewer_recipients)
    ? evaluation.interviewer_recipients
    : []
  ).filter((recipient) =>
    [recipient?.user_id, recipient?.label, recipient?.name, recipient?.email]
      .map((value) => String(value ?? '').trim())
      .some(Boolean),
  )

  if (recipients.length > 0) {
    return recipients.map((recipient, index) => {
      const interviewerName = fallback(recipient.label || recipient.name)
      return {
        ...evaluation,
        id: `${evaluation.id}:recipient:${recipient.user_id || index + 1}`,
        evaluation_id: evaluation.id,
        interviewer_name: interviewerName,
        interviewer_display: formatSingleInterviewerDisplay(interviewerName, false),
        comments: null,
      }
    })
  }

  return [
    {
      ...evaluation,
      id: `${evaluation.id}:0`,
      evaluation_id: evaluation.id,
      interviewer_display: fallback(evaluation.interviewer_name),
    },
  ]
}

function isInterviewerResultDefined(
  result: InterviewEvaluationInterviewerResult | null | undefined,
): result is InterviewEvaluationInterviewerResult {
  return Boolean(
    result?.id &&
    [result?.interviewer?.user_id, result?.interviewer?.label, result?.interviewer?.name, result?.interviewer?.email]
      .map((value) => String(value ?? '').trim())
      .some(Boolean),
  )
}

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function formatAverageScore(evaluation: InterviewEvaluation) {
  const average = numericAverageScore(evaluation)
  return average == null ? '-' : average.toFixed(2)
}

function getScoresForAverage(evaluation: InterviewEvaluation) {
  if (Array.isArray(evaluation.scores) && evaluation.scores.length > 0) {
    return evaluation.scores
  }

  const interviewerScores = (Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results
    : []
  )
    .filter(isInterviewerResultDefined)
    .flatMap((result) => (Array.isArray(result.scores) ? result.scores : []))

  return interviewerScores.length > 0 ? interviewerScores : evaluation.scores
}

function formatSingleInterviewerDisplay(name: unknown, hasSubmitted: boolean) {
  const interviewerName = fallback(name)
  return hasSubmitted
    ? `${interviewerName} ${text('interviewEvaluasi.page.interviewerScoredTag')}`
    : interviewerName
}

function hasSubmittedScores(scores: InterviewEvaluation['scores'] | undefined) {
  return Boolean(
    Array.isArray(scores) &&
    scores.some((score) => Number.isFinite(Number(score.score)) && Number(score.score) > 0),
  )
}

function rowNumber(index: number) {
  return (page.value - 1) * pageSize + index + 1
}

function toggleSort(key: string) {
  const nextKey = key as InterviewEvaluasiSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = nextKey
  sortDirection.value = nextKey === 'score' ? 'desc' : 'asc'
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

watch([searchQuery, periodStart, periodEnd], () => {
  page.value = 1
})

watch(
  () => filteredEvaluations.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)
</script>
