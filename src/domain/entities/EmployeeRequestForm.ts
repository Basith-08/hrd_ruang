export const employmentStatusOptions = ["Daily", "Probation", "Contract"] as const
export const positionStatusOptions = [
  "Replacement",
  "New Position MPP",
  "New Position Non-MPP",
  "Internship",
] as const

export type EmploymentStatus = (typeof employmentStatusOptions)[number]
export type PositionStatus = (typeof positionStatusOptions)[number]
export type VacancyStatus = "request" | "sourcing" | "interview" | "accepted"
export type RecruitmentFlowStage =
  | 'erf_requested'
  | 'approval_in_progress'
  | 'erf_approved'
  | 'assign_recruiter'
  | 'candidate_sourcing'
  | 'assessment_list_created'
  | 'interview_scheduled'
  | 'interview_evaluation_in_progress'
  | 'interview_evaluation_completed'
  | 'candidate_selected'
  | 'employee_contract_form_in_progress'
  | 'hiring_completed'
  | 'closed'
  | 'rejected'

export interface EmployeeRequestFormApprovalStep {
  step_order: number
  approval_role_label: string | null
  approver_name: string | null
  approved_at: string | null
  status?: string | null
}

export interface EmployeeRequestForm {
  id: string
  recruiter_user_id?: string | null
  recruiter_name?: string | null
  pt_id?: string | null
  pt_pembebanan: string | null
  bu_id?: string | null
  department_id?: string | null
  department: string | null
  business_unit?: string | null
  master_designation_id?: string | null
  designation: string | null
  employment_status: EmploymentStatus | null
  approval_director_bu_id?: string | null
  approval_director_bu_label?: string | null
  direct_manager: string | null
  approval_director_bu: string | null
  approval_director_bu_date: string | null
  approval_gm_hrd: string | null
  approval_gm_hrd_date: string | null
  approval_director_hrd: string | null
  approval_director_hrd_date: string | null
  site: string | null
  working_location: string | null
  requested_date: string | null
  custom_grup_1_id: string | null
  custom_grup_2_id: string | null
  custom_grup_3_id: string | null
  custom_grup_4_id: string | null
  custom_grup_5_id: string | null
  custom_grup_6_id: string | null
  custom_grup_1?: string | null
  custom_grup_2?: string | null
  custom_grup_3?: string | null
  custom_grup_4?: string | null
  custom_grup_5?: string | null
  custom_grup_6?: string | null
  required_date: string | null
  position_status: PositionStatus | null
  periode_probation: number | null
  main_position: string | null
  passed_candidate_name?: string | null
  passed_candidate_interview_date?: string | null
  vacancy_status?: VacancyStatus | null
  vacancy_candidate_count?: number | null
  vacancy_interview_scheduled_count?: number | null
  recruitment_flow_stage?: RecruitmentFlowStage | null
  organizational_structure?: string[] | null
  job_description?: string[] | null
  document_erf?: string[] | null
  created_by: string | null
  created_by_name?: string | null
  status: 'open' | 'closed'
  closed_date: string | null
  closed_category: 'employee hired' | 'canceled' | null
  reason: string | null
  notes?: string | null
  approval_steps?: EmployeeRequestFormApprovalStep[] | null
  created_at: string | null
  updated_at: string | null
}
