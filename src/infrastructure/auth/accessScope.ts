import { supabase } from '@/infrastructure/supabase/client'

export type AuthAccessScope = {
  isManager: boolean
  permissions: string[]
  roleName: string | null
  userId: string | null
}

let cachedScope: AuthAccessScope | null = null
let cachedUserId: string | null | undefined
let pendingScopePromise: Promise<AuthAccessScope> | null = null
let pendingUserId: string | null | undefined
let pendingSessionUserIdPromise: Promise<string | null> | null = null

function normalizeRoleName(roleName: unknown) {
  const normalizedRoleName = String(roleName ?? '').trim().toLowerCase()
  return normalizedRoleName || null
}

export function resetAuthAccessScopeCache() {
  cachedScope = null
  cachedUserId = undefined
  pendingScopePromise = null
  pendingUserId = undefined
  pendingSessionUserIdPromise = null
}

async function getSessionUserId() {
  if (!pendingSessionUserIdPromise) {
    pendingSessionUserIdPromise = (async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(sessionError.message)
      }

      return String(session?.user?.id ?? '').trim() || null
    })().finally(() => {
      pendingSessionUserIdPromise = null
    })
  }

  return pendingSessionUserIdPromise
}

export async function getAuthAccessScope(): Promise<AuthAccessScope> {
  const userId = await getSessionUserId()

  if (cachedScope && cachedUserId === userId) {
    return cachedScope
  }

  if (pendingScopePromise && pendingUserId === userId) {
    return pendingScopePromise
  }

  if (!userId) {
    const anonymousScope = {
      isManager: false,
      permissions: [],
      roleName: null,
      userId: null,
    }
    cachedScope = anonymousScope
    cachedUserId = null
    return anonymousScope
  }

  pendingUserId = userId
  pendingScopePromise = (async () => {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('roles(name, role_permissions(permissions(name)))')
      .eq('user_id', userId)
      .maybeSingle()

    if (roleError) {
      throw new Error(roleError.message)
    }

    const role = (roleData as {
      roles?: {
        name?: string
        role_permissions?: Array<{ permissions?: { name?: string | null } | null }> | null
      } | null
    } | null)?.roles
    const roleName = normalizeRoleName(role?.name)
    const permissions = [
      ...new Set(
        (Array.isArray(role?.role_permissions) ? role.role_permissions : [])
          .map((item) => String(item?.permissions?.name ?? '').trim())
          .filter(Boolean),
      ),
    ]

    const scope = {
      isManager: roleName === 'manager',
      permissions,
      roleName,
      userId,
    }

    cachedScope = scope
    cachedUserId = userId
    return scope
  })()

  try {
    return await pendingScopePromise
  } finally {
    pendingScopePromise = null
    pendingUserId = undefined
  }
}
