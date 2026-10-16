export interface EmployeeContractFormRecord {
  id: string
  employee_request_form_id: string
  candidate_id: string
  candidate_name: string | null
  candidate_email: string | null
  contract_number: string | null
  employee_code: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  approval_user_id: string | null
  created_at: string | null
  updated_at: string | null
  employee_request_form: {
    id: string
    department: string | null
    main_position: string | null
    position: string | null
    employment_status: string | null
  } | null
  approval_user: {
    id: string
    full_name: string | null
    email: string | null
    designation: string | null
    main_position: string | null
  } | null
}

export interface EmployeeContractFormPayload {
  employee_request_form_id: string
  candidate_id: string
  contract_number: string
  employee_code: string
  contract_start_date: string
  contract_end_date: string
  approval_user_id: string
}

export interface EmployeeContractFormSelectOption {
  value: string
  label: string
}
