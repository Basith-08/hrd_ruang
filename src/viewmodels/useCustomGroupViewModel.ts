import { ref } from 'vue'
import { customGroupRepo } from '@/infrastructure/supabase/repositories/CustomGroupRepositoryImpl'
import type { CustomGroup } from '@/domain/entities/CustomGroup'

export function useCustomGroupViewModel() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Cache for options
  const groupedOptions = ref<Record<number, CustomGroup[]>>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  })

  async function refreshOptions(index: number) {
    loading.value = true
    try {
      const data = await customGroupRepo.getAll(index)
      groupedOptions.value[index] = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load options'
    } finally {
      loading.value = false
    }
  }

  async function loadAllOptions() {
    loading.value = true
    try {
      const promises = [1, 2, 3, 4, 5, 6].map(i => customGroupRepo.getAll(i))
      const results = await Promise.all(promises)
      results.forEach((data, idx) => {
        groupedOptions.value[idx + 1] = data
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load options'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    groupedOptions,
    refreshOptions,
    loadAllOptions
  }
}
