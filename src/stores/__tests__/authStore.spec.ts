import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const loginUserMock = vi.fn()
const logoutUserMock = vi.fn()
const changePasswordUserMock = vi.fn()
const getSessionMock = vi.fn()
const signOutMock = vi.fn()
const callBackendApiMock = vi.fn()

vi.mock('@/application/usecases/loginUser', () => ({
  loginUser: loginUserMock,
}))

vi.mock('@/application/usecases/logoutUser', () => ({
  logoutUser: logoutUserMock,
}))

vi.mock('@/application/usecases/changePasswordUser', () => ({
  changePasswordUser: changePasswordUserMock,
}))

vi.mock('@/composables/useAppRepositories', () => ({
  useAppRepositories: () => ({
    authRepo: {},
  }),
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      signOut: signOutMock,
    },
  },
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useRealTimers()
    history.pushState({}, '', '/login')
    callBackendApiMock.mockResolvedValue({
      username: 'john',
      full_name: 'John Doe',
      first_name: 'John Doe',
      phone: '08123',
      avatar_url: 'avatar.png',
      created_at: '2026-03-10T08:00:00',
      email: 'john@example.com',
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      main_position: 'Engineer',
      is_active: true,
      personal_data: {
        city: 'Jakarta',
      },
      role: 'super_admin',
      permissions: ['approval:read', 'approval:action'],
    })

    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    })

    signOutMock.mockResolvedValue(undefined)
    loginUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
    })
    logoutUserMock.mockResolvedValue(undefined)
    changePasswordUserMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps the Supabase profile and permissions into a user profile object', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()

    const profile = await store.fetchUserProfile('user-1')

    expect(profile).toMatchObject({
      username: 'john',
      full_name: 'John Doe',
      first_name: 'John Doe',
      phone: '08123',
      avatar_url: 'avatar.png',
      department_id: 'dep-1',
      master_designation_id: 'des-1',
      main_position: 'Engineer',
      is_active: true,
      role: 'super_admin',
      permissions: ['approval:read', 'approval:action'],
    })
  })

  it('logs in, hydrates the user profile, and exposes permission helpers', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()

    const result = await store.login({
      identifier: 'john@example.com',
      password: 'secret',
    })

    expect(loginUserMock).toHaveBeenCalled()
    expect(result?.email).toBe('john@example.com')
    expect(store.isAuthenticated).toBe(true)
    expect(store.userRole).toBe('super_admin')
    expect(store.hasPermission('approval:read')).toBe(true)
    expect(store.hasAnyPermission(['missing', 'approval:action'])).toBe(true)
    expect(store.error).toBe('')
  })

  it('initializes the session from Supabase user data', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()

    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'john@example.com',
          },
        },
      },
      error: null,
    })

    await store.initAuth()

    expect(store.user?.id).toBe('user-1')
    expect(store.user?.email).toBe('john@example.com')
    expect(store.user?.full_name).toBe('John Doe')
    expect(store.isLoading).toBe(false)
  })

  it('forces logout for expired candidate access during initialization', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'candidate-1',
            email: 'candidate@example.com',
          },
        },
      },
      error: null,
    })

    callBackendApiMock.mockResolvedValue({
      username: 'candidate',
      full_name: 'Candidate User',
      created_at: '2024-01-01T08:00:00',
      is_active: true,
      role: 'candidate',
      permissions: [],
    })

    await store.initAuth()

    expect(signOutMock).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.error).toContain('access')

    consoleErrorSpy.mockRestore()
  })

  it('logs out the active user and clears the store state', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()

    store.user = {
      id: 'user-1',
      email: 'john@example.com',
      permissions: ['approval:read'],
    }

    await store.logout()

    expect(logoutUserMock).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBe('')
  })

  it('changes password through the auth repository use case', async () => {
    const { useAuthStore } = await import('../authStore')
    const store = useAuthStore()

    await store.changePassword({
      currentPassword: 'secret123',
      newPassword: 'newsecret123',
    })

    expect(changePasswordUserMock).toHaveBeenCalledWith(
      {},
      {
        currentPassword: 'secret123',
        newPassword: 'newsecret123',
      },
    )
    expect(store.error).toBe('')
  })
})
