export type UserRole = string // Dynamically retrieved from `roles` table

export interface User {
  id: string
  email: string
  role?: UserRole
  permissions?: string[] // e.g., ['employee_request_form:read', 'user:create']
  is_active?: boolean | null
  username?: string
  phone?: string
  full_name?: string
  created_at?: string
  activated_at?: string
  updated_at?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  main_position?: string
  hire_location?: string
  date_of_birth?: string
  place_of_birth?: string
  nationality?: string
  marital_status?: string
  religion?: string
  gender?: string
  ethnic?: string
  blood_type?: string
  avatar_url?: string
  department_id?: string | null
  master_designation_id?: string | null
  personal_data?: Record<string, unknown> | null
}
