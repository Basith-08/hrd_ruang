import { onMounted, ref } from "vue"

import { useAppRepositories } from "@/composables/useAppRepositories"
import type { Role, Permission } from "@/domain/entities/Role"
import type { UpdateRolePermissionsRequest } from "@/domain/requests/RoleRequest"
import { useAuthStore } from "@/stores/authStore"
import { getAllRoles } from "@/application/usecases/getAllRoles"
import { getAllPermissions } from "@/application/usecases/getAllPermissions"
import { createRole as createRoleUseCase } from "@/application/usecases/createRole"
import { updateRolePermissions as updateRolePermissionsUseCase } from "@/application/usecases/updateRolePermissions"
import { deleteRole as deleteRoleUseCase } from "@/application/usecases/deleteRole"
import { translateText } from "@/composables/useLocale"

export function useRoleManagementViewModel() {
  const { roleRepo } = useAppRepositories()
  const authStore = useAuthStore()

  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref("")

  async function refreshRoles() {
    loading.value = true
    error.value = ""
    try {
      roles.value = await getAllRoles(roleRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("roleManagement.loadRolesFailed")
    } finally {
      loading.value = false
    }
  }

  async function refreshPermissions() {
    try {
      permissions.value = await getAllPermissions(roleRepo)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("roleManagement.loadPermissionsFailed")
    }
  }

  async function initialize() {
    loading.value = true
    error.value = ""

    try {
      const [rolesResult, permissionsResult] = await Promise.allSettled([
        getAllRoles(roleRepo),
        getAllPermissions(roleRepo),
      ])

      if (rolesResult.status === "fulfilled") {
        roles.value = rolesResult.value
      } else {
        const message =
          rolesResult.reason instanceof Error
            ? rolesResult.reason.message
            : translateText("roleManagement.loadRolesFailed")
        error.value = message
      }

      if (permissionsResult.status === "fulfilled") {
        permissions.value = permissionsResult.value
      } else if (!error.value) {
        error.value =
          permissionsResult.reason instanceof Error
            ? permissionsResult.reason.message
            : translateText("roleManagement.loadPermissionsFailed")
      }
    } finally {
      loading.value = false
    }
  }

  async function createRole(name: string, description?: string, permissionIds: string[] = []) {
    saving.value = true
    error.value = ""
    try {
      const newRole = await createRoleUseCase(roleRepo, name, description)
      if (permissionIds.length > 0) {
        const permissionRequest: UpdateRolePermissionsRequest = {
          role_id: newRole.id,
          permission_ids: permissionIds,
        }
        await updateRolePermissionsUseCase(roleRepo, permissionRequest)
      }
      await refreshRoles()
      if (authStore.userRole === name) {
        await authStore.fetchUserProfile(authStore.user!.id)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("roleManagement.createFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateRole(roleId: string, name: string, description?: string, permissionIds: string[] = []) {
    saving.value = true
    error.value = ""
    try {
      await updateRolePermissionsUseCase(roleRepo, {
        role_id: roleId,
        permission_ids: permissionIds,
      })
      await refreshRoles()
      const role = roles.value.find((r) => r.id === roleId)
      if (role && authStore.userRole === role.name && authStore.user?.id) {
        const profile = await authStore.fetchUserProfile(authStore.user.id)
        if (authStore.user) {
          authStore.user.permissions = profile.permissions
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("roleManagement.updatePermissionsFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  async function deleteRole(roleId: string) {
    saving.value = true
    error.value = ""
    try {
      await deleteRoleUseCase(roleRepo, roleId)
      await refreshRoles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translateText("roleManagement.deleteFailed")
      throw err
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    initialize()
  })

  return {
    roles,
    permissions,
    loading,
    saving,
    error,
    initialize,
    refreshRoles,
    refreshPermissions,
    createRole,
    updateRole,
    deleteRole,
  }
}
