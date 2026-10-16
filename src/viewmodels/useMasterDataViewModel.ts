import { ref } from 'vue'
import type { MasterDataItem, MasterDataType } from '@/domain/entities/MasterData'
import type { MasterDataRequest } from '@/domain/requests/MasterDataRequest'
import { masterDataRepo } from '@/infrastructure/supabase/repositories/MasterDataRepositoryImpl'
import {
  createMasterDataOptionState,
  type MasterDataOptionState,
} from '@/viewmodels/useMasterDataViewModel.state'

export function useMasterDataViewModel() {
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const optionsByType = ref<MasterDataOptionState>(createMasterDataOptionState())

  async function refreshOptions(type: MasterDataType) {
    loading.value = true
    error.value = null
    try {
      optionsByType.value[type] = await masterDataRepo.getAll(type)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to load ${type} options.`
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadOptions(types: MasterDataType[]) {
    loading.value = true
    error.value = null
    try {
      const uniqueTypes = Array.from(new Set(types))
      const results = await Promise.allSettled(uniqueTypes.map((type) => masterDataRepo.getAll(type)))
      let loadedCount = 0
      const failedTypes: MasterDataType[] = []

      for (const [index, result] of results.entries()) {
        const type = uniqueTypes[index]
        if (!type) continue

        if (result.status === 'fulfilled') {
          optionsByType.value[type] = result.value
          loadedCount += 1
          continue
        }

        failedTypes.push(type)
      }

      if (loadedCount === 0 && failedTypes.length > 0) {
        const message = `Failed to load ${failedTypes.join(', ')} options.`
        error.value = message
        throw new Error(message)
      }
    } finally {
      loading.value = false
    }
  }

  async function loadAllOptions() {
    await loadOptions(['pt', 'bu', 'department', 'job_level', 'designation'])
  }

  async function create(type: MasterDataType, input: MasterDataRequest) {
    saving.value = true
    error.value = null
    try {
      const created = await masterDataRepo.create(type, input)
      optionsByType.value[type] = [...optionsByType.value[type], created].sort((a, b) =>
        a.name.localeCompare(b.name),
      )
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to create ${type}.`
      throw err
    } finally {
      saving.value = false
    }
  }

  async function update(type: MasterDataType, id: string, input: MasterDataRequest) {
    saving.value = true
    error.value = null
    try {
      const updated = await masterDataRepo.update(type, id, input)
      optionsByType.value[type] = optionsByType.value[type]
        .map((item) => (item.id === id ? updated : item))
        .sort((a, b) => a.name.localeCompare(b.name))
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to update ${type}.`
      throw err
    } finally {
      saving.value = false
    }
  }

  async function remove(type: MasterDataType, id: string) {
    saving.value = true
    error.value = null
    try {
      await masterDataRepo.delete(type, id)
      optionsByType.value[type] = optionsByType.value[type].filter((item) => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to delete ${type}.`
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    loading,
    saving,
    error,
    optionsByType,
    refreshOptions,
    loadOptions,
    loadAllOptions,
    create,
    update,
    remove,
  }
}
