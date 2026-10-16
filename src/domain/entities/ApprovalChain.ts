import type { ApprovalFlowKey } from '@/domain/utils/approvalFlowConfig'

// ===========================
// Approval Chain & Steps
// ===========================

export type ApprovalChainStatus = "draft" | "pending" | "approved" | "rejected"
export type ApprovalStepStatus = "pending" | "approved" | "rejected"

export interface ApprovalStep {
  id: string
  chain_id: string
  step_order: number
  approval_role_key?: string | null
  approval_role_label?: string | null
  approver_email: string
  approver_name: string | null
  status: ApprovalStepStatus
  approved_at: string | null
  notes: string | null
  created_at: string | null
}

export interface ApprovalChain {
  id: string
  employee_request_form_id: string
  created_by: string | null
  status: ApprovalChainStatus
  created_at: string | null
  updated_at: string | null
  steps: ApprovalStep[]
  employee_request_form?: {
    id: string
    created_at: string | null
    requested_date?: string | null
    status?: 'open' | 'closed' | null
    closed_category?: 'employee hired' | 'canceled' | null
    main_position: string | null
    department: string | null
    designation: string | null
    site: string | null
    employment_status: string | null
    direct_manager: string | null
    pt_pembebanan: string | null
    working_location: string | null
    required_date: string | null
    position_status: string | null
    periode_probation: number | null
    custom_grup_1: string | null
    custom_grup_2: string | null
    custom_grup_3: string | null
    custom_grup_4: string | null
    custom_grup_5: string | null
    custom_grup_6: string | null
    organizational_structure?: string[] | null
    job_description?: string[] | null
    approval_director_bu: string | null
    approval_director_bu_date: string | null
    approval_gm_hrd: string | null
    approval_gm_hrd_date: string | null
    approval_director_hrd: string | null
    approval_director_hrd_date: string | null
    vacancy_status?: 'request' | 'sourcing' | 'interview' | 'accepted' | null
    recruitment_flow_stage?: string | null
  } | null
}

// ===========================
// Approver Master (reusable template)
// ===========================

export interface ApproverMaster {
  id: string
  profile_id: string
  step_order: number
  approval_flow_key: ApprovalFlowKey | string
  approval_role_key: string
  approval_role_label: string
  created_by: string | null
  created_at: string | null
  employee?: {
    full_name?: string | null
    username?: string | null
    email: string | null
    phone: string | null
  }
}
