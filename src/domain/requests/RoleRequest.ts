export interface CreateRoleRequest {
  name: string
  description?: string
}

export interface UpdateRolePermissionsRequest {
  role_id: string
  permission_ids: string[]
}
