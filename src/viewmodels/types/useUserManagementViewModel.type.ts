import type { UserManagementScope } from '@/domain/repositories/UserManagementRepository'

export interface UserManagementViewModelOptions {
  autoLoadUsers?: boolean
  autoLoadRoles?: boolean
  autoLoadHistory?: boolean
  scope?: UserManagementScope
}
