<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('interviewEvaluations.interviewer.evaluateEyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ pageTitle }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('interviewEvaluations.interviewer.evaluateDescription') }}
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
          <AppActionButton
            class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
            variant="secondary"
            :label="text('common.actions.back')"
            @click="goBack"
          />
        </div>
      </div>
    </section>

    <AppAlert :message="error" />

    <AppLoadingState
      v-if="loading || loadingEvaluation"
      :message="text('common.loading')"
    />

    <section
      v-else-if="selectedEvaluation"
      class="app-dashboard-panel"
    >
      <div class="p-5">
        <AppTabs
          v-model="activeTab"
          :tabs="tabs"
        />

        <div
          v-if="activeTab === 'candidate'"
          class="mt-6 space-y-6"
        >
          <template v-if="candidateForm">
            <section
              v-for="section in candidateDataSections"
              :key="section.key"
              class="space-y-3"
            >
              <h3 class="app-surface-title">{{ section.title }}</h3>
              <AppInfoGrid :fields="section.fields" />
            </section>

            <section
              v-for="section in candidateRepeatableSections"
              :key="section.key"
              class="space-y-3"
            >
              <h3 class="app-surface-title">{{ section.title }}</h3>
              <div
                v-if="section.items.length > 0"
                class="space-y-3"
              >
                <AppInfoGrid
                  v-for="(item, index) in section.items"
                  :key="`${section.key}-${index}`"
                  :fields="item"
                />
              </div>
              <p
                v-else
                class="app-state-card app-state-card-neutral app-helper-text px-4 py-3"
              >
                {{ text('interviewEvaluations.interviewer.candidateFields.noData') }}
              </p>
            </section>

            <CandidateFormDocumentSection
              title="Candidate Documents"
              :description="text('candidateForms.form.sections.candidateDocumentsDescription')"
              :text="text"
              :entries="candidateDocumentEntries"
              :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
              :on-open-file="handleOpenEmployeeDocumentFile"
              :opening-document-keys="openingEmployeeDocumentKeys"
              :get-document-open-key="getEmployeeDocumentOpenKey"
              :opening-document-label="text('candidateForms.form.sections.preparingDocument')"
            />
          </template>
          <AppAlert
            v-else
            variant="info"
            :message="text('interviewEvaluations.interviewer.candidateFields.noCandidateForm')"
          />
        </div>

        <div
          v-else
          class="mt-6"
        >
          <InterviewEvaluationScoreGrid
            :title="text('interviewEvaluations.page.grid.title')"
            :legend="text('interviewEvaluations.page.grid.legend')"
            :columns="scoreGridColumns"
            :score-rows="scoreRows"
            :score-value-options="scoreValueOptions"
            :is-disabled="isReadOnlyMode || saving"
            :select-score-label="text('interviewEvaluations.page.grid.selectScore')"
            :optional-note-label="text('interviewEvaluations.page.grid.optionalNote')"
            @update-score="updateScore"
            @update-score-info="updateScoreInfo"
          />

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <label class="space-y-2.5">
              <AppFieldLabel>
                {{ text('interviewEvaluations.page.fields.recommendation') }}
              </AppFieldLabel>
              <SearchableSelect
                :model-value="form.recommendation"
                :options="recommendationSelectOptions"
                :disabled="isReadOnlyMode || saving"
                :placeholder="text('interviewEvaluations.page.fields.recommendationSearchPlaceholder')"
                show-empty-option
                :empty-label="text('interviewEvaluations.page.fields.selectRecommendation')"
                @update:model-value="updateRecommendation"
              />
            </label>

            <div class="app-info-grid-item px-4 py-3">
              <p class="app-info-grid-label">
                {{ text("interviewEvaluations.page.averageScore") }}
              </p>
              <p class="app-copy-strong mt-2 text-2xl">
                {{ formattedAverageScore }}
              </p>
            </div>

            <label class="space-y-2.5 md:col-span-2">
              <AppFieldLabel>
                {{ text('interviewEvaluations.page.fields.comments') }}
              </AppFieldLabel>
              <AppTextarea
                :model-value="form.comments"
                rows="5"
                :disabled="isReadOnlyMode || saving"
                :placeholder="text('interviewEvaluations.page.fields.commentsPlaceholder')"
                @update:model-value="updateComments"
              />
            </label>
          </div>

          <div
            v-if="!isReadOnlyMode"
            class="mt-6 flex justify-end"
          >
            <AppActionButton
              variant="primary"
              :disabled="!canUpdate || saving || !selectedCandidateOptionId"
              :label="
                saving
                  ? text('common.processing')
                  : text('interviewEvaluations.interviewer.actions.saveEvaluation')
              "
              @click="handleSave"
            />
          </div>
        </div>
      </div>
    </section>

    <AppAlert
      v-else
      :message="text('interviewEvaluations.interviewer.notFound')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "#imports"

import { useLocale } from "@/composables/useLocale"
import {
  candidateEmployeeDocumentFieldKeys,
  employeeDocumentFieldLabels,
  type CandidateForm,
  type EmployeeDocumentFieldKey,
} from "@/domain/entities/CandidateForm"
import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
  InterviewEvaluationRecommendation,
} from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"
import { createInterviewEvaluationFormState } from "@/features/interviewEvaluations/InterviewEvaluationPage.state"
import CandidateFormDocumentSection from "@/features/candidateForms/components/CandidateFormDocumentSection.vue"
import type { CandidateFormEmployeeDocumentEntry } from "@/features/candidateForms/types/CandidateFormPage.type"
import InterviewEvaluationScoreGrid from "@/features/interviewEvaluations/components/InterviewEvaluationScoreGrid.vue"
import {
  interviewEvaluationCriteria,
  interviewEvaluationRecommendationOptions,
} from "@/features/interviewEvaluations/interviewEvaluationSchema"
import type { InterviewEvaluationScoreRow } from "@/features/interviewEvaluations/types/InterviewEvaluationPage.type"
import AppInfoGrid from "@/presentation/components/data/AppInfoGrid.vue"
import AppActionButton from "@/presentation/components/buttons/AppActionButton.vue"
import AppAlert from "@/presentation/components/feedback/AppAlert.vue"
import AppLoadingState from "@/presentation/components/feedback/AppLoadingState.vue"
import { useAppToast } from "@/presentation/components/feedback/useAppToast"
import AppFieldLabel from "@/presentation/components/forms/AppFieldLabel.vue"
import AppTextarea from "@/presentation/components/forms/AppTextarea.vue"
import SearchableSelect from "@/presentation/components/forms/SearchableSelect.vue"
import AppTabs from "@/presentation/components/navigation/AppTabs.vue"
import { callBackendApi } from "@/infrastructure/http/backendApi"
import { getPublicAppConfig } from "@/infrastructure/runtime/publicConfig"
import { formatDateDisplay } from "@/presentation/utils/dateFormat"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"
import { useInterviewerFormViewModel } from "@/viewmodels/useInterviewerFormViewModel"

const route = useRoute()
const router = useRouter()
const activeTab = ref("candidate")
const form = ref<InterviewEvaluationRequest>(createInterviewEvaluationFormState())
const selectedEvaluation = ref<InterviewEvaluation | null>(null)
const loadingEvaluation = ref(true)
const scoreValueOptions = Array.from({ length: 5 }, (_, index) => index + 1)

const appToast = useAppToast()
const { text } = useLocale()
const { employeeDocumentBucket } = getPublicAppConfig()
const { hasPermission } = useAuthViewModel()
const {
  candidateOptions,
  error,
  fetchAssignedEvaluation,
  loading,
  saveEvaluation,
  saving,
} = useInterviewerFormViewModel({
  loadAssignedOnMounted: false,
})

const canUpdate = computed(
  () =>
    hasPermission("interview_evaluation:update") ||
    hasPermission("interview_evaluation:interviewer_form"),
)
const openingEmployeeDocumentKeys = ref<string[]>([])
const isReadOnlyMode = computed(
  () => String(route.query.mode ?? '').trim().toLowerCase() === 'detail' || !canUpdate.value,
)
const evaluationId = computed(() => String(route.params.id ?? ""))
const selectedCandidateOptionId = computed(() =>
  selectedEvaluation.value
    ? findCandidateOptionId(selectedEvaluation.value, candidateOptions.value)
    : "",
)
const candidateForm = computed(() => selectedEvaluation.value?.candidate_form ?? null)
const pageTitle = computed(() =>
  selectedEvaluation.value
    ? text("interviewEvaluations.interviewer.evaluateTitle", { name: selectedEvaluation.value.candidate_name })
    : text("interviewEvaluations.interviewer.evaluateTitle", { name: "-" }),
)
const tabs = computed(() => [
  { value: "candidate", label: text("interviewEvaluations.interviewer.tabs.candidate") },
  { value: "assessment", label: text("interviewEvaluations.interviewer.tabs.assessment") },
])
const candidateDataSections = computed(() => {
  const candidate = candidateForm.value
  if (!candidate) return []

  return [
    {
      key: "application",
      title: text("candidateForms.form.sections.applicationData"),
      fields: [
        infoField("position", text("candidateForms.form.fields.positionAppliedFor"), candidate.employee_request_form?.main_position ?? selectedEvaluation.value?.applied_position),
        infoField("date_application", text("candidateForms.form.fields.applicationDate"), formatDateDisplay(candidate.date_application)),
        infoField("notice_period", text("candidateForms.form.fields.noticePeriod"), candidate.notice_period),
        infoField("available_start_date", text("candidateForms.form.fields.availableStartDate"), formatDateDisplay(candidate.available_start_date)),
        infoField("hire_location", text("candidateForms.form.fields.hireLocation"), candidate.hire_location),
      ],
    },
    {
      key: "personal",
      title: text("candidateForms.form.sections.personalData"),
      fields: [
        infoField("full_name", text("candidateForms.form.fields.fullNameRequired"), candidate.full_name ?? buildLegacyFullName(candidate)),
        infoField("gender", text("candidateForms.form.fields.gender"), candidate.gender),
        infoField("birth", text("candidateForms.form.fields.placeOfBirth"), candidate.place_of_birth),
        infoField("date_of_birth", text("candidateForms.form.fields.dateOfBirth"), formatDateDisplay(candidate.date_of_birth)),
        infoField("nationality", text("candidateForms.form.fields.nationality"), candidate.nationality),
        infoField("religion", text("candidateForms.form.fields.religion"), candidate.religion),
        infoField("marital_status", text("candidateForms.form.fields.maritalStatus"), candidate.marital_status),
        infoField("blood_type", text("candidateForms.form.fields.bloodType"), candidate.blood_type),
        infoField("ethnic", text("candidateForms.form.fields.ethnic"), candidate.ethnic),
      ],
    },
    {
      key: "contact",
      title: text("candidateForms.form.sections.contactIdentity"),
      fields: [
        infoField("id_card_address", text("candidateForms.form.fields.idCardAddress"), candidate.id_card_address),
        infoField("residential_address", text("candidateForms.form.fields.residentialAddress"), candidate.residential_address),
        infoField("email", text("candidateForms.form.fields.personalEmail"), candidate.personal_email),
        infoField("phone", text("candidateForms.form.fields.cellularPhone"), candidate.phone_number ?? candidate.home_phone),
        infoField("instagram", "Instagram", candidate.instagram),
        infoField("linkedin", "LinkedIn", candidate.linkedin),
        infoField("id_type", text("candidateForms.form.fields.idType"), candidate.id_type),
        infoField("id_no", text("candidateForms.form.fields.idNumber"), candidate.id_no),
      ],
    },
    {
      key: "mobility",
      title: text("candidateForms.form.sections.mobilityResidence"),
      fields: [
        infoField("transportation_type", text("candidateForms.form.labels.transportationType"), candidate.transportation_type),
        infoField("transportation_ownership", text("candidateForms.form.labels.transportationOwnership"), candidate.transportation_ownership),
        infoField("residence_ownership", text("candidateForms.form.labels.residenceOwnership"), candidate.residence_ownership),
      ],
    },
  ]
})
const candidateRepeatableSections = computed(() => {
  const candidate = candidateForm.value
  if (!candidate) return []

  return [
    {
      key: "family",
      title: text("candidateForms.form.sections.familyEmergency"),
      items: (candidate.family_and_emergency ?? []).map((item) => [
        infoField("category", text("candidateForms.form.labels.category"), item.category),
        infoField("relationship", text("candidateForms.form.labels.relationship"), item.relationship),
        infoField("name", text("candidateForms.form.labels.name"), item.name),
        infoField("gender", text("candidateForms.form.labels.gender"), item.gender),
        infoField("occupation", text("candidateForms.form.labels.occupation"), item.occupation),
        infoField(
          "place_and_date_of_birth",
          text("candidateForms.form.labels.placeAndDateOfBirth"),
          item.place_and_date_of_birth,
        ),
        infoField("education", text("candidateForms.form.labels.education"), item.education),
        infoField("remarks", text("candidateForms.form.labels.remarks"), item.remarks),
        infoField("description", text("candidateForms.form.labels.description"), item.description),
      ]),
    },
    {
      key: "education",
      title: text("candidateForms.form.sections.educationTraining"),
      items: (candidate.education ?? []).map((item) => {
        const fields = [
          infoField("category", text("candidateForms.form.labels.category"), item.category),
          infoField("level", text("candidateForms.form.labels.education"), item.level),
          infoField("institution", text("candidateForms.form.labels.institution"), item.institution),
        ]

        if (shouldShowEducationMajor(item.category)) {
          fields.push(infoField("major", "Major", item.major))
        }

        fields.push(infoField("year", "Year", formatYearRange(item.from_year, item.to_year)))

        return fields
      }),
    },
    {
      key: "work",
      title: text("candidateForms.form.sections.employmentHistory"),
      items: (candidate.work_history ?? []).map((item) => [
        infoField("company", text("candidateForms.form.labels.company"), item.company),
        infoField("position", text("candidateForms.form.labels.position"), item.position),
        infoField("year", "Year", formatYearRange(item.from_year, item.to_year)),
        infoField("reason", text("candidateForms.form.labels.reasonForLeaving"), item.reason_to_quitting),
      ]),
    },
    {
      key: "languages",
      title: text("candidateForms.form.sections.foreignLanguage"),
      items: (candidate.candidate_languages ?? []).map((item) => [
        infoField("language", text("candidateForms.form.labels.language"), item.language_name),
        infoField("speaking", text("candidateForms.form.labels.speaking"), item.speaking),
        infoField("reading", text("candidateForms.form.labels.reading"), item.reading),
        infoField("listening", text("candidateForms.form.labels.listening"), item.listening),
        infoField("writing", text("candidateForms.form.labels.writing"), item.writing),
      ]),
    },
    {
      key: "skills",
      title: text("candidateForms.form.sections.otherRelevantSkills"),
      items: (candidate.candidate_skills ?? []).map((item) => [
        infoField("skill", "Skill", item.skill_name),
        infoField("description", text("candidateForms.form.labels.skillDescription"), item.description),
      ]),
    },
    {
      key: "references",
      title: text("candidateForms.form.sections.referenceData"),
      items: (candidate.candidate_references ?? []).map((item) => [
        infoField("name", text("candidateForms.form.labels.name"), item.name),
        infoField("relationship", text("candidateForms.form.labels.relationship"), item.relationship),
        infoField("position", text("candidateForms.form.labels.position"), item.position),
        infoField("phone", text("interviewEvaluations.interviewer.candidateFields.phone"), item.phone_number),
      ]),
    },
  ]
})
const candidateDocumentEntries = computed<CandidateFormEmployeeDocumentEntry[]>(() => {
  const candidate = candidateForm.value

  return candidateEmployeeDocumentFieldKeys.map((documentType) => ({
    documentType,
    label: getEmployeeDocumentLabel(documentType),
    files: candidate?.employee_documents?.[documentType] ?? [],
  }))
})
const recommendationSelectOptions = computed(() =>
  interviewEvaluationRecommendationOptions.map((option) => ({
    value: option.code,
    label: text(option.labelKey),
  })),
)
const scoreGridColumns = computed(() => [
  { key: "number", label: text("common.labels.no"), width: "w-14" },
  {
    key: "category",
    label: text("interviewEvaluations.page.grid.headers.category"),
    minWidth: "min-w-[180px]",
  },
  {
    key: "description",
    label: text("interviewEvaluations.page.grid.headers.description"),
    minWidth: "min-w-[340px]",
  },
  {
    key: "score",
    label: text("interviewEvaluations.page.grid.headers.score"),
    minWidth: "min-w-[130px]",
  },
  {
    key: "info",
    label: text("interviewEvaluations.page.grid.headers.info"),
    minWidth: "min-w-[220px]",
  },
])
const scoreRows = computed<InterviewEvaluationScoreRow[]>(() =>
  interviewEvaluationCriteria.map((criterion) => {
    const scoreEntry = form.value.scores.find((item) => item.item_number === criterion.number) ?? null

    return {
      description: text(criterion.descriptionKey),
      info: scoreEntry?.info ?? "",
      item_number: criterion.number,
      note: criterion.noteKey ? text(criterion.noteKey) : "",
      score: scoreEntry?.score ?? null,
      title: text(criterion.titleKey),
    }
  }),
)
const formattedAverageScore = computed(() => formatAverageScore(form.value.scores))

onMounted(loadEvaluation)

watch(evaluationId, loadEvaluation)

watch(selectedEvaluation, (evaluation) => {
  const selectedInterviewerEvaluation = evaluation
    ? selectInterviewerEvaluationByRoute(evaluation)
    : null

  if (!selectedInterviewerEvaluation) {
    form.value = createInterviewEvaluationFormState()
    return
  }

  form.value = {
    notes: selectedInterviewerEvaluation.notes ?? "",
    comments: selectedInterviewerEvaluation.comments ?? "",
    interview_date: selectedInterviewerEvaluation.interview_date,
    interviewer_name: selectedInterviewerEvaluation.interviewer_name,
    interviewer_recipients: selectedInterviewerEvaluation.interviewer_recipients ?? [],
    recommendation: selectedInterviewerEvaluation.recommendation ?? "",
    scores: interviewEvaluationCriteria.map((criterion) => {
      const existingScore = selectedInterviewerEvaluation.scores.find((score) => score.item_number === criterion.number)

      return {
        item_number: criterion.number,
        score: existingScore?.score ?? null,
        info: existingScore?.info ?? "",
      }
    }),
    selected_candidate_option_id: findCandidateOptionId(selectedInterviewerEvaluation, candidateOptions.value),
  }
}, { immediate: true })

async function loadEvaluation() {
  loadingEvaluation.value = true

  if (!evaluationId.value) {
    selectedEvaluation.value = null
    loadingEvaluation.value = false
    return
  }

  try {
    selectedEvaluation.value = await fetchAssignedEvaluation(evaluationId.value)
  } catch {
    selectedEvaluation.value = null
  } finally {
    loadingEvaluation.value = false
  }
}

function goBack() {
  router.push({ path: "/interview-evaluations" })
}

function normalizeRouteText(value: unknown) {
  return String(value ?? "").trim()
}

function selectInterviewerEvaluationByRoute(evaluation: InterviewEvaluation): InterviewEvaluation {
  const resultId = normalizeRouteText(route.query.interviewer_result_id)
  const interviewerUserId = normalizeRouteText(route.query.interviewer_user_id)
  const interviewerEmail = normalizeRouteText(route.query.interviewer_email).toLowerCase()
  const interviewerLabel = normalizeRouteText(route.query.interviewer_label)

  const interviewerResults = Array.isArray(evaluation.interviewer_results)
    ? evaluation.interviewer_results
    : []

  const matchedResult = interviewerResults.find((result) => {
    if (resultId && String(result?.id ?? "").trim() === resultId) {
      return true
    }

    if (interviewerUserId && String(result?.interviewer?.user_id ?? "").trim() === interviewerUserId) {
      return true
    }

    if (interviewerEmail && String(result?.interviewer?.email ?? "").trim().toLowerCase() === interviewerEmail) {
      return true
    }

    if (
      interviewerLabel &&
      interviewerLabel === String(result?.interviewer?.label || result?.interviewer?.name || "").trim()
    ) {
      return true
    }

    return false
  })

  if (matchedResult) {
    return {
      ...evaluation,
      interviewer_name: matchedResult.interviewer.label || matchedResult.interviewer.name || evaluation.interviewer_name,
      comments: matchedResult.comments,
      recommendation: matchedResult.recommendation,
      scores: Array.isArray(matchedResult.scores) ? matchedResult.scores : [],
    }
  }

  const matchedRecipient = (Array.isArray(evaluation.interviewer_recipients) ? evaluation.interviewer_recipients : []).find(
    (recipient) => {
      if (interviewerUserId && String(recipient?.user_id ?? "").trim() === interviewerUserId) {
        return true
      }

      if (interviewerEmail && String(recipient?.email ?? "").trim().toLowerCase() === interviewerEmail) {
        return true
      }

      if (
        interviewerLabel &&
        interviewerLabel === String(recipient?.label || recipient?.name || "").trim()
      ) {
        return true
      }

      return false
    },
  )

  if (matchedRecipient) {
    return {
      ...evaluation,
      interviewer_name: String(matchedRecipient.label || matchedRecipient.name || evaluation.interviewer_name).trim(),
      comments: null,
      recommendation: null,
      scores: [],
    }
  }

  return evaluation
}

function resolveRecommendationValue(
  value: unknown,
): InterviewEvaluationRecommendation | "" {
  return typeof value === "string" ? value as InterviewEvaluationRecommendation | "" : ""
}

function formatAverageScore(scores: Array<{ score: number | null }>) {
  const validScores = scores
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score) && score > 0)

  if (!validScores.length) return "-"

  const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
  return average.toFixed(2)
}

function infoField(key: string, label: string, value: unknown) {
  return {
    key,
    label,
    value: formatInfoValue(value),
  }
}

function shouldShowEducationMajor(category: CandidateForm["education"][number]["category"]) {
  return String(category ?? "").trim() !== "Formal Education"
}

function formatInfoValue(value: unknown) {
  const normalizedValue = String(value ?? "").trim()
  return normalizedValue || "-"
}

function formatYearRange(fromYear: number | null, toYear: number | null) {
  return [fromYear, toYear].filter((value) => value !== null && value !== undefined).join(" - ") || "-"
}

function buildLegacyFullName(candidate: CandidateForm) {
  return [candidate.first_name, candidate.middle_name, candidate.last_name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
}

function getEmployeeDocumentLabel(documentType: EmployeeDocumentFieldKey) {
  switch (documentType) {
    case "cv":
      return "CV"
    case "identity_card":
      return text("candidateForms.form.employeeDocuments.labels.identityCard")
    case "family_card":
      return text("candidateForms.form.employeeDocuments.labels.familyCard")
    case "latest_diploma":
      return text("candidateForms.form.employeeDocuments.labels.latestDiploma")
    case "academic_transcript":
      return text("candidateForms.form.employeeDocuments.labels.academicTranscript")
    case "certificate_of_employment":
      return text("candidateForms.form.employeeDocuments.labels.certificateOfEmployment")
    default:
      return employeeDocumentFieldLabels[documentType] ?? "Document"
  }
}

function getReadableEmployeeDocumentFileName(documentType: EmployeeDocumentFieldKey, path: string) {
  const rawName = String(path ?? "").split("/").pop() || String(path ?? "")
  const extensionMatch = rawName.match(/(\.[a-z0-9]+)$/i)
  const extension = extensionMatch?.[1] ?? ""
  const baseName = extension ? rawName.slice(0, -extension.length) : rawName
  const normalizedType = String(documentType ?? "").trim().toLowerCase()
  const contextLabel = getEmployeeDocumentLabel(documentType)

  let readableBaseName = baseName
    .replace(new RegExp(`^${normalizedType}[-_ ]*`, "i"), "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "")
    .replace(/\bcandidate[-_ ]?form\b/gi, "")
    .replace(/\bemployee[-_ ]?forms?\b/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (/^[a-z0-9]{5,14}$/i.test(readableBaseName)) {
    readableBaseName = ""
  }

  if (readableBaseName.length > 42) {
    readableBaseName = readableBaseName.slice(0, 42).trim()
  }

  return `${readableBaseName || contextLabel}${extension}`
}

function getEmployeeDocumentOpenKey(documentType: EmployeeDocumentFieldKey, path: string) {
  return `${documentType}:${String(path ?? '').trim()}`
}

async function createEmployeeDocumentSignedUrl(path: string) {
  const normalizedPath = String(path ?? "").trim()
  if (!normalizedPath || !selectedEvaluation.value?.id) {
    throw new Error("Document path is missing.")
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath
  }

  const payload = await callBackendApi<{ signed_url?: string }>(
    `/api/interview-evaluations/assigned/${selectedEvaluation.value.id}/documents/sign-url`,
    {
      method: "POST",
      body: JSON.stringify({
        bucket: employeeDocumentBucket,
        path: normalizedPath,
      }),
    },
  )

  if (!payload.signed_url) {
    throw new Error("Unable to open document.")
  }

  return payload.signed_url
}

async function handleOpenEmployeeDocumentFile(
  documentType: EmployeeDocumentFieldKey,
  path: string,
) {
  const documentOpenKey = getEmployeeDocumentOpenKey(documentType, path)
  if (openingEmployeeDocumentKeys.value.includes(documentOpenKey)) {
    return
  }

  openingEmployeeDocumentKeys.value = [...openingEmployeeDocumentKeys.value, documentOpenKey]

  try {
    const url = await createEmployeeDocumentSignedUrl(path)
    window.open(url, "_blank", "noopener,noreferrer")
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to open document."
    appToast.error(message)
  } finally {
    openingEmployeeDocumentKeys.value = openingEmployeeDocumentKeys.value
      .filter((pendingKey) => pendingKey !== documentOpenKey)
  }
}

function findCandidateOptionId(
  evaluation: InterviewEvaluation,
  options: InterviewEvaluationCandidateOption[],
) {
  return (
    options.find((candidate) => {
      if (
        candidate.candidate_service_application_id &&
        candidate.candidate_service_application_id === evaluation.candidate_service_application_id
      ) {
        return true
      }

      if (
        candidate.candidate_service_candidate_id &&
        candidate.candidate_service_candidate_id === evaluation.candidate_service_candidate_id
      ) {
        return true
      }

      return (
        candidate.candidate_name === evaluation.candidate_name &&
        (candidate.applied_position ?? "") === (evaluation.applied_position ?? "")
      )
    })?.id ?? ""
  )
}

function updateRecommendation(value: unknown) {
  if (isReadOnlyMode.value) {
    return
  }

  form.value.recommendation = resolveRecommendationValue(value)
}

function updateComments(value: string) {
  if (isReadOnlyMode.value) {
    return
  }

  form.value.comments = value
}

function updateScore(itemNumber: number, event: Event) {
  if (isReadOnlyMode.value) {
    return
  }

  const value = Number((event.target as HTMLSelectElement | null)?.value ?? 0)
  const score = Number.isFinite(value) && value > 0 ? value : null
  const row = form.value.scores.find((item) => item.item_number === itemNumber)

  if (row) {
    row.score = score
  }
}

function updateScoreInfo(itemNumber: number, value: string) {
  if (isReadOnlyMode.value) {
    return
  }

  const row = form.value.scores.find((item) => item.item_number === itemNumber)

  if (row) {
    row.info = value
  }
}

async function handleSave() {
  if (isReadOnlyMode.value || !selectedEvaluation.value || !selectedCandidateOptionId.value) return

  try {
    await saveEvaluation(selectedEvaluation.value.id, {
      ...form.value,
      selected_candidate_option_id: selectedCandidateOptionId.value,
    })
    appToast.updated(text("interviewEvaluations.page.toasts.created"))
  } catch {
    // Error is already exposed by the viewmodel.
  }
}
</script>

<style scoped>
:global(.candidate-form-document-grid) {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:global(.candidate-form-document-card) {
  border-radius: 0.75rem;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface-muted);
  padding: 1rem;
}

:global(.candidate-form-document-card__header) {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;
}

:global(.candidate-form-document-count) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 1.5rem;
  border-radius: 999px;
  background: var(--app-color-accent-soft);
  color: var(--app-color-accent-strong);
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

:global(.candidate-form-document-chip-list) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  list-style: none;
  padding: 0;
}

:global(.candidate-form-document-chip) {
  display: inline-flex;
  max-width: 100%;
  border-radius: 999px;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
  padding: 0.38rem 0.72rem;
  word-break: break-word;
}

@media (max-width: 768px) {
  :global(.candidate-form-document-grid) {
    grid-template-columns: 1fr;
  }
}
</style>
