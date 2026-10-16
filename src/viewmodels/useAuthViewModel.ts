import { storeToRefs } from "pinia"

import { useAuthStore } from "@/stores/authStore"
import type { ChangePasswordRequest, LoginRequest } from "@/domain/requests/AuthRequest"

export function useAuthViewModel() {
  const authStore = useAuthStore()
  const { error, isAuthenticated, isLoading, user, userRole } = storeToRefs(authStore)

  async function login(payload: LoginRequest) {
    return authStore.login(payload)
  }

  async function logout() {
    return authStore.logout()
  }

  async function changePassword(payload: ChangePasswordRequest) {
    return authStore.changePassword(payload)
  }

  function hasPermission(permission: string) {
    return authStore.hasPermission(permission)
  }

  function hasAnyPermission(permissions: string[]) {
    return authStore.hasAnyPermission(permissions)
  }

  return {
    error,
    changePassword,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    user,
    userRole,
  }
}
