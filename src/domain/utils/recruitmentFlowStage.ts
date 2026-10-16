import type { ApprovalChain } from '@/domain/entities/ApprovalChain'
import type { EmployeeRequestForm, RecruitmentFlowStage } from '@/domain/entities/EmployeeRequestForm'
import { buildApprovalProgressSummary } from '@/domain/utils/approvalSummary'

type PartialEmployeeRequestForm = Partial<EmployeeRequestForm> & {
  id?: string | null
  status?: 'open' | 'closed' | null
  closed_category?: 'employee hired' | 'canceled' | null
  recruitment_flow_stage?: RecruitmentFlowStage | null
}

type PartialApprovalChain = Partial<ApprovalChain> & {
  status?: ApprovalChain['status'] | null
  steps?: ApprovalChain['steps']
}

function normalizeLegacyApprovalStage(stage: string | null | undefined): RecruitmentFlowStage | null {
  switch (String(stage ?? '').trim()) {
    case 'approval_in_progress':
      return 'approval_in_progress'
    case 'waiting_bu_director_approval':
    case 'waiting_gm_hrd_approval':
    case 'waiting_hr_director_approval':
      return 'approval_in_progress'
    default:
      return (stage as RecruitmentFlowStage | null | undefined) ?? null
  }
}

function isStablePersistedRecruitmentFlowStage(stage: RecruitmentFlowStage | null) {
  return [
    'erf_requested',
    'approval_in_progress',
    'assessment_list_created',
    'interview_scheduled',
    'interview_evaluation_in_progress',
    'interview_evaluation_completed',
    'candidate_selected',
    'employee_contract_form_in_progress',
    'hiring_completed',
    'closed',
    'rejected',
  ].includes(stage ?? '')
}

export function resolveRecruitmentFlowStage(input: {
  employeeRequestForm?: PartialEmployeeRequestForm | null
  approvalChain?: PartialApprovalChain | null
}): RecruitmentFlowStage {
  const employeeRequestForm = input.employeeRequestForm ?? null
  const approvalChain = input.approvalChain ?? null
  const persistedStage = normalizeLegacyApprovalStage(employeeRequestForm?.recruitment_flow_stage)

  if (isRejectedApprovalChain(approvalChain)) {
    return 'rejected'
  }

  if (employeeRequestForm?.status === 'closed') {
    if (employeeRequestForm.closed_category === 'employee hired') {
      return 'hiring_completed'
    }

    return 'closed'
  }

  if (isStablePersistedRecruitmentFlowStage(persistedStage)) {
    return persistedStage ?? 'erf_requested'
  }

  if (!employeeRequestForm && approvalChain?.status === 'draft') {
    return 'erf_requested'
  }

  switch (employeeRequestForm?.vacancy_status) {
    case 'accepted':
      return 'interview_evaluation_completed'
    case 'interview':
      return 'interview_evaluation_in_progress'
    case 'sourcing':
      return 'candidate_sourcing'
    default:
      break
  }

  const approvalSummary = buildApprovalProgressSummary(employeeRequestForm?.approval_steps, {
    approval_director_bu: employeeRequestForm?.approval_director_bu,
    approval_director_bu_date: employeeRequestForm?.approval_director_bu_date,
    approval_gm_hrd: employeeRequestForm?.approval_gm_hrd,
    approval_gm_hrd_date: employeeRequestForm?.approval_gm_hrd_date,
    approval_director_hrd: employeeRequestForm?.approval_director_hrd,
    approval_director_hrd_date: employeeRequestForm?.approval_director_hrd_date,
  })

  if (approvalSummary.totalCount > 0 && approvalSummary.approvedCount < approvalSummary.totalCount) {
    return 'approval_in_progress'
  }

  if (approvalSummary.totalCount > 0 && approvalSummary.approvedCount >= approvalSummary.totalCount) {
    if (persistedStage === 'assign_recruiter') {
      return 'assign_recruiter'
    }

    if (String(employeeRequestForm?.recruiter_user_id ?? '').trim()) {
      return 'assign_recruiter'
    }

    return approvalChain?.status === 'draft' ? 'erf_requested' : 'erf_approved'
  }

  if (!hasApprovalDate(employeeRequestForm?.approval_director_bu_date)) {
    return 'approval_in_progress'
  }

  if (!hasApprovalDate(employeeRequestForm?.approval_gm_hrd_date)) {
    return 'approval_in_progress'
  }

  if (!hasApprovalDate(employeeRequestForm?.approval_director_hrd_date)) {
    return 'approval_in_progress'
  }

  if (persistedStage === 'assign_recruiter') {
    return 'assign_recruiter'
  }

  if (String(employeeRequestForm?.recruiter_user_id ?? '').trim()) {
    return 'assign_recruiter'
  }

  return approvalChain?.status === 'draft' ? 'erf_requested' : 'erf_approved'
}

export function recruitmentFlowStageLabel(stage: RecruitmentFlowStage | null | undefined) {
  const map: Record<RecruitmentFlowStage, string> = {
    erf_requested: '1. ERF Requested',
    approval_in_progress: '2. Approval In Progress',
    erf_approved: '4. ERF Approved',
    assign_recruiter: '5. Assign Recruiter',
    candidate_sourcing: '6. Candidate Sourcing',
    assessment_list_created: '7. Candidate Form In Progress',
    interview_scheduled: '8. Interview Scheduled',
    interview_evaluation_in_progress: '9. Interview Evaluation In Progress',
    interview_evaluation_completed: '10. Interview Evaluation Completed',
    candidate_selected: '11. Employee Form In Progress',
    employee_contract_form_in_progress: '12. Employee Contract Form In Progress',
    hiring_completed: '13. Hiring Completed',
    closed: '91. Closed',
    rejected: '90. Rejected',
  }

  return map[stage ?? 'erf_requested']
}

export function recruitmentFlowStageBadgeClass(stage: RecruitmentFlowStage | null | undefined) {
  const map: Record<RecruitmentFlowStage, string> = {
    erf_requested: 'app-status-chip-neutral',
    approval_in_progress: 'app-status-chip-warning',
    erf_approved: 'app-status-chip-accent',
    assign_recruiter: 'app-status-chip-accent',
    candidate_sourcing: 'app-status-chip-accent',
    assessment_list_created: 'app-status-chip-accent',
    interview_scheduled: 'app-status-chip-accent',
    interview_evaluation_in_progress: 'app-status-chip-warning',
    interview_evaluation_completed: 'app-status-chip-success',
    candidate_selected: 'app-status-chip-success',
    employee_contract_form_in_progress: 'app-status-chip-warning',
    hiring_completed: 'app-status-chip-success',
    closed: 'app-status-chip-neutral',
    rejected: 'app-status-chip-danger',
  }

  return map[stage ?? 'erf_requested']
}

function hasApprovalDate(value: unknown) {
  return String(value ?? '').trim().length > 0
}

function isRejectedApprovalChain(approvalChain: PartialApprovalChain | null) {
  if (approvalChain?.status === 'rejected') {
    return true
  }

  return Array.isArray(approvalChain?.steps)
    ? approvalChain.steps.some((step) => step?.status === 'rejected')
    : false
}
