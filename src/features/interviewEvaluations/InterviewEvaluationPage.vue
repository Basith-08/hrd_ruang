<template>
  <div class="flex w-full flex-col gap-4">
    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('interviewEvaluations.page.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('interviewEvaluations.page.title') }}
          </h1>
          <p class="app-dashboard-copy mt-3 max-w-2xl">
            {{ text('interviewEvaluations.page.description') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3 xl:flex-none">
          <AppActionLink
            v-if="canRead"
            to="/interview-evaluations"
            class="inline-flex min-h-11 items-center justify-center"
            :label="text('interviewEvaluations.page.actions.assessmentList')"
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

    <AppAlert :message="error || interviewerLoadError" />

    <section class="app-dashboard-panel">
      <div class="p-5">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div class="min-w-0 flex-1 max-w-2xl">
              <p v-if="isEditing" class="app-dashboard-eyebrow">
                {{ text('interviewEvaluations.page.help.editingExisting') }}
              </p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]" :class="{ '!mt-0': !isEditing }">
                {{ formSectionTitle }}
              </h2>
              <p class="app-dashboard-copy mt-1">
                {{ formSectionDescription }}
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton
                v-if="isEditing"
                class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
                variant="secondary"
                :label="text('interviewEvaluations.page.actions.cancelEdit')"
                @click="resetForm"
              />
            </div>
          </div>

          <form class="space-y-6" @submit.prevent="handleSubmit">
            <InterviewEvaluationFormFields
              :form="form"
              :selected-candidate="selectedCandidate"
              :candidate-select-options="candidateSelectOptions"
              :interviewer-select-options="interviewerSelectOptions"
              :interviewers-loading="interviewersLoading"
              :is-disabled="!canCreateOrUpdate"
              :loading="loading"
              :saving="saving"
              :show-assessment-fields="false"
              :text="text"
            />

            <div class="flex justify-end">
              <AppActionButton
                type="submit"
                data-testid="save-assessment"
                variant="primary"
                :disabled="!canCreateOrUpdate || saving || candidateSelectOptions.length === 0"
                :label="
                  saving
                    ? text('common.processing')
                    : isEditing
                      ? text('interviewEvaluations.page.actions.updateAssessment')
                      : text('interviewEvaluations.page.actions.saveAssessment')
                "
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import { useLocale } from '@/composables/useLocale'
import type { InterviewEvaluation } from '@/domain/entities/InterviewEvaluation'
import type { InterviewEvaluationRequest } from '@/domain/requests/InterviewEvaluationRequest'
import InterviewEvaluationFormFields from '@/features/interviewEvaluations/components/InterviewEvaluationFormFields.vue'
import type {
  InterviewEvaluationInterviewerSelectOption,
  InterviewEvaluationSelectOption,
} from '@/features/interviewEvaluations/types/InterviewEvaluationPage.type'
import { supabase } from '@/infrastructure/supabase/client'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppActionLink from '@/presentation/components/buttons/AppActionLink.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useInterviewEvaluationViewModel } from '@/viewmodels/useInterviewEvaluationViewModel'
import { createInterviewEvaluationFormState } from './InterviewEvaluationPage.state'
import { interviewEvaluationCriteria } from './interviewEvaluationSchema'

const route = useRoute()
const router = useRouter()
const appToast = useAppToast()
const { text } = useLocale()
const { hasPermission } = useAuthViewModel()
const { candidateOptions, create, error, interviewEvaluations, loading, refresh, saving, update } =
  useInterviewEvaluationViewModel({
    loadCandidateOptionsOnMounted: true,
    loadEvaluationsOnMounted: hasPermission('interview_evaluation:read'),
  })

const form = ref<InterviewEvaluationRequest>(createInterviewEvaluationFormState())
const selectedInterviewEvaluationId = ref<string | null>(null)
const baseInterviewerSelectOptions = ref<InterviewEvaluationInterviewerSelectOption[]>([])
const interviewersLoading = ref(false)
const interviewerLoadError = ref('')

const canRead = computed(() => hasPermission('interview_evaluation:read'))
const canCreate = computed(() => hasPermission('interview_evaluation:create'))
const canUpdate = computed(() => hasPermission('interview_evaluation:update'))
const canCreateOrUpdate = computed(() =>
  selectedInterviewEvaluationId.value ? canUpdate.value : canCreate.value,
)
const isEditing = computed(() => Boolean(selectedInterviewEvaluationId.value))
const selectedInterviewEvaluation = computed(
  () =>
    interviewEvaluations.value.find(
      (evaluation) => evaluation.id === selectedInterviewEvaluationId.value,
    ) ?? null,
)
const formSectionTitle = computed(() =>
  isEditing.value
    ? text('interviewEvaluations.page.actions.editAssessment')
    : text('interviewEvaluations.page.actions.newAssessment'),
)
const formSectionDescription = computed(() =>
  canCreateOrUpdate.value
    ? text('interviewEvaluations.page.help.canEdit')
    : text('interviewEvaluations.page.help.readOnly'),
)

function isCompletedCandidateOptionStatus(status: unknown) {
  return (
    String(status ?? '')
      .toLowerCase()
      .trim() === 'completed'
  )
}

function buildLegacySelectedCandidateOptionId(evaluationId: string) {
  return `legacy:${evaluationId}`
}

const legacySelectedCandidate = computed(() => {
  const evaluation = selectedInterviewEvaluation.value
  if (!evaluation?.id) {
    return null
  }

  const matchedCurrentCandidate = candidateOptions.value.find((candidate) => {
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

    return false
  })

  if (matchedCurrentCandidate) {
    return null
  }

  return {
    id: buildLegacySelectedCandidateOptionId(evaluation.id),
    candidate_name: evaluation.candidate_name,
    applied_position: evaluation.applied_position,
    employee_request_form_id: evaluation.employee_request_form_id,
    candidate_service_candidate_id: evaluation.candidate_service_candidate_id,
    candidate_service_application_id: evaluation.candidate_service_application_id,
    personal_email: null,
    phone_number: null,
    completion_status: 'completed',
    updated_at: evaluation.updated_at ?? evaluation.created_at ?? null,
  }
})

const candidateSelectOptions = computed(() => {
  const options = candidateOptions.value
    .filter((candidate) => isCompletedCandidateOptionStatus(candidate.completion_status))
    .map((candidate) => ({
      value: candidate.id,
      label: [candidate.candidate_name, candidate.applied_position].filter(Boolean).join(' - '),
    }))

  if (legacySelectedCandidate.value) {
    options.unshift({
      value: legacySelectedCandidate.value.id,
      label: [
        legacySelectedCandidate.value.candidate_name,
        legacySelectedCandidate.value.applied_position,
      ]
        .filter(Boolean)
        .join(' - '),
    })
  }

  return options
})

const interviewerSelectOptions = computed<InterviewEvaluationInterviewerSelectOption[]>(() => {
  const options = [...baseInterviewerSelectOptions.value]
  const selectedRecipients = (
    Array.isArray(form.value.interviewer_recipients) ? form.value.interviewer_recipients : []
  ).filter((recipient) => !String(recipient?.user_id ?? '').trim())

  for (const recipient of selectedRecipients) {
    const interviewerName = String(recipient.label || recipient.name || '').trim()
    const alreadyExists = options.some(
      (option) => option.value === interviewerName || option.label === interviewerName,
    )

    if (interviewerName && !alreadyExists) {
      options.unshift({
        value: interviewerName,
        label: interviewerName,
        user_id: '',
        name: interviewerName,
        email: null,
        job_level: null,
      })
    }
  }

  return options
})

const selectedCandidate = computed(
  () =>
    candidateOptions.value.find(
      (candidate) => candidate.id === form.value.selected_candidate_option_id,
    ) ??
    (legacySelectedCandidate.value?.id === form.value.selected_candidate_option_id
      ? legacySelectedCandidate.value
      : null),
)

function normalizeRoleName(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
}

function resolveProfileDisplayName(profile: Record<string, unknown>) {
  const fullName = String(profile.full_name ?? '').trim()
  const username = String(profile.username ?? '').trim()
  const email = String(profile.email ?? '').trim()

  return fullName || username || email
}

function resolveProfileDesignationName(profile: Record<string, unknown>) {
  return String(
    (profile.master_designation_ref as { name?: string } | null | undefined)?.name ?? '',
  ).trim()
}

function resolveProfileMainPosition(profile: Record<string, unknown>) {
  return String(profile.main_position ?? '').trim()
}

function resolveInterviewerOptionLabel(profile: Record<string, unknown>) {
  const displayName = resolveProfileDisplayName(profile)
  const position = resolveProfileMainPosition(profile) || resolveProfileDesignationName(profile)

  return [displayName, position].filter(Boolean).join(' - ')
}

async function loadInterviewerSelectOptions() {
  interviewersLoading.value = true
  interviewerLoadError.value = ''

  try {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select(`
        id, full_name, username, email, main_position,
        master_designation_ref:master_designation(name)
      `)

    if (profilesError) {
      throw new Error(profilesError.message)
    }

    const profileRows = (profiles ?? []) as Array<Record<string, unknown>>
    const profileIds = profileRows.map((profile) => String(profile.id ?? '').trim()).filter(Boolean)

    if (!profileIds.length) {
      baseInterviewerSelectOptions.value = []
      return
    }

    const { data: roleRows, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)')
      .in('user_id', profileIds)

    if (roleError) {
      throw new Error(roleError.message)
    }

    const blockedRoles = new Set(['super_admin', 'candidate', 'employee'])
    const roleMap = new Map<string, string>()

    for (const row of (roleRows ?? []) as Array<Record<string, unknown>>) {
      const roleName = normalizeRoleName((row.roles as { name?: string } | null | undefined)?.name)
      const userId = String(row.user_id ?? '').trim()

      if (userId && roleName) {
        roleMap.set(userId, roleName)
      }
    }

    baseInterviewerSelectOptions.value = profileRows
      .filter((profile) => !blockedRoles.has(roleMap.get(String(profile.id ?? '').trim()) ?? ''))
      .map((profile) => {
        const userId = String(profile.id ?? '').trim()
        const name = resolveProfileDisplayName(profile)
        const email = String(profile.email ?? '').trim() || null
        const jobLevel = resolveProfileDesignationName(profile) || null
        const label = resolveInterviewerOptionLabel(profile)

        return {
          value: userId,
          label,
          user_id: userId,
          name,
          email,
          job_level: jobLevel,
        }
      })
      .filter((option) => option.user_id && option.label.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (err) {
    interviewerLoadError.value =
      err instanceof Error
        ? err.message
        : text('interviewEvaluations.page.fields.loadInterviewersFailed')
  } finally {
    interviewersLoading.value = false
  }
}

function findCandidateOptionId(evaluation: InterviewEvaluation) {
  return (
    candidateOptions.value.find((candidate) => {
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
        (candidate.applied_position ?? '') === (evaluation.applied_position ?? '')
      )
    })?.id ?? buildLegacySelectedCandidateOptionId(evaluation.id)
  )
}

function startEdit(evaluation: InterviewEvaluation) {
  selectedInterviewEvaluationId.value = evaluation.id
  form.value = {
    notes: evaluation.notes ?? '',
    comments: evaluation.comments ?? '',
    interview_date: evaluation.interview_date,
    interviewer_name: evaluation.interviewer_name,
    interviewer_recipients: evaluation.interviewer_recipients ?? [],
    recommendation: evaluation.recommendation ?? '',
    scores: interviewEvaluationCriteria.map((criterion) => {
      const existingScore = evaluation.scores.find(
        (score) => score.item_number === criterion.number,
      )
      return {
        item_number: criterion.number,
        score: existingScore?.score ?? null,
        info: existingScore?.info ?? '',
      }
    }),
    selected_candidate_option_id: findCandidateOptionId(evaluation),
  }
}

function resetForm() {
  selectedInterviewEvaluationId.value = null
  form.value = createInterviewEvaluationFormState()
  if (route.query.edit) {
    router.replace({ path: '/interview-evaluations/manage', query: {} })
  }
}

async function handleSubmit() {
  const schedulePayload = {
    ...form.value,
    schedule_only: true,
  }

  try {
    if (selectedInterviewEvaluationId.value) {
      await update(selectedInterviewEvaluationId.value, schedulePayload)
      appToast.updated(text('interviewEvaluations.page.toasts.created'))
    } else {
      await create(schedulePayload)
      appToast.created(text('interviewEvaluations.page.toasts.created'))
    }

    resetForm()

    if (canRead.value) {
      await router.push({
        path: '/interview-evaluations',
      })
    }
  } catch {
    // Error state is already exposed by the viewmodel.
  }
}

watch(
  [() => route.query.edit, interviewEvaluations],
  ([editId]) => {
    const normalizedEditId = typeof editId === 'string' ? editId.trim() : ''
    if (!normalizedEditId) {
      return
    }

    const targetEvaluation =
      interviewEvaluations.value.find((evaluation) => evaluation.id === normalizedEditId) ?? null

    if (targetEvaluation) {
      startEdit(targetEvaluation)
    }
  },
  { immediate: true },
)

watch(
  () => route.query.edit,
  (editId) => {
    if (!editId && selectedInterviewEvaluationId.value) {
      resetForm()
    }
  },
)

onMounted(loadInterviewerSelectOptions)
</script>
