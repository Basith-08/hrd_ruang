export interface UserManagementPageFilterState {
  searchQuery: string
  roleFilter: string
  page: number
}

export type UserManagementRoleChangesState = Record<string, string>

export function createUserManagementPageFilterState(): UserManagementPageFilterState {
  return {
    searchQuery: '',
    roleFilter: '',
    page: 1,
  }
}
