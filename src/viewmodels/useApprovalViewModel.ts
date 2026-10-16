import { onMounted, ref } from "vue"

import { useAppRepositories } from "@/composables/useAppRepositories"
import type { ApprovalChain } from "@/domain/entities/ApprovalChain"
import type { SubmitApprovalRequest } from "@/domain/requests/ApprovalRequest"
import { getApprovalChains } from "@/application/usecases/getApprovalChains"
import { submitForApproval } from "@/application/usecases/submitForApproval"
import { getChainByEmployeeRequestForm } from "@/application/usecases/getChainByEmployeeRequestForm"
import { translateText } from "@/composables/useLocale"

type ApprovalViewModelOptions = {
  autoLoad?: boolean
}

export function useApprovalViewModel(options: ApprovalViewModelOptions = {}) {
  const { autoLoad = true } = options
  const { approvalRepo } = useAppRepositories()
  const chains = ref<ApprovalChain[]>([])
  const loading = ref(autoLoad)
  const saving = ref(false)
  const error = ref("")

  async function refreshChains() {
    loading.value = true
    error.value = ""
    try {
      chains.value = await getApprovalChains(approvalRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("approvals.tracking.loadFailed")
    } finally {
      loading.value = false
    }
  }

  async function submitApproval(data: SubmitApprovalRequest) {
    saving.value = true
    error.value = ""
    try {
      await submitForApproval(approvalRepo, data)
      await refreshChains()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("approvals.tracking.submitFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function fetchChainByEmployeeRequestForm(employeeRequestFormId: string) {
    return getChainByEmployeeRequestForm(approvalRepo, employeeRequestFormId)
  }

  async function approveAssignedStep(stepId: string, notes?: string) {
    saving.value = true
    error.value = ''
    try {
      await approvalRepo.approveAssignedStep(stepId, notes)
      await refreshChains()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("approvals.tracking.approveFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function rejectAssignedStep(stepId: string, notes?: string) {
    saving.value = true
    error.value = ''
    try {
      await approvalRepo.rejectAssignedStep(stepId, notes)
      await refreshChains()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("approvals.tracking.rejectFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    if (autoLoad) {
      void refreshChains()
    }
  })

  return {
    approveAssignedStep,
    chains,
    error,
    fetchChainByEmployeeRequestForm,
    loading,
    rejectAssignedStep,
    refreshChains,
    saving,
    submitForApproval: submitApproval,
  }
}
