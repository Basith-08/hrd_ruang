<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('interviewEvaluations.interviewer.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('interviewEvaluations.interviewer.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('interviewEvaluations.interviewer.description') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3 xl:flex-none">
          <AppActionLink
            v-if="canReadList"
            to="/interview-evaluations/list"
            class="inline-flex min-h-11 items-center justify-center"
            :label="text('interviewEvaluations.interviewer.actions.openAssessmentList')"
          />
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :disabled="loading"
            :loading="loading"
            :label="loading ? text('common.refreshing') : text('common.actions.refresh')"
            @click="refresh"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />
    <AppLoadingOverlay
      v-if="openingAssignment"
      :message="text('common.loadingData')"
    />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
          <div class="min-w-0 flex-1 max-w-2xl">
            <h2 class="app-dashboard-title !mt-0 !text-[1.15rem]">
              {{ text("interviewEvaluations.interviewer.assignmentTableTitle") }}
            </h2>
            <p class="app-dashboard-copy mt-1">
              {{ text("interviewEvaluations.interviewer.assignmentTableDescription") }}
            </p>
          </div>

          <label class="block xl:w-[420px] xl:flex-none">
            <span class="app-fieldset-label mb-1.5 block">
              {{ text('common.labels.search') }}
            </span>
            <AppSearchInput
              v-model="searchQuery"
              :placeholder="text('interviewEvaluations.interviewer.searchPlaceholder')"
              class="w-full"
            />
          </label>
        </div>
      </div>

      <InterviewerAssignmentTable
        v-model:page="page"
        :items="paginatedAssignments"
        :loading="loading"
        :page-size="pageSize"
        :total-items="filteredAssignments.length"
        :show-interviewer-column="showInterviewerColumn"
        :candidate-label="text('interviewEvaluations.list.headers.candidate')"
        :position-label="text('interviewEvaluations.list.headers.position')"
        :interviewer-label="text('interviewEvaluations.list.headers.interviewer')"
        :interview-date-label="text('interviewEvaluations.list.headers.interviewDate')"
        :flow-status-label="'Flow Status'"
        :assessment-status-label="'Assessment Status'"
        :actions-label="text('interviewEvaluations.list.headers.actions')"
        :pending-label="text('interviewEvaluations.interviewer.status.pending')"
        :completed-label="text('interviewEvaluations.interviewer.status.completed')"
        :empty-message="text('interviewEvaluations.interviewer.noAssignments')"
        :row-number="rowNumber"
        :is-completed-evaluation="isCompletedEvaluation"
        :resolve-flow-stage="resolveFlowStage"
        :recruitment-flow-stage-badge-class="recruitmentFlowStageBadgeClass"
        :recruitment-flow-stage-label="recruitmentFlowStageLabel"
        :format-date-display="formatInterviewDateTimeDisplay"
        :action-label="actionLabel"
        :can-open-assignment="canOpenAssignment"
        :open-assignment="openAssignment"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "#imports"

import { useLocale } from "@/composables/useLocale"
import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"
import { interviewEvaluationCriteria } from "@/features/interviewEvaluations/interviewEvaluationSchema"
import InterviewerAssignmentTable from "@/features/interviewEvaluations/components/InterviewerAssignmentTable.vue"
import AppActionButton from "@/presentation/components/buttons/AppActionButton.vue"
import AppActionLink from "@/presentation/components/buttons/AppActionLink.vue"
import AppAlert from "@/presentation/components/feedback/AppAlert.vue"
import AppLoadingOverlay from "@/presentation/components/feedback/AppLoadingOverlay.vue"
import AppSearchInput from "@/presentation/components/forms/AppSearchInput.vue"
import {
  recruitmentFlowStageBadgeClass,
  recruitmentFlowStageLabel,
  resolveRecruitmentFlowStage,
} from "@/domain/utils/recruitmentFlowStage"
import { formatInterviewDateTimeDisplay } from "@/presentation/utils/dateFormat"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import { useInterviewerFormViewModel } from "@/viewmodels/useInterviewerFormViewModel"

type InterviewerAssignmentRow = InterviewEvaluation & {
  evaluation_id: string
  interviewer_display: string
  interviewer_result_id?: string
  interviewer_user_id?: string
  interviewer_email?: string | null
  interviewer_label?: string
}

const pageSize = 10
const page = ref(1)
const searchQuery = ref("")
const openingAssignment = ref(false)

const router = useRouter()
const { text } = useLocale()
const { hasPermission } = useAuthViewModel()
const {
  assignedEvaluations,
  error,
  loading,
  refresh,
} = useInterviewerFormViewModel({
  loadCandidateOptionsOnMounted: false,
})

const canReadList = computed(() => hasPermission("interview_evaluation:read"))
const canEvaluate = computed(() => hasPermission("interview_evaluation:interviewer_form"))
const canOpenAssignment = computed(() => canEvaluate.value || canReadList.value)
const actionLabel = computed(() =>
  canEvaluate.value
    ? text('interviewEvaluations.interviewer.actions.evaluate')
    : text('common.actions.detail'),
)
const actionMode = computed<'evaluate' | 'detail'>(() => (canEvaluate.value ? 'evaluate' : 'detail'))
const showInterviewerColumn = computed(() => !canEvaluate.value)
const assignmentRows = computed<InterviewerAssignmentRow[]>(() =>
  assignedEvaluations.value.flatMap((evaluation) => mapAssignmentRowsByInterviewer(evaluation)),
)

const filteredAssignments = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return assignmentRows.value
  }

  return assignmentRows.value.filter((evaluation) =>
    [
      evaluation.candidate_name,
      evaluation.applied_position,
      evaluation.interviewer_display,
      recruitmentFlowStageLabel(resolveFlowStage(evaluation)),
      evaluation.interview_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssignments.value.length / pageSize)))

const paginatedAssignments = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const startIndex = (safePage - 1) * pageSize
  return filteredAssignments.value.slice(startIndex, startIndex + pageSize)
})

watch(searchQuery, () => {
  page.value = 1
})

watch(
  () => filteredAssignments.value.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)
function rowNumber(index: number) {
  return (page.value - 1) * pageSize + index + 1
}

async function openAssignment(evaluation: InterviewEvaluation) {
  if (!canOpenAssignment.value) {
    return
  }

  const assignmentRow = evaluation as InterviewerAssignmentRow
  const query: Record<string, string> = {}
  if (actionMode.value === 'detail') {
    query.mode = 'detail'
  }
  if (assignmentRow.interviewer_result_id) {
    query.interviewer_result_id = assignmentRow.interviewer_result_id
  } else if (assignmentRow.interviewer_user_id) {
    query.interviewer_user_id = assignmentRow.interviewer_user_id
  } else if (assignmentRow.interviewer_email) {
    query.interviewer_email = assignmentRow.interviewer_email
  } else if (assignmentRow.interviewer_label) {
    query.interviewer_label = assignmentRow.interviewer_label
  }

  openingAssignment.value = true

  try {
    await router.push({
      path: `/interview-evaluations/evaluate/${encodeURIComponent(
        assignmentRow.evaluation_id || evaluation.id,
      )}`,
      query,
    })
  } finally {
    openingAssignment.value = false
  }
}

function resolveFlowStage(evaluation: InterviewEvaluation) {
  if (evaluation.recruitment_flow_stage) {
    return evaluation.recruitment_flow_stage
  }

  return resolveRecruitmentFlowStage({
    employeeRequestForm: {
      id: String(evaluation.employee_request_form_id ?? ''),
      recruitment_flow_stage: evaluation.recruitment_flow_stage ?? null,
    },
  })
}

function isCompletedEvaluation(evaluation: InterviewEvaluation) {
  if (typeof evaluation.is_completed === "boolean") {
    return evaluation.is_completed
  }

  const hasAllScores = interviewEvaluationCriteria.every((criterion) => {
    const score = evaluation.scores.find((item) => item.item_number === criterion.number)?.score
    return Number.isFinite(Number(score)) && Number(score) > 0
  })

  return hasAllScores && Boolean(evaluation.recommendation)
}

function mapAssignmentRowsByInterviewer(evaluation: InterviewEvaluation): InterviewerAssignmentRow[] {
  if (canEvaluate.value && !canReadList.value) {
    return [
      {
        ...evaluation,
        evaluation_id: evaluation.id,
        interviewer_display: evaluation.interviewer_name || "-",
      },
    ]
  }

  const interviewerResults = (Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results
    : []
  ).filter((result) =>
    [result?.id, result?.interviewer?.user_id, result?.interviewer?.label, result?.interviewer?.name]
      .map((value) => String(value ?? "").trim())
      .some(Boolean),
  )

  if (interviewerResults.length > 0) {
    return interviewerResults.map((result, index) => ({
      ...evaluation,
      id: `${evaluation.id}:result:${result.id || index + 1}`,
      evaluation_id: evaluation.id,
      interviewer_result_id: result.id,
      interviewer_user_id: result.interviewer.user_id,
      interviewer_email: result.interviewer.email ?? null,
      interviewer_label: result.interviewer.label || result.interviewer.name || "",
      interviewer_name: result.interviewer.label || result.interviewer.name,
      interviewer_display: result.interviewer.label || result.interviewer.name || "-",
      comments: result.comments,
      recommendation: result.recommendation,
      scores: result.scores,
      is_completed: isCompletedEvaluationByScores(result.scores, result.recommendation),
    }))
  }

  const recipients = (Array.isArray(evaluation.interviewer_recipients)
    ? evaluation.interviewer_recipients
    : []
  ).filter((recipient) =>
    [recipient?.user_id, recipient?.label, recipient?.name, recipient?.email]
      .map((value) => String(value ?? "").trim())
      .some(Boolean),
  )

  if (recipients.length > 0) {
    return recipients.map((recipient, index) => ({
      ...evaluation,
      id: `${evaluation.id}:recipient:${recipient.user_id || index + 1}`,
      evaluation_id: evaluation.id,
      interviewer_user_id: String(recipient.user_id ?? "").trim(),
      interviewer_email: recipient.email ?? null,
      interviewer_label: String(recipient.label || recipient.name || "").trim(),
      interviewer_name: recipient.label || recipient.name,
      interviewer_display: recipient.label || recipient.name || "-",
      comments: null,
      recommendation: null,
      scores: [],
      is_completed: false,
    }))
  }

  return [
    {
      ...evaluation,
      id: `${evaluation.id}:0`,
      evaluation_id: evaluation.id,
      interviewer_display: evaluation.interviewer_name || "-",
      is_completed: false,
    },
  ]
}

function isCompletedEvaluationByScores(
  scores: InterviewEvaluation["scores"],
  recommendation: InterviewEvaluation["recommendation"],
) {
  const hasAllScores = interviewEvaluationCriteria.every((criterion) => {
    const score = scores.find((item) => item.item_number === criterion.number)?.score
    return Number.isFinite(Number(score)) && Number(score) > 0
  })

  return hasAllScores && Boolean(recommendation)
}

</script>
