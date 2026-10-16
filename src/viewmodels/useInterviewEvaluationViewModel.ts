import { computed, onMounted, ref } from "vue"

import { useAppRepositories } from "@/composables/useAppRepositories"
import { createResourceCache, isResourceCacheFresh, refreshResourceCache } from "@/composables/useResourceCache"
import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"
import { createInterviewEvaluation } from "@/application/usecases/createInterviewEvaluation"
import { deleteInterviewEvaluation } from "@/application/usecases/deleteInterviewEvaluation"
import { getInterviewEvaluationCandidateOptions } from "@/application/usecases/getInterviewEvaluationCandidateOptions"
import { getInterviewEvaluations } from "@/application/usecases/getInterviewEvaluations"
import { updateInterviewEvaluation } from "@/application/usecases/updateInterviewEvaluation"
import { translateText } from "@/composables/useLocale"

interface UseInterviewEvaluationViewModelOptions {
  loadCandidateOptionsOnMounted?: boolean
  loadEvaluationsOnMounted?: boolean
}

// Shared by every page that lists interview evaluations (Interview Evaluation List, the
// recruitment "Interview Evaluasi" page, the schedule form, etc.) so navigating away and back
// re-shows cached data instantly instead of refetching. TTL comes from the global cache config.
const evaluationsCache = createResourceCache<InterviewEvaluation[]>([])
const candidateOptionsCache = createResourceCache<InterviewEvaluationCandidateOption[]>([])

export function useInterviewEvaluationViewModel(
  options: UseInterviewEvaluationViewModelOptions = {},
) {
  const { interviewEvaluationRepo } = useAppRepositories()
  const loadEvaluationsOnMounted = options.loadEvaluationsOnMounted ?? true
  const loadCandidateOptionsOnMounted = options.loadCandidateOptionsOnMounted ?? true
  const interviewEvaluations = evaluationsCache.data
  const candidateOptions = candidateOptionsCache.data
  const loading = computed(
    () => evaluationsCache.loading.value || candidateOptionsCache.loading.value,
  )
  const saving = ref(false)
  const mutationError = ref("")
  const error = computed(() =>
    mutationError.value || evaluationsCache.error.value || candidateOptionsCache.error.value,
  )

  async function refreshEvaluations() {
    return refreshResourceCache(
      evaluationsCache,
      () => getInterviewEvaluations(interviewEvaluationRepo),
      translateText("interviewEvaluations.loadFailed"),
    )
  }

  async function refreshCandidateOptions() {
    return refreshResourceCache(
      candidateOptionsCache,
      () => getInterviewEvaluationCandidateOptions(interviewEvaluationRepo),
      translateText("interviewEvaluations.loadFailed"),
    )
  }

  async function refresh() {
    const tasks: Promise<void>[] = []
    if (loadEvaluationsOnMounted) {
      tasks.push(refreshEvaluations())
    }
    if (loadCandidateOptionsOnMounted) {
      tasks.push(refreshCandidateOptions())
    }

    if (!tasks.length) {
      return
    }

    await Promise.all(tasks)
  }

  async function create(payload: InterviewEvaluationRequest) {
    saving.value = true
    mutationError.value = ""
    try {
      await createInterviewEvaluation(interviewEvaluationRepo, payload)
      await refresh()
    } catch (err) {
      mutationError.value =
        err instanceof Error ? err.message : translateText("interviewEvaluations.createFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, payload: InterviewEvaluationRequest) {
    saving.value = true
    mutationError.value = ""
    try {
      await updateInterviewEvaluation(interviewEvaluationRepo, id, payload)
      await refresh()
    } catch (err) {
      mutationError.value =
        err instanceof Error ? err.message : translateText("interviewEvaluations.updateFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    saving.value = true
    mutationError.value = ""
    try {
      await deleteInterviewEvaluation(interviewEvaluationRepo, id)
      await refresh()
    } catch (err) {
      mutationError.value =
        err instanceof Error ? err.message : translateText("interviewEvaluations.deleteFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    const tasks: Promise<void>[] = []
    if (loadEvaluationsOnMounted && !isResourceCacheFresh(evaluationsCache)) {
      tasks.push(refreshEvaluations())
    }
    if (loadCandidateOptionsOnMounted && !isResourceCacheFresh(candidateOptionsCache)) {
      tasks.push(refreshCandidateOptions())
    }

    if (tasks.length) {
      Promise.all(tasks)
    }
  })

  return {
    candidateOptions,
    create,
    error,
    interviewEvaluations,
    loading,
    refresh,
    refreshCandidateOptions,
    refreshEvaluations,
    remove,
    saving,
    update,
  }
}
