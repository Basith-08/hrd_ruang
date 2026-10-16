import type { ManagedUser, RoleOption } from '@/domain/entities/ManagedUser'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'

export interface GetUsersResponse {
  users: ManagedUser[]
}

export interface GetUserHistoryResponse {
  history: UserHistoryEntry[]
}

export interface GetUserRolesResponse {
  roles: RoleOption[]
}

export interface CreateUserResponse {
  user: ManagedUser
}

export interface UpdateUserResponse {
  user: ManagedUser
}
