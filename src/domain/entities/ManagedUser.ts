import type { UserRole } from '@/domain/entities/User'

export interface ManagedUser {
  id: string
  email: string
  account_source?: 'internal' | 'candidate_service'
  username: string | null
  full_name?: string | null
  phone?: string | null
  employee_request_form_id: string | null
  department_id: string | null
  master_designation_id: string | null
  personal_data: Record<string, unknown> | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  main_position: string | null
  hire_location: string | null
  date_of_birth: string | null
  place_of_birth: string | null
  nationality: string | null
  marital_status: string | null
  religion: string | null
  gender: string | null
  ethnic: string | null
  blood_type: string | null
  no_id: string | null
  employee_code: string | null
  contract_number: string | null
  cost_center_pt_id?: string | null
  department: string | null
  employment_type: string | null
  employment_start_date: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  designation?: string | null
  custom_grup_1_id: string | null
  custom_grup_2_id: string | null
  custom_grup_3_id: string | null
  custom_grup_4_id: string | null
  custom_grup_5_id: string | null
  custom_grup_6_id: string | null
  is_active: boolean | null
  role: UserRole | null
  role_id: string | null
  created_at: string | null
  activated_at?: string | null
  updated_at: string | null
  last_login_at?: string | null
  candidate_form_id?: string | null
  candidate_form_completion_status?: string | null
  candidate_form_created_at?: string | null
  candidate_form_updated_at?: string | null
  candidate_form_is_submitted?: boolean
  candidate_form_has_contract_documents?: boolean
}

export interface RoleOption {
  id: string
  name: string
  description: string | null
}
