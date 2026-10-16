import { onMounted, ref } from "vue"

import { useAppRepositories } from "@/composables/useAppRepositories"
import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"
import { getAssignedInterviewEvaluations } from "@/application/usecases/getAssignedInterviewEvaluations"
import { getAssignedInterviewEvaluation } from "@/application/usecases/getAssignedInterviewEvaluation"
import { getInterviewEvaluationCandidateOptions } from "@/application/usecases/getInterviewEvaluationCandidateOptions"
import { updateInterviewEvaluation } from "@/application/usecases/updateInterviewEvaluation"
import { translateText } from "@/composables/useLocale"

interface UseInterviewerFormViewModelOptions {
  loadAssignedOnMounted?: boolean
  loadCandidateOptionsOnMounted?: boolean
}

export function useInterviewerFormViewModel(
  options: UseInterviewerFormViewModelOptions = {},
) {
  const { interviewEvaluationRepo } = useAppRepositories()
  const loadAssignedOnMounted = options.loadAssignedOnMounted ?? true
  const loadCandidateOptionsOnMounted = options.loadCandidateOptionsOnMounted ?? true
  const assignedEvaluations = ref<InterviewEvaluation[]>([])
  const candidateOptions = ref<InterviewEvaluationCandidateOption[]>([])
  const loading = ref(loadAssignedOnMounted || loadCandidateOptionsOnMounted)
  const saving = ref(false)
  const error = ref("")

  async function refresh() {
    loading.value = true
    error.value = ""

    try {
      const [evaluations, candidates] = await Promise.all([
        loadAssignedOnMounted
          ? getAssignedInterviewEvaluations(interviewEvaluationRepo)
          : Promise.resolve(assignedEvaluations.value),
        loadCandidateOptionsOnMounted
          ? getInterviewEvaluationCandidateOptions(interviewEvaluationRepo)
          : Promise.resolve(candidateOptions.value),
      ])

      assignedEvaluations.value = evaluations
      candidateOptions.value = candidates
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : translateText("interviewEvaluations.interviewer.loadFailed")
    } finally {
      loading.value = false
    }
  }

  async function fetchAssignedEvaluation(id: string) {
    loading.value = true
    error.value = ""

    try {
      return await getAssignedInterviewEvaluation(interviewEvaluationRepo, id)
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : translateText("interviewEvaluations.interviewer.loadFailed")
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveEvaluation(id: string, payload: InterviewEvaluationRequest) {
    saving.value = true
    error.value = ""

    try {
      await updateInterviewEvaluation(interviewEvaluationRepo, id, payload)
      await refresh()
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : translateText("interviewEvaluations.updateFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(refresh)

  return {
    assignedEvaluations,
    candidateOptions,
    error,
    fetchAssignedEvaluation,
    loading,
    refresh,
    saveEvaluation,
    saving,
  }
}
