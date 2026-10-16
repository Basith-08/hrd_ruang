export interface CreateUserRequest {
  email: string
  username?: string
  password?: string
  full_name: string
  phone?: string
  employee_code?: string
  contract_number?: string
  cost_center_pt_id?: string | null
  employee_request_form_id?: string | null
  department_id?: string | null
  master_designation_id?: string | null
  main_position?: string | null
  is_active?: boolean
  role_id: string
}

export interface UpdateUserRequest {
  email: string
  username?: string
  password?: string
  full_name: string
  phone?: string
  employee_code?: string
  contract_number?: string
  cost_center_pt_id?: string | null
  employee_request_form_id?: string | null
  department_id?: string | null
  master_designation_id?: string | null
  main_position?: string | null
  is_active?: boolean
  role_id: string
}

export interface UpdateUserRoleRequest {
  role_id: string
}

export interface SetUserActiveStatusRequest {
  is_active: boolean
}
