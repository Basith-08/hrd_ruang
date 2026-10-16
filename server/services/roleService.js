import { REQUIRED_APP_PERMISSIONS } from "~~/server/constants/permissions.js"
import { requireAnyPermission } from "~~/server/lib/context.js"

async function ensureCorePermissionsExist(supabase) {
  const { error: syncError } = await supabase
    .from("permissions")
    .upsert(REQUIRED_APP_PERMISSIONS, {
      onConflict: "name",
    })

  if (syncError) {
    throw new Error(syncError.message)
  }

  const { data: permissions, error } = await supabase
    .from("permissions")
    .select("id, name, description, created_at")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return permissions ?? []
}

export async function loadRoles(context) {
  requireAnyPermission(context, ["role:manage"])

  const { data, error } = await context.supabase
    .from("roles")
    .select(
      "id, name, description, created_at, role_permissions(permissions(id, name, description, created_at))",
    )
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    created_at: role.created_at,
    permissions: Array.isArray(role.role_permissions)
      ? role.role_permissions.map((rolePermission) => rolePermission.permissions).filter(Boolean)
      : [],
  }))
}

export async function loadPermissions(context) {
  requireAnyPermission(context, ["role:manage"])
  return ensureCorePermissionsExist(context.supabase)
}

export async function createRole(context, name, description) {
  requireAnyPermission(context, ["role:manage"])

  const { data, error } = await context.supabase
    .from("roles")
    .insert({ name, description })
    .select("id, name, description, created_at")
    .single()

  if (error) {
    throw new Error(`Failed to create role: ${error.message}`)
  }

  return {
    ...data,
    permissions: [],
  }
}

export async function updateRolePermissions(context, roleId, permissionIds) {
  requireAnyPermission(context, ["role:manage"])

  const { error: deleteError } = await context.supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId)

  if (deleteError) {
    throw new Error(`Failed to reset old permissions: ${deleteError.message}`)
  }

  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return
  }

  const inserts = permissionIds.map((permissionId) => ({
    role_id: roleId,
    permission_id: permissionId,
  }))

  const { error: insertError } = await context.supabase.from("role_permissions").insert(inserts)
  if (insertError) {
    throw new Error(`Failed to save new permissions: ${insertError.message}`)
  }
}

export async function deleteRole(context, roleId) {
  requireAnyPermission(context, ["role:manage"])

  const { error } = await context.supabase.from("roles").delete().eq("id", roleId)
  if (error) {
    throw new Error(`Failed to delete role: ${error.message}`)
  }
}
