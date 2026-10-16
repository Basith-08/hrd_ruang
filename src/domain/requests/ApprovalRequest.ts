import type { ApprovalFlowKey } from '@/domain/utils/approvalFlowConfig'

export interface ApproverMasterRequest {
  profile_id: string
  step_order: number
  approval_flow_key: ApprovalFlowKey
  approval_role_key: string
  approval_role_label: string
}

export interface SubmitApprovalRequest {
  employee_request_form_id: string
  auto_approval?: boolean
}
