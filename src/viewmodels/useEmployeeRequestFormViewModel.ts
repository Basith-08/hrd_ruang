import { onMounted, ref } from 'vue'

import { useAppRepositories } from '@/composables/useAppRepositories'
import { createResourceCache, isResourceCacheFresh, refreshResourceCache, type ResourceCache } from '@/composables/useResourceCache'
import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import type { EmployeeRequestFormGetByIdOptions } from '@/domain/repositories/EmployeeRequestFormRepository'
import type { EmployeeRequestFormViewModelOptions } from '@/viewmodels/types/useEmployeeRequestFormViewModel.type'
import { GetEmployeeRequestForms } from '@/application/usecases/getEmployeeRequestForms'
import { createEmployeeRequestForm } from '@/application/usecases/createEmployeeRequestForm'
import { updateEmployeeRequestForm } from '@/application/usecases/updateEmployeeRequestForm'
import { assignEmployeeRequestFormRecruiter } from '@/application/usecases/assignEmployeeRequestFormRecruiter'
import { deleteEmployeeRequestForm } from '@/application/usecases/deleteEmployeeRequestForm'
import { closeEmployeeRequestForm } from '@/application/usecases/closeEmployeeRequestForm'
import { translateText } from '@/composables/useLocale'

type EmployeeRequestFormMutationOptions = {
  refresh?: boolean
}

// Shared across every instance of a given `mode` (the Employee Request Form List page, the
// Vacancy Pipeline page, and any other page reusing the same query) so navigating away and back
// re-shows cached data instantly instead of refetching. TTL comes from the global cache config.
const listCache = createResourceCache<EmployeeRequestForm[]>([])
const pipelineCache = createResourceCache<EmployeeRequestForm[]>([])

function getModeCache(mode: EmployeeRequestFormViewModelOptions['mode']): ResourceCache<EmployeeRequestForm[]> | null {
  if (mode === 'list') return listCache
  if (mode === 'pipeline') return pipelineCache
  return null
}

export function useEmployeeRequestFormViewModel(options: EmployeeRequestFormViewModelOptions = {}) {
  const { autoLoad = true, mode = 'default' } = options
  const { employeeRequestFormRepo } = useAppRepositories()
  const modeCache = getModeCache(mode)
  const jobs = modeCache ? modeCache.data : ref<EmployeeRequestForm[]>([])
  const loading = modeCache ? modeCache.loading : ref(autoLoad)
  const saving = ref(false)
  const error = modeCache ? modeCache.error : ref('')

  async function fetchJobs() {
    if (mode === 'list' && 'getAllForList' in employeeRequestFormRepo) {
      return employeeRequestFormRepo.getAllForList()
    }
    if (mode === 'pipeline' && 'getAllForVacancyPipeline' in employeeRequestFormRepo) {
      return employeeRequestFormRepo.getAllForVacancyPipeline()
    }
    return new GetEmployeeRequestForms(employeeRequestFormRepo).execute()
  }

  async function refresh() {
    if (modeCache) {
      return refreshResourceCache(modeCache, fetchJobs, translateText('employeeRequestForms.loadFailed'))
    }

    loading.value = true
    error.value = ''
    try {
      jobs.value = await fetchJobs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.loadFailed')
    } finally {
      loading.value = false
    }
  }

  async function create(
    payload: EmployeeRequestFormRequest,
    mutationOptions: EmployeeRequestFormMutationOptions = {},
  ) {
    saving.value = true
    error.value = ''
    try {
      await createEmployeeRequestForm(employeeRequestFormRepo, payload, { reloadRecord: false })
      if (mutationOptions.refresh !== false) {
        await refresh()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.createFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function update(
    id: string,
    payload: EmployeeRequestFormRequest,
    mutationOptions: EmployeeRequestFormMutationOptions = {},
  ) {
    saving.value = true
    error.value = ''
    try {
      await updateEmployeeRequestForm(employeeRequestFormRepo, id, payload, { reloadRecord: false })
      if (mutationOptions.refresh !== false) {
        await refresh()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.updateFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    saving.value = true
    error.value = ''
    try {
      await deleteEmployeeRequestForm(employeeRequestFormRepo, id)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.deleteFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function assignRecruiter(id: string, recruiterUserId: string) {
    saving.value = true
    error.value = ''
    try {
      await assignEmployeeRequestFormRecruiter(employeeRequestFormRepo, id, recruiterUserId)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.updateFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function close(
    id: string,
    category: 'canceled' | 'done' | 'employee hired',
    reason: string,
  ) {
    saving.value = true
    error.value = ''
    try {
      await closeEmployeeRequestForm(employeeRequestFormRepo, id, category, reason)
      await refresh()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.closeFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function getById(id: string, options?: EmployeeRequestFormGetByIdOptions) {
    error.value = ''
    try {
      return await employeeRequestFormRepo.getById(id, options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('employeeRequestForms.loadFailed')
      throw err
    }
  }

  onMounted(() => {
    if (!autoLoad) {
      return
    }

    if (modeCache && isResourceCacheFresh(modeCache)) {
      return
    }

    refresh()
  })

  return {
    create,
    error,
    getById,
    jobs,
    loading,
    refresh,
    remove,
    close,
    assignRecruiter,
    saving,
    update,
  }
}
