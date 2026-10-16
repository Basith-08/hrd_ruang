import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateToMock = vi.fn((value: unknown) => value)
const initAuthMock = vi.fn()
const hasAnyPermissionMock = vi.fn(() => true)

type MockAuthStore = {
  initAuth: ReturnType<typeof vi.fn>
  isAuthenticated: boolean
  userRole: string | null
  hasAnyPermission: ReturnType<typeof vi.fn>
}

function createAuthStore(overrides: Partial<MockAuthStore> = {}): MockAuthStore {
  return {
    initAuth: initAuthMock,
    isAuthenticated: true,
    userRole: 'super_admin',
    hasAnyPermission: hasAnyPermissionMock,
    ...overrides,
  }
}

async function loadMiddleware(store: MockAuthStore) {
  vi.resetModules()
  vi.doMock('#imports', () => ({
    defineNuxtRouteMiddleware: (handler: unknown) => handler,
    navigateTo: navigateToMock,
    useRuntimeConfig: () => ({
      public: {
        candidatePortalUrl: '',
      },
    }),
  }))
  vi.doMock('@/stores/authStore', () => ({
    useAuthStore: () => store,
  }))

  const module = await import('../access.global')
  return module.default as (to: Record<string, any>) => Promise<unknown>
}

describe('access.global middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    initAuthMock.mockResolvedValue(undefined)
    hasAnyPermissionMock.mockReturnValue(true)
  })

  it('redirects authenticated users away from login to the dashboard by default', async () => {
    const middleware = await loadMiddleware(createAuthStore())

    await middleware({
      path: '/login',
      fullPath: '/login',
      query: {},
      meta: {
        public: true,
      },
    })

    expect(initAuthMock).toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects authenticated candidate users away from login to candidate forms by default', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'candidate',
      }),
    )

    await middleware({
      path: '/login',
      fullPath: '/login',
      query: {},
      meta: {
        public: true,
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/candidate-forms')
  })

  it('ignores external login redirect targets for authenticated users', async () => {
    const middleware = await loadMiddleware(createAuthStore())

    await middleware({
      path: '/login',
      fullPath: '/login?redirect=https://evil.example',
      query: {
        redirect: 'https://evil.example',
      },
      meta: {
        public: true,
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects unauthenticated users to login with the requested path', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        isAuthenticated: false,
      }),
    )

    await middleware({
      path: '/approval-tracking',
      fullPath: '/approval-tracking',
      query: {},
      meta: {},
    })

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: {
        redirect: '/approval-tracking',
      },
    })
  })

  it('redirects users without permission back to the dashboard', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        hasAnyPermission: vi.fn(() => false),
      }),
    )

    await middleware({
      path: '/role-management',
      fullPath: '/role-management',
      query: {},
      meta: {
        requiredPermissions: ['role:manage'],
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects candidate users without permission back to candidate forms', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'candidate',
        hasAnyPermission: vi.fn(() => false),
      }),
    )

    await middleware({
      path: '/role-management',
      fullPath: '/role-management',
      query: {},
      meta: {
        requiredPermissions: ['role:manage'],
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/candidate-forms')
  })

  it('blocks candidate users from accessing non-candidate routes', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'candidate',
      }),
    )

    await middleware({
      path: '/dashboard',
      fullPath: '/dashboard',
      query: {},
      meta: {},
    })

    expect(navigateToMock).toHaveBeenCalledWith('/candidate-forms')
  })

  it('allows candidate users to stay on candidate routes', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'candidate',
      }),
    )

    const result = await middleware({
      path: '/candidate-forms/candidate-1/edit',
      fullPath: '/candidate-forms/candidate-1/edit',
      query: {},
      meta: {
        requiredPermissions: ['candidate_form:update'],
      },
    })

    expect(result).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects users whose role is not allowed', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'staff',
      }),
    )

    await middleware({
      path: '/approver-master',
      fullPath: '/approver-master',
      query: {},
      meta: {
        requiredPermissions: ['approval:read'],
        allowedRoles: ['super_admin'],
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects candidate users whose role is not allowed back to candidate forms', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'candidate',
      }),
    )

    await middleware({
      path: '/approver-master',
      fullPath: '/approver-master',
      query: {},
      meta: {
        requiredPermissions: ['approval:read'],
        allowedRoles: ['super_admin'],
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/candidate-forms')
  })

  it('allows access when authentication and authorization checks pass', async () => {
    const middleware = await loadMiddleware(
      createAuthStore({
        userRole: 'super_admin',
      }),
    )

    const result = await middleware({
      path: '/approver-master',
      fullPath: '/approver-master',
      query: {},
      meta: {
        requiredPermissions: ['approval:read'],
        allowedRoles: ['super_admin'],
      },
    })

    expect(result).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
