import type { ApproverMasterRequest } from '@/domain/requests/ApprovalRequest'
import type { ApprovalFlowStepTemplate, ApprovalFlowKey } from '@/domain/utils/approvalFlowConfig'

export type ApproverFormState = ApproverMasterRequest & { id?: string }

export function createApproverFormState(
  flowKey: ApprovalFlowKey,
  step: ApprovalFlowStepTemplate,
): ApproverFormState {
  return {
    approval_flow_key: flowKey,
    approval_role_key: step.roleKey,
    approval_role_label: step.label,
    profile_id: '',
    step_order: step.stepOrder,
  }
}
