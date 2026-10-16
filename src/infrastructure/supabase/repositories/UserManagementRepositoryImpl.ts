import { callBackendApi } from '@/infrastructure/http/backendApi'
import type {
  ManagedUser,
  RoleOption,
} from '@/domain/entities/ManagedUser'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import type {
  CreateUserRequest,
  SetUserActiveStatusRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
} from '@/domain/requests/ManagedUserRequest'
import type {
  UserManagementRepository,
  UserManagementScope,
} from '@/domain/repositories/UserManagementRepository'
import type {
  CreateUserResponse,
  GetUserHistoryResponse,
  GetUserRolesResponse,
  GetUsersResponse,
  UpdateUserResponse,
} from '@/infrastructure/supabase/repositories/responses/UserManagementRepositoryResponse'

export class UserManagementRepositoryImpl implements UserManagementRepository {
  async getAllUsers(scope?: UserManagementScope): Promise<ManagedUser[]> {
    const query = scope ? `?scope=${encodeURIComponent(scope)}` : ''
    const payload = await callBackendApi<GetUsersResponse>(`/admin/users${query}`)
    return payload.users
  }

  async getUserHistory(): Promise<UserHistoryEntry[]> {
    const payload = await callBackendApi<GetUserHistoryResponse>('/admin/user-history')
    return payload.history
  }

  async getRoles(scope?: UserManagementScope): Promise<RoleOption[]> {
    const query = scope ? `?scope=${encodeURIComponent(scope)}` : ''
    const payload = await callBackendApi<GetUserRolesResponse>(`/admin/user-management/roles${query}`)
    return payload.roles
  }

  async createUser(input: CreateUserRequest): Promise<ManagedUser> {
    const payload = await callBackendApi<CreateUserResponse>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.user
  }

  async updateUser(userId: string, input: UpdateUserRequest): Promise<ManagedUser> {
    const payload = await callBackendApi<UpdateUserResponse>(
      `/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    )
    return payload.user
  }

  async deleteUser(userId: string): Promise<void> {
    await callBackendApi(`/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    })
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    const payload: UpdateUserRoleRequest = { role_id: roleId }
    await callBackendApi(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  async switchToEmployee(userId: string): Promise<ManagedUser> {
    const payload = await callBackendApi<UpdateUserResponse>(
      `/admin/users/${encodeURIComponent(userId)}/switch-to-employee`,
      {
        method: 'POST',
      },
    )
    return payload.user
  }

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
    const payload: SetUserActiveStatusRequest = { is_active: isActive }
    await callBackendApi(`/admin/users/${encodeURIComponent(userId)}/active`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }
}
