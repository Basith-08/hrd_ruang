import type {
  ManagedUser,
  RoleOption,
} from '@/domain/entities/ManagedUser'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import type {
  CreateUserRequest,
  UpdateUserRequest,
} from '@/domain/requests/ManagedUserRequest'

export type UserManagementScope = 'users' | 'candidate' | 'employee' | 'candidateEmployee' | 'all'

export interface UserManagementRepository {
  getAllUsers(scope?: UserManagementScope): Promise<ManagedUser[]>
  getUserHistory(): Promise<UserHistoryEntry[]>
  getRoles(scope?: UserManagementScope): Promise<RoleOption[]>
  createUser(data: CreateUserRequest): Promise<ManagedUser>
  updateUser(userId: string, data: UpdateUserRequest): Promise<ManagedUser>
  deleteUser(userId: string): Promise<void>
  updateUserRole(userId: string, roleId: string): Promise<void>
  switchToEmployee(userId: string): Promise<ManagedUser>
  setUserActiveStatus(userId: string, isActive: boolean): Promise<void>
}
