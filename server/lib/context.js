import { createHttpError } from "~~/server/lib/errors.js"
import { uniqueStrings } from "~~/server/lib/utils.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"

function readBearerToken(headers) {
  const authorization = String(headers.authorization ?? "").trim()
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw createHttpError(401, "Unauthorized")
  }

  const accessToken = authorization.slice("bearer ".length).trim()
  if (!accessToken) {
    throw createHttpError(401, "Unauthorized")
  }

  return accessToken
}

function extractRoleInfo(roleData) {
  const role = roleData?.roles ?? null
  const roleName = String(role?.name ?? "").trim() || null
  const permissions = uniqueStrings(
    Array.isArray(role?.role_permissions)
      ? role.role_permissions.map((item) => item?.permissions?.name ?? "")
      : [],
  )

  return {
    roleId: roleData?.role_id ?? null,
    roleName,
    permissions,
  }
}

async function assertUserIsActive(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (profile?.is_active === false) {
    throw createHttpError(403, "Account is inactive.")
  }
}

export async function getRequestContext(headers) {
  const supabase = getSupabaseAdmin()
  const accessToken = readBearerToken(headers)
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error) {
    throw createHttpError(401, error.message || "Unauthorized")
  }

  if (!data.user) {
    throw createHttpError(401, "Unauthorized")
  }

  await assertUserIsActive(supabase, data.user.id)

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select(`
      role_id,
      roles (
        name,
        role_permissions (
          permissions ( name )
        )
      )
    `)
    .eq("user_id", data.user.id)
    .maybeSingle()

  if (roleError) {
    throw new Error(roleError.message)
  }

  const roleInfo = extractRoleInfo(roleData)

  return {
    supabase,
    accessToken,
    authUser: data.user,
    userId: data.user.id,
    roleId: roleInfo.roleId,
    roleName: roleInfo.roleName,
    permissions: roleInfo.permissions,
  }
}

export function requireAnyPermission(context, permissionNames) {
  if (permissionNames.some((permission) => context.permissions.includes(permission))) {
    return
  }

  throw createHttpError(403, "You do not have permission to perform this action.")
}
