import { onMounted, ref } from 'vue'

import { useAppRepositories } from '@/composables/useAppRepositories'
import type { ApproverMaster } from '@/domain/entities/ApprovalChain'
import type { ApproverMasterRequest } from '@/domain/requests/ApprovalRequest'
import { getApproverMasters } from '@/application/usecases/getApproverMasters'
import { createApproverMaster } from '@/application/usecases/createApproverMaster'
import { updateApproverMaster } from '@/application/usecases/updateApproverMaster'
import { deleteApproverMaster } from '@/application/usecases/deleteApproverMaster'
import { translateText } from '@/composables/useLocale'

export function useApproverMasterViewModel() {
  const { approvalRepo } = useAppRepositories()
  const approvers = ref<ApproverMaster[]>([])
  const loading = ref(true)
  const saving = ref(false)
  const error = ref('')

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      approvers.value = await getApproverMasters(approvalRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('approvals.master.loadFailed')
    } finally {
      loading.value = false
    }
  }

  async function create(
    data: ApproverMasterRequest,
    options?: { refresh?: boolean },
  ) {
    saving.value = true
    error.value = ''
    try {
      await createApproverMaster(approvalRepo, data)
      if (options?.refresh !== false) {
        await refresh()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('approvals.master.addFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function update(
    id: string,
    data: ApproverMasterRequest,
    options?: { refresh?: boolean },
  ) {
    saving.value = true
    error.value = ''
    try {
      await updateApproverMaster(approvalRepo, id, data)
      if (options?.refresh !== false) {
        await refresh()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('approvals.master.updateFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string, options?: { refresh?: boolean }) {
    saving.value = true
    error.value = ''
    try {
      await deleteApproverMaster(approvalRepo, id)
      if (options?.refresh !== false) {
        await refresh()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText('approvals.master.deleteFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(refresh)

  return {
    approvers,
    create,
    error,
    loading,
    refresh,
    remove,
    saving,
    update,
  }
}
