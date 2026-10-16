import type { Permission, Role } from '@/domain/entities/Role'

export interface GetRolesResponse {
  roles: Role[]
}

export interface GetPermissionsResponse {
  permissions: Permission[]
}

export interface CreateRoleResponse {
  role: Role
}
