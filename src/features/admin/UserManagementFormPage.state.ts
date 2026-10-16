export interface UserFormState {
  email: string
  username: string
  password: string
  full_name: string
  phone: string
  employee_code: string
  contract_number: string
  cost_center_pt_id: string
  employee_request_form_id: string
  department_id: string
  master_designation_id: string
  main_position: string
  role_id: string
}

export interface CreatedUserSummaryState {
  email: string
  username: string | null
  password: string
  roleName: string
}

export function createUserManagementFormState(): UserFormState {
  return {
    email: '',
    username: '',
    password: '',
    full_name: '',
    phone: '',
    employee_code: '',
    contract_number: '',
    cost_center_pt_id: '',
    employee_request_form_id: '',
    department_id: '',
    master_designation_id: '',
    main_position: '',
    role_id: '',
  }
}
