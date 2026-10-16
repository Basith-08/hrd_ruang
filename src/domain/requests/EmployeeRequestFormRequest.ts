import type {
  EmploymentStatus,
  PositionStatus,
} from '@/domain/entities/EmployeeRequestForm'

export interface EmployeeRequestFormRequest {
  created_by?: string | null
  pt_id?: string | null
  pt_pembebanan: string
  bu_id?: string | null
  department_id?: string | null
  department: string
  master_designation_id?: string | null
  designation: string
  employment_status: EmploymentStatus | ''
  approval_director_bu_id?: string | null
  auto_approval?: boolean
  direct_manager: string
  site: string
  working_location: string
  requested_date: string
  custom_grup_1_id: string | null
  custom_grup_2_id: string | null
  custom_grup_3_id: string | null
  custom_grup_4_id: string | null
  custom_grup_5_id: string | null
  custom_grup_6_id: string | null
  required_date: string
  position_status: PositionStatus | ''
  periode_probation: number | null
  main_position: string
  organizational_structure?: string[]
  job_description?: string[]
  document_erf?: string[]
  status: 'open' | 'closed'
  closed_date?: string | null
  closed_category?: 'employee hired' | 'canceled' | null
  reason?: string | null
}
