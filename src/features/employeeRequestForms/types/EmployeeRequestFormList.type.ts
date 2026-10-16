export interface EmployeeRequestFormListSelectOption {
  value: string | null
  label: string
}

export type EmployeeRequestFormListSortKey =
  | 'main_position'
  | 'department'
  | 'business_unit'
  | 'recruiter_name'
  | 'position_status'
  | 'employment_status'
  | 'required_date'
  | 'approval_progress'
  | 'current_approval'
  | 'last_approval_date'
  | 'status'
  | 'closed_date'

export type EmployeeRequestFormListSortDirection = 'asc' | 'desc'
