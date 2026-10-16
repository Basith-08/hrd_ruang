import { onMounted, ref } from 'vue'

import { useAppRepositories } from '@/composables/useAppRepositories'
import type {
  ManagedUser,
  RoleOption,
} from '@/domain/entities/ManagedUser'
import type { UserHistoryEntry } from '@/domain/entities/UserHistory'
import type {
  CreateUserRequest,
  UpdateUserRequest,
} from '@/domain/requests/ManagedUserRequest'
import type { UserManagementViewModelOptions } from '@/viewmodels/types/useUserManagementViewModel.type'
import { getAllUsers } from '@/application/usecases/getAllUsers'
import { getUserHistory } from '@/application/usecases/getUserHistory'
import { createManagedUser } from '@/application/usecases/createManagedUser'
import { deleteManagedUser } from '@/application/usecases/deleteManagedUser'
import { updateManagedUserRole } from '@/application/usecases/updateManagedUserRole'
import { updateManagedUser } from '@/application/usecases/updateManagedUser'
import { setManagedUserActiveStatus } from '@/application/usecases/setManagedUserActiveStatus'
import { switchManagedUserToEmployee } from '@/application/usecases/switchManagedUserToEmployee'

export function useUserManagementViewModel(options: UserManagementViewModelOptions = {}) {
  const {
    autoLoadUsers = true,
    autoLoadRoles = true,
    autoLoadHistory = true,
    scope,
  } = options
  const { userManagementRepo } = useAppRepositories()
  const users = ref<ManagedUser[]>([])
  const userHistory = ref<UserHistoryEntry[]>([])
  const roles = ref<RoleOption[]>([])
  const loading = ref(autoLoadUsers || autoLoadHistory)
  const saving = ref(false)
  const error = ref('')

  function shouldRefreshHistoryAfterMutation() {
    return autoLoadHistory || userHistory.value.length > 0
  }

  async function refreshUsers() {
    loading.value = true
    error.value = ''
    try {
      users.value = await getAllUsers(userManagementRepo, scope)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user list.'
    } finally {
      loading.value = false
    }
  }

  async function refreshRoles() {
    try {
      roles.value = await userManagementRepo.getRoles(scope)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load roles.'
    }
  }

  async function refreshUserHistory() {
    loading.value = true
    error.value = ''
    try {
      userHistory.value = await getUserHistory(userManagementRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user history.'
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: CreateUserRequest) {
    saving.value = true
    error.value = ''
    try {
      await createManagedUser(userManagementRepo, data)
      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user.'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function deleteUser(userId: string) {
    saving.value = true
    error.value = ''
    try {
      await deleteManagedUser(userManagementRepo, userId)
      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user.'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateUser(userId: string, data: UpdateUserRequest) {
    saving.value = true
    error.value = ''
    try {
      await updateManagedUser(userManagementRepo, userId, data)
      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user.'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateUserRole(userId: string, roleId: string) {
    saving.value = true
    error.value = ''
    try {
      await updateManagedUserRole(userManagementRepo, userId, roleId)
      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update role.'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function switchToEmployee(userId: string) {
    saving.value = true
    error.value = ''
    try {
      const switchedUser = await switchManagedUserToEmployee(userManagementRepo, userId)

      const applySwitchedUserState = () => {
        users.value = [switchedUser, ...users.value.filter((user) => user.id !== userId)]
        userHistory.value = userHistory.value.filter((entry) => entry.id !== userId)
      }

      applySwitchedUserState()

      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
      applySwitchedUserState()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to switch user to employee.'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function setUserActiveStatus(userId: string, isActive: boolean) {
    saving.value = true
    error.value = ''
    try {
      await setManagedUserActiveStatus(userManagementRepo, userId, isActive)
      await refreshUsers()
      if (shouldRefreshHistoryAfterMutation()) {
        await refreshUserHistory()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user status.'
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    if (autoLoadUsers) refreshUsers()
    if (autoLoadRoles) refreshRoles()
    if (autoLoadHistory) refreshUserHistory()
  })

  return {
    createUser,
    deleteUser,
    error,
    loading,
    refreshRoles,
    refreshUserHistory,
    refreshUsers,
    roles,
    saving,
    switchToEmployee,
    setUserActiveStatus,
    updateUser,
    updateUserRole,
    userHistory,
    users,
  }
}
