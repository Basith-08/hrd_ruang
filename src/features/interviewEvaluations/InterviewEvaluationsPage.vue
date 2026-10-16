<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ pageEyebrow }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ pageTitle }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ pageDescription }}
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :disabled="isRefreshing"
            :loading="isRefreshing"
            :label="text('common.actions.refresh')"
            :loading-label="text('common.loading')"
            @click="refreshPage"
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

    <AppAlert :message="pageError" />
    <AppLoadingOverlay
      v-if="openingAssignment"
      :message="text('common.loadingData')"
    />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ tableTitle }}
            </h2>
            <p class="app-dashboard-copy mt-1">
              {{ tableDescription }}
            </p>
          </div>

          <label class="block xl:w-[420px] xl:flex-none">
            <span class="app-fieldset-label mb-1.5 block">
              {{ text('common.labels.search') }}
            </span>
            <AppSearchInput
              v-model="searchQuery"
              :placeholder="searchPlaceholder"
              class="w-full"
            />
          </label>
        </div>
      </div>

      <InterviewEvaluationTable
        v-model:page="page"
        :evaluations="paginatedEvaluations"
        :total-items="sortedEvaluations.length"
        :loading="tableLoading"
        :page-size="pageSize"
        :empty-label="emptyLabel"
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
import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"
import InterviewEvaluationTable from "@/features/interviewEvaluations/components/InterviewEvaluationTable.vue"
import AppActionButton from "@/presentation/components/buttons/AppActionButton.vue"
import AppAlert from "@/presentation/components/feedback/AppAlert.vue"
import AppLoadingOverlay from "@/presentation/components/feedback/AppLoadingOverlay.vue"
import { useAppConfirm } from "@/presentation/components/feedback/useAppConfirm"
import { useAppToast } from "@/presentation/components/feedback/useAppToast"
import AppSearchInput from "@/presentation/components/forms/AppSearchInput.vue"
import { formatInterviewDateTimeDisplay } from "@/presentation/utils/dateFormat"
import { compareNullableValues, parseSortDate, type TableSortDirection } from "@/presentation/utils/tableSort"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import { useInterviewEvaluationViewModel } from "@/viewmodels/useInterviewEvaluationViewModel"
import { useInterviewerFormViewModel } from "@/viewmodels/useInterviewerFormViewModel"

const pageSize = 10
type InterviewEvaluationsSortKey =
  | "candidate_name"
  | "applied_position"
  | "interviewer"
  | "interview_date"
  | "average_score"

const router = useRouter()
const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()
const { hasPermission, user } = useAuthViewModel()

const canReadList = computed(() => hasPermission("interview_evaluation:read"))
const canCreate = computed(() => hasPermission("interview_evaluation:create"))
const canUpdate = computed(() => hasPermission("interview_evaluation:update"))
const canDelete = computed(() => hasPermission("interview_evaluation:delete"))
const canEvaluate = computed(() => hasPermission("interview_evaluation:interviewer_form"))
const currentUserId = computed(() => String(user.value?.id ?? "").trim())
const currentUserEmail = computed(() => String(user.value?.email ?? "").trim().toLowerCase())

const openingAssignment = ref(false)
const searchQuery = ref("")
const sortKey = ref<InterviewEvaluationsSortKey | ''>("")
const sortDirection = ref<TableSortDirection>("asc")
const page = ref(1)

const {
  error: listError,
  interviewEvaluations,
  loading: listLoading,
  refresh: refreshInterviewEvaluations,
  remove,
} = useInterviewEvaluationViewModel({
  loadCandidateOptionsOnMounted: false,
  loadEvaluationsOnMounted: canReadList.value,
})

const {
  assignedEvaluations,
  error: assignmentError,
  loading: assignmentLoading,
  refresh: refreshAssignedEvaluations,
} = useInterviewerFormViewModel({
  loadAssignedOnMounted: !canReadList.value,
  loadCandidateOptionsOnMounted: false,
})

const pageEyebrow = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.page.eyebrow")
    : text("interviewEvaluations.interviewer.eyebrow"),
)
const pageTitle = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.page.title")
    : text("interviewEvaluations.interviewer.title"),
)
const pageDescription = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.page.description")
    : text("interviewEvaluations.interviewer.description"),
)
const tableTitle = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.list.title")
    : text("interviewEvaluations.interviewer.assignmentTableTitle"),
)
const tableDescription = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.list.description")
    : text("interviewEvaluations.interviewer.assignmentTableDescription"),
)
const searchPlaceholder = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.list.searchPlaceholder")
    : text("interviewEvaluations.interviewer.searchPlaceholder"),
)
const emptyLabel = computed(() =>
  canReadList.value
    ? text("interviewEvaluations.list.noSaved")
    : text("interviewEvaluations.interviewer.noAssignments"),
)
const pageError = computed(() => listError.value || assignmentError.value)
const isRefreshing = computed(() => listLoading.value || assignmentLoading.value)
const tableLoading = computed(() => (canReadList.value ? listLoading.value : assignmentLoading.value))
const tableEvaluations = computed(() =>
  canReadList.value ? interviewEvaluations.value : assignedEvaluations.value,
)

const filteredEvaluations = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return tableEvaluations.value
  }

  return tableEvaluations.value.filter((evaluation) =>
    [
      evaluation.candidate_name,
      evaluation.applied_position,
      buildInterviewerSearchText(evaluation),
      evaluation.interview_date,
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

  const matchedResult = (Array.isArray(evaluation.interviewer_results) ? evaluation.interviewer_results : []).find(
    (result) => {
      const resultUserId = String(result?.interviewer?.user_id ?? "").trim()
      const resultEmail = String(result?.interviewer?.email ?? "").trim().toLowerCase()
      return (
        (currentUserId.value && resultUserId === currentUserId.value) ||
        (currentUserEmail.value && resultEmail === currentUserEmail.value)
      )
    },
  )

  const scoreSource = Array.isArray(evaluation.scores) && evaluation.scores.length > 0
    ? evaluation.scores
    : (Array.isArray(matchedResult?.scores) ? matchedResult.scores : [])

  const validScores = scoreSource
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
  activeSortKey: InterviewEvaluationsSortKey,
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

const sortedEvaluations = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) {
    return filteredEvaluations.value
  }

  return [...filteredEvaluations.value].sort((left, right) =>
    compareEvaluations(left, right, activeSortKey, sortDirection.value),
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedEvaluations.value.length / pageSize)),
)

const paginatedEvaluations = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const startIndex = (safePage - 1) * pageSize
  return sortedEvaluations.value.slice(startIndex, startIndex + pageSize)
})

watch(searchQuery, () => {
  page.value = 1
})

watch(
  () => filteredEvaluations.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)

async function refreshPage() {
  if (canReadList.value) {
    await refreshInterviewEvaluations()
    return
  }

  await refreshAssignedEvaluations()
}

function goToCreateAssessment() {
  router.push({
    path: "/interview-evaluations/manage",
    query: {},
  })
}

function goToEdit(evaluationId: string) {
  router.push({
    path: "/interview-evaluations/manage",
    query: { edit: evaluationId },
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

async function openEvaluation(
  evaluation: InterviewEvaluation,
  mode: "evaluate" | "detail",
  identity: {
    interviewer_result_id?: string
    interviewer_user_id?: string
    interviewer_email?: string | null
    interviewer_label?: string
  } = {},
) {
  const query: Record<string, string> = {}
  if (mode === "detail") {
    query.mode = "detail"
  }
  if (identity.interviewer_result_id) {
    query.interviewer_result_id = identity.interviewer_result_id
  } else if (identity.interviewer_user_id) {
    query.interviewer_user_id = identity.interviewer_user_id
  } else if (identity.interviewer_email) {
    query.interviewer_email = identity.interviewer_email
  } else if (identity.interviewer_label) {
    query.interviewer_label = identity.interviewer_label
  }

  openingAssignment.value = true

  try {
    await router.push({
      path: `/interview-evaluations/evaluate/${encodeURIComponent(evaluation.id)}`,
      query,
    })
  } finally {
    openingAssignment.value = false
  }
}

function buildRowActions(evaluation: InterviewEvaluation) {
  const actions: Array<{
    label: string
    disabled?: boolean
    tone?: "default" | "danger"
    onClick: () => void | Promise<void>
  }> = []

  const assignmentIdentity = resolveCurrentUserAssignmentIdentity(evaluation)
  if (canEvaluate.value && assignmentIdentity) {
    actions.push({
      label: text("interviewEvaluations.interviewer.actions.evaluate"),
      onClick: () => openEvaluation(evaluation, "evaluate", assignmentIdentity),
    })
  }

  if (canReadList.value) {
    actions.push({
      label: text("common.actions.detail"),
      onClick: () => openEvaluation(
        evaluation,
        "detail",
        assignmentIdentity ?? resolveFallbackDetailIdentity(evaluation),
      ),
    })

    actions.push({
      label: text("interviewEvaluations.page.actions.editAssessment"),
      disabled: !canUpdate.value,
      onClick: () => goToEdit(evaluation.id),
    })

    actions.push({
      label: text("interviewEvaluations.list.actions.delete"),
      disabled: !canDelete.value,
      tone: "danger",
      onClick: () => handleDelete(evaluation),
    })
  }

  return actions
}

function formatDate(value: string | null) {
  return formatInterviewDateTimeDisplay(value)
}

function formatAverageScore(evaluation: InterviewEvaluation) {
  const average = numericAverageScore(evaluation)
  return average == null ? "-" : average.toFixed(2)
}

function toggleSort(key: string) {
  const nextKey = key as InterviewEvaluationsSortKey
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

function resolveCurrentUserAssignmentIdentity(evaluation: InterviewEvaluation) {
  const userId = currentUserId.value
  const email = currentUserEmail.value

  if (!userId && !email) {
    return null
  }

  const matchedResult = (Array.isArray(evaluation.interviewer_results) ? evaluation.interviewer_results : []).find(
    (result) => {
      const resultUserId = String(result?.interviewer?.user_id ?? "").trim()
      const resultEmail = String(result?.interviewer?.email ?? "").trim().toLowerCase()
      return (userId && resultUserId === userId) || (email && resultEmail === email)
    },
  )

  if (matchedResult) {
    return {
      interviewer_result_id: matchedResult.id,
      interviewer_user_id: matchedResult.interviewer.user_id,
      interviewer_email: matchedResult.interviewer.email ?? null,
      interviewer_label: matchedResult.interviewer.label || matchedResult.interviewer.name || "",
    }
  }

  const matchedRecipient = (Array.isArray(evaluation.interviewer_recipients) ? evaluation.interviewer_recipients : []).find(
    (recipient) => {
      const recipientUserId = String(recipient?.user_id ?? "").trim()
      const recipientEmail = String(recipient?.email ?? "").trim().toLowerCase()
      return (userId && recipientUserId === userId) || (email && recipientEmail === email)
    },
  )

  if (matchedRecipient) {
    return {
      interviewer_user_id: matchedRecipient.user_id,
      interviewer_email: matchedRecipient.email ?? null,
      interviewer_label: matchedRecipient.label || matchedRecipient.name || "",
    }
  }

  return null
}

function resolveFallbackDetailIdentity(evaluation: InterviewEvaluation) {
  const firstResult = Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results[0]
    : null

  if (firstResult) {
    return {
      interviewer_result_id: firstResult.id,
      interviewer_user_id: firstResult.interviewer.user_id,
      interviewer_email: firstResult.interviewer.email ?? null,
      interviewer_label: firstResult.interviewer.label || firstResult.interviewer.name || "",
    }
  }

  const firstRecipient = Array.isArray(evaluation.interviewer_recipients)
    ? evaluation.interviewer_recipients[0]
    : null

  if (firstRecipient) {
    return {
      interviewer_user_id: firstRecipient.user_id,
      interviewer_email: firstRecipient.email ?? null,
      interviewer_label: firstRecipient.label || firstRecipient.name || "",
    }
  }

  return {}
}
</script>
