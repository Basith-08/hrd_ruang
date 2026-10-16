<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('interviewEvaluations.list.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('interviewEvaluations.list.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('interviewEvaluations.list.description') }}
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :disabled="loading"
            :loading="loading"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refresh"
          />

          <AppActionButton
            v-if="canCreate"
            class="inline-flex min-h-11 min-w-[160px] items-center justify-center"
            variant="primary"
            :label="text('interviewEvaluations.list.actions.newAssessment')"
            @click="goToCreateAssessment"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ text('interviewEvaluations.list.title') }}
            </h2>
            <p class="app-dashboard-copy mt-1">
              {{ text('interviewEvaluations.list.description') }}
            </p>
          </div>

          <label class="block xl:w-[420px] xl:flex-none">
            <span class="app-fieldset-label mb-1.5 block">
              {{ text('common.labels.search') }}
            </span>
            <AppSearchInput
              v-model="searchQuery"
              :placeholder="text('interviewEvaluations.list.searchPlaceholder')"
              class="w-full"
            />
          </label>
        </div>
      </div>

      <InterviewEvaluationTable
        v-model:page="page"
        :evaluations="paginatedInterviewEvaluations"
        :total-items="sortedInterviewEvaluations.length"
        :loading="loading"
        :page-size="pageSize"
        :empty-label="text('interviewEvaluations.list.noSaved')"
        :candidate-label="text('interviewEvaluations.list.headers.candidate')"
        :position-label="text('interviewEvaluations.list.headers.position')"
        :interviewer-label="text('interviewEvaluations.list.headers.interviewer')"
        :interview-date-label="text('interviewEvaluations.list.headers.interviewDate')"
        :average-label="text('interviewEvaluations.list.headers.average')"
        :actions-label="text('interviewEvaluations.list.headers.actions')"
        :format-date="formatDate"
        :format-interviewer-display="formatInterviewerDisplay"
        :format-average-score="formatAverageScore"
        :build-row-actions="buildRowActions"
        :sort-indicator="sortIndicator"
        @sort="toggleSort"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "#imports"

import { useLocale } from "@/composables/useLocale"
import type {
  InterviewEvaluation,
} from "@/domain/entities/InterviewEvaluation"
import InterviewEvaluationTable from "@/features/interviewEvaluations/components/InterviewEvaluationTable.vue"
import AppActionButton from "@/presentation/components/buttons/AppActionButton.vue"
import AppAlert from "@/presentation/components/feedback/AppAlert.vue"
import { useAppConfirm } from "@/presentation/components/feedback/useAppConfirm"
import { useAppToast } from "@/presentation/components/feedback/useAppToast"
import AppSearchInput from "@/presentation/components/forms/AppSearchInput.vue"
import { formatInterviewDateTimeDisplay } from "@/presentation/utils/dateFormat"
import { compareNullableValues, parseSortDate, type TableSortDirection } from "@/presentation/utils/tableSort"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import { useInterviewEvaluationViewModel } from "@/viewmodels/useInterviewEvaluationViewModel"

const router = useRouter()
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()
const { hasPermission } = useAuthViewModel()
const { error, interviewEvaluations, loading, refresh, remove } = useInterviewEvaluationViewModel()

const searchQuery = ref("")
const sortKey = ref<InterviewEvaluationSortKey | ''>("")
const sortDirection = ref<TableSortDirection>("asc")
const pageSize = 10
const page = ref(1)
const canCreate = computed(() => hasPermission("interview_evaluation:create"))
const canUpdate = computed(() => hasPermission("interview_evaluation:update"))
const canDelete = computed(() => hasPermission("interview_evaluation:delete"))

type InterviewEvaluationSortKey =
  | "candidate_name"
  | "applied_position"
  | "interviewer"
  | "interview_date"
  | "average_score"

const filteredInterviewEvaluations = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return interviewEvaluations.value
  }

  return interviewEvaluations.value.filter((evaluation) =>
    [
      evaluation.candidate_name,
      evaluation.applied_position,
      buildInterviewerSearchText(evaluation),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  )
})

function numericAverageScore(evaluation: InterviewEvaluation) {
  const persistedAverage = Number(evaluation.average_score)
  if (Number.isFinite(persistedAverage) && persistedAverage > 0) {
    return persistedAverage
  }

  const validScores = evaluation.scores
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score) && score > 0)

  if (!validScores.length) {
    return null
  }

  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length
}

function compareEvaluations(
  left: InterviewEvaluation,
  right: InterviewEvaluation,
  activeSortKey: InterviewEvaluationSortKey,
  direction: TableSortDirection,
) {
  switch (activeSortKey) {
    case "interviewer":
      return compareNullableValues(
        formatInterviewerDisplay(left),
        formatInterviewerDisplay(right),
        direction,
      )
    case "interview_date":
      return compareNullableValues(
        parseSortDate(left.interview_date),
        parseSortDate(right.interview_date),
        direction,
      )
    case "average_score":
      return compareNullableValues(numericAverageScore(left), numericAverageScore(right), direction)
    default:
      return compareNullableValues(left[activeSortKey], right[activeSortKey], direction)
  }
}

const sortedInterviewEvaluations = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) {
    return filteredInterviewEvaluations.value
  }

  return [...filteredInterviewEvaluations.value].sort((left, right) =>
    compareEvaluations(left, right, activeSortKey, sortDirection.value),
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedInterviewEvaluations.value.length / pageSize)),
)

const paginatedInterviewEvaluations = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const startIndex = (safePage - 1) * pageSize
  return sortedInterviewEvaluations.value.slice(startIndex, startIndex + pageSize)
})

watch(searchQuery, () => {
  page.value = 1
})

watch(
  () => filteredInterviewEvaluations.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)

function formatDate(value: string | null) {
  return formatInterviewDateTimeDisplay(value)
}

function formatAverageScore(evaluation: InterviewEvaluation) {
  const average = numericAverageScore(evaluation)
  return average == null ? "-" : average.toFixed(2)
}

function getInterviewerLabels(evaluation: InterviewEvaluation) {
  const recipientLabels = (Array.isArray(evaluation.interviewer_recipients)
    ? evaluation.interviewer_recipients
    : []
  )
    .map((recipient) => String(recipient.label || recipient.name || "").trim())
    .filter(Boolean)

  if (recipientLabels.length > 0) {
    return recipientLabels
  }

  const resultLabels = (Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results
    : []
  )
    .map((result) => String(result?.interviewer?.label || result?.interviewer?.name || "").trim())
    .filter(Boolean)

  if (resultLabels.length > 0) {
    return resultLabels
  }

  return String(evaluation.interviewer_name || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function formatInterviewerDisplay(evaluation: InterviewEvaluation) {
  const labels = getInterviewerLabels(evaluation)
  return labels.length > 0
    ? labels.map((label, index) => `${index + 1}. ${label}`).join("\n")
    : "-"
}

function buildInterviewerSearchText(evaluation: InterviewEvaluation) {
  const labels = getInterviewerLabels(evaluation)
  const userIds = (Array.isArray(evaluation.interviewer_recipients)
    ? evaluation.interviewer_recipients
    : []
  )
    .map((recipient) => String(recipient.user_id || "").trim())
    .filter(Boolean)

  return [...labels, ...userIds].join(" ")
}

function goToEdit(evaluationId: string) {
  router.push({
    path: "/interview-evaluations/manage",
    query: { edit: evaluationId },
  })
}

function goToCreateAssessment() {
  router.push({
    path: "/interview-evaluations/manage",
    query: {},
  })
}

async function handleDelete(evaluation: InterviewEvaluation) {
  if (!canDelete.value) {
    appToast.error(text("interviewEvaluations.list.deleteDenied"))
    return
  }

  const confirmed = await appConfirm.confirm({
    title: text("common.actions.confirm"),
    message: text("interviewEvaluations.list.confirmDelete", { name: evaluation.candidate_name }),
    confirmLabel: text("common.actions.delete"),
    cancelLabel: text("common.actions.cancel"),
    tone: "danger",
  })
  if (!confirmed) {
    return
  }

  try {
    await remove(evaluation.id)
    appToast.deleted(text("interviewEvaluations.list.toasts.deleted"))
  } catch {
    // Error is already exposed by the shared viewmodel.
  }
}

function buildRowActions(evaluation: InterviewEvaluation) {
  return [
    {
      label: text("interviewEvaluations.list.actions.edit"),
      disabled: !canUpdate.value,
      onClick: () => goToEdit(evaluation.id),
    },
    {
      label: text("interviewEvaluations.list.actions.delete"),
      disabled: !canDelete.value,
      onClick: () => handleDelete(evaluation),
    },
  ]
}

function toggleSort(key: string) {
  const nextKey = key as InterviewEvaluationSortKey
  if (sortKey.value === nextKey) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
    return
  }

  sortKey.value = nextKey
  sortDirection.value = ["interview_date", "average_score"].includes(nextKey) ? "desc" : "asc"
}

function sortIndicator(key: string) {
  if (sortKey.value !== key) return "↑↓"
  return sortDirection.value === "asc" ? "↑" : "↓"
}
</script>
