// ===========================
// Recruitment Tracking
// ===========================

export interface RecruitmentTracking {
  id: string
  employee_request_form_id: string
  chain_id: string | null
  created_at: string | null
  updated_at: string | null
  employee_request_form?: {
    id: string
    requested_date?: string | null
    pt_pembebanan: string | null
    bu_id?: string | null
    business_unit?: string | null
    department: string | null
    designation: string | null
    job_level: string | null
    direct_manager?: string | null
    main_position: string | null
    site: string | null
    working_location: string | null
    employment_status: string | null
    position_status: string | null
    required_date: string | null
    recruiter_user_id?: string | null
    recruiter_name?: string | null
    status: 'open' | 'closed' | null
    closed_date: string | null
    closed_category?: 'employee hired' | 'canceled' | null
    reason?: string | null
    notes?: string | null
    custom_grup_1: string | null
    custom_grup_2: string | null
    custom_grup_3: string | null
    custom_grup_4: string | null
    custom_grup_5: string | null
    custom_grup_6: string | null
    approval_director_bu: string | null
    approval_director_bu_date: string | null
    approval_gm_hrd: string | null
    approval_gm_hrd_date: string | null
    approval_director_hrd: string | null
    approval_director_hrd_date: string | null
    candidate_name?: string | null
    recruitment_flow_stage?: string | null
  } | null
}
