import { onMounted, ref } from 'vue'

import { useAppRepositories } from '@/composables/useAppRepositories'
import type { CandidateDocumentExplorerItem } from '@/domain/entities/CandidateDocumentExplorer'
import { getCandidateDocumentExplorerItems } from '@/application/usecases/getCandidateDocumentExplorerItems'

export function useCandidateDocumentExplorerViewModel() {
  const { candidateDocumentExplorerRepo } = useAppRepositories()
  const items = ref<CandidateDocumentExplorerItem[]>([])
  const loading = ref(true)
  const error = ref('')

  async function refreshItems() {
    loading.value = true
    error.value = ''

    try {
      items.value = await getCandidateDocumentExplorerItems(candidateDocumentExplorerRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load candidate documents.'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    refreshItems()
  })

  return {
    error,
    items,
    loading,
    refreshItems,
  }
}
