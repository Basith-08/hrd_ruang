import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useAppRepositories } from '@/composables/useAppRepositories'
import type { User, UserRole } from '@/domain/entities/User'
import type { LoginRequest } from '@/domain/requests/AuthRequest'
import { loginUser } from '@/application/usecases/loginUser'
import { logoutUser } from '@/application/usecases/logoutUser'
import { changePasswordUser } from '@/application/usecases/changePasswordUser'
import { supabase } from '@/infrastructure/supabase/client'
import { resetAuthAccessScopeCache } from '@/infrastructure/auth/accessScope'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { CANDIDATE_ACTIVE_DAYS, getCandidateAccessExpiryTime } from '@/domain/utils/candidateAccess'
import type { AuthProfileResponse } from '@/stores/responses/authStoreResponse'
import { translateText } from '@/composables/useLocale'
import type { ChangePasswordRequest } from '@/domain/requests/AuthRequest'

export const useAuthStore = defineStore('auth', () => {
  const { authRepo } = useAppRepositories()
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref('')
  let candidateExpiryTimer: number | null = null
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)
  const userRole = computed(() => user.value?.role ?? null)
  const userPermissions = computed(() => user.value?.permissions ?? [])

  function hasPermission(permission: string): boolean {
    return userPermissions.value.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => hasPermission(p))
  }

  function clearCandidateExpiryTimer() {
    if (candidateExpiryTimer !== null) {
      window.clearTimeout(candidateExpiryTimer)
      candidateExpiryTimer = null
    }
  }

  async function fetchUserProfile(userId: string): Promise<Partial<User>> {
    void userId
    const profile = await callBackendApi<AuthProfileResponse>('/auth/profile')

    return {
      ...profile,
      role: profile.role as UserRole | undefined,
    }
  }

  async function expireCandidateIfNeeded(userId: string, profile: Partial<User>) {
    const normalizedRole = String(profile.role ?? '').toLowerCase()
    if (normalizedRole !== 'candidate') {
      return profile
    }

    if (!profile.created_at) {
      return profile
    }

    const expiresAt = getCandidateAccessExpiryTime(profile.activated_at, profile.created_at)
    if (expiresAt === null) {
      return profile
    }

    if (Date.now() <= expiresAt) {
      return profile
    }

    return {
      ...profile,
      is_active: false,
    }
  }

  async function forceCandidateLogout(message: string) {
    clearCandidateExpiryTimer()
    resetAuthAccessScopeCache()
    error.value = message
    await supabase.auth.signOut()
    user.value = null

    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  async function enforceUserAccess(userId: string, profile: Partial<User>) {
    const syncedProfile = await expireCandidateIfNeeded(userId, profile)
    const normalizedRole = String(syncedProfile.role ?? '').toLowerCase()

    if (syncedProfile.is_active === false) {
      const message =
        normalizedRole === 'candidate'
          ? translateText('auth.messages.candidateExpired', { days: CANDIDATE_ACTIVE_DAYS })
          : translateText('auth.messages.accountInactive')
      await forceCandidateLogout(message)
      throw new Error(message)
    }

    return syncedProfile
  }

  function scheduleCandidateExpiry(userId: string, profile: Partial<User>) {
    clearCandidateExpiryTimer()

    const normalizedRole = String(profile.role ?? '').toLowerCase()
    if (normalizedRole !== 'candidate' || profile.is_active === false || !profile.created_at) {
      return
    }

    const expiresAt = getCandidateAccessExpiryTime(profile.activated_at, profile.created_at)
    if (expiresAt === null) {
      return
    }

    const remainingMs = expiresAt - Date.now()

    if (remainingMs <= 0) {
      void forceCandidateLogout(
        translateText('auth.messages.candidateExpired', { days: CANDIDATE_ACTIVE_DAYS }),
      )
      return
    }

    candidateExpiryTimer = window.setTimeout(async () => {
      try {
        await expireCandidateIfNeeded(userId, profile)
        await forceCandidateLogout(
          translateText('auth.messages.candidateExpired', { days: CANDIDATE_ACTIVE_DAYS }),
        )
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : translateText('auth.messages.candidateExpiryUpdateFailed')
        error.value = message
      }
    }, remainingMs)
  }

  async function initAuth() {
    if (isInitialized.value) {
      return
    }

    if (initPromise) {
      return initPromise
    }

    initPromise = (async () => {
      isLoading.value = true
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) {
          throw sessionError
        }

        const supabaseUser = session?.user
        if (supabaseUser?.email) {
          const profile = await enforceUserAccess(
            supabaseUser.id,
            await fetchUserProfile(supabaseUser.id),
          )

          if (profile.is_active === false) {
            const message = translateText('auth.messages.accountInactive')
            resetAuthAccessScopeCache()
            error.value = message
            await supabase.auth.signOut()
            throw new Error(message)
          }

          user.value = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            ...profile,
          }
        }
      } catch (err) {
        console.error(`${translateText('auth.messages.initializeFailed')}:`, err)
      } finally {
        isLoading.value = false
        isInitialized.value = true
        initPromise = null
      }
    })()

    return initPromise
  }

  async function login(payload: LoginRequest) {
    isLoading.value = true
    error.value = ''

    try {
      const authenticatedUser = await loginUser(authRepo, payload)
      const rawProfile = await fetchUserProfile(authenticatedUser.id)
      const profile = await enforceUserAccess(authenticatedUser.id, rawProfile)
      resetAuthAccessScopeCache()
      user.value = { ...authenticatedUser, ...profile }
      scheduleCandidateExpiry(authenticatedUser.id, profile)
      return user.value
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translateText('auth.messages.loginFailed')
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = ''

    try {
      clearCandidateExpiryTimer()
      resetAuthAccessScopeCache()
      await logoutUser(authRepo)
      user.value = null
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translateText('auth.messages.logoutFailed')
      error.value = message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function changePassword(payload: ChangePasswordRequest) {
    error.value = ''

    try {
      await changePasswordUser(authRepo, payload)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : translateText('profile.password.errors.submitFailed')
      error.value = message
      throw err
    }
  }

  return {
    changePassword,
    error,
    fetchUserProfile,
    hasPermission,
    hasAnyPermission,
    initAuth,
    isInitialized,
    isAuthenticated,
    isLoading,
    login,
    logout,
    user,
    userRole,
    userPermissions,
  }
})
