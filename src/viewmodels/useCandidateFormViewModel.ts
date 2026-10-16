import { onMounted, ref } from 'vue'

import { useAppRepositories } from '@/composables/useAppRepositories'
import type {
  CandidateForm,
  CandidateFormCompletionStatus,
} from '@/domain/entities/CandidateForm'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import { getCandidateForms } from '@/application/usecases/getCandidateForms'
import { createCandidateForm } from '@/application/usecases/createCandidateForm'
import { updateCandidateForm } from '@/application/usecases/updateCandidateForm'
import { updateCandidateFormStatus } from '@/application/usecases/updateCandidateFormStatus'
import { deleteCandidateForm } from '@/application/usecases/deleteCandidateForm'
import { translateText } from '@/composables/useLocale'

type CandidateFormViewModelOptions = {
  autoLoad?: boolean
}

export function useCandidateFormViewModel(options: CandidateFormViewModelOptions = {}) {
  const { autoLoad = true } = options
  const { candidateFormRepo } = useAppRepositories()
  const candidates = ref<CandidateForm[]>([])
  const loading = ref(autoLoad)
  const saving = ref(false)
  const error = ref('')

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      candidates.value = await getCandidateForms(candidateFormRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.loadFailed')
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CandidateFormRequest) {
    saving.value = true
    error.value = ''
    try {
      await createCandidateForm(candidateFormRepo, payload)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.createFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, payload: CandidateFormRequest) {
    saving.value = true
    error.value = ''
    try {
      await updateCandidateForm(candidateFormRepo, id, payload)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.updateFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateStatus(id: string, status: CandidateFormCompletionStatus) {
    saving.value = true
    error.value = ''
    try {
      await updateCandidateFormStatus(candidateFormRepo, id, status)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.updateStatusFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    saving.value = true
    error.value = ''
    try {
      await deleteCandidateForm(candidateFormRepo, id)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.deleteFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    if (autoLoad) {
      void refresh()
    }
  })

  async function getById(id: string) {
    error.value = ''
    try {
      return await candidateFormRepo.getById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('candidateForms.loadFailed')
      throw err
    }
  }

  return {
    candidates,
    create,
    error,
    getById,
    loading,
    refresh,
    remove,
    saving,
    update,
    updateStatus,
  }
}
