import type { Role, Permission } from '@/domain/entities/Role'
import type { RoleRepository } from '@/domain/repositories/RoleRepository'
import type {
  CreateRoleRequest,
  UpdateRolePermissionsRequest,
} from '@/domain/requests/RoleRequest'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import type {
  CreateRoleResponse,
  GetPermissionsResponse,
  GetRolesResponse,
} from '@/infrastructure/supabase/repositories/responses/RoleRepositoryResponse'

export class RoleRepositoryImpl implements RoleRepository {
  async getAllRoles(): Promise<Role[]> {
    const payload = await callBackendApi<GetRolesResponse>('/admin/roles')
    return payload.roles
  }

  async getAllPermissions(): Promise<Permission[]> {
    const payload = await callBackendApi<GetPermissionsResponse>('/admin/permissions')
    return payload.permissions
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const request: CreateRoleRequest = { name, description }
    const payload = await callBackendApi<CreateRoleResponse>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return payload.role
  }

  async updateRolePermissions(input: UpdateRolePermissionsRequest): Promise<void> {
    await callBackendApi(`/admin/roles/${encodeURIComponent(input.role_id)}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: input.permission_ids }),
    })
  }

  async deleteRole(id: string): Promise<void> {
    await callBackendApi(`/admin/roles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }
}
