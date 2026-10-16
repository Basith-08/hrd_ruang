import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "#imports"
import { isExternalRouteTarget } from "@/infrastructure/security/candidatePortal"
import { getDefaultRouteForRole } from "@/infrastructure/security/defaultRoute"
import { getSafeInternalRedirect } from "@/infrastructure/security/safeRedirect"
import { useAuthStore } from "@/stores/authStore"

function isAdminRole(role: string | null | undefined) {
  return String(role ?? '').toLowerCase().trim() === 'super_admin'
}

function isCandidateRoute(path: string) {
  return path === "/candidate-forms" || path.startsWith("/candidate-forms/")
}

export default defineNuxtRouteMiddleware(async (to: any) => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  await authStore.initAuth()

  const navigateToRoleDefault = (role: string | null | undefined) => {
    const target = getDefaultRouteForRole(role, runtimeConfig.public.candidatePortalUrl)
    if (isExternalRouteTarget(target)) {
      return navigateTo(target, { external: true })
    }

    return navigateTo(target)
  }

  if (to.meta.public) {
    if (to.path === "/login" && authStore.isAuthenticated) {
      const redirect = getSafeInternalRedirect(to.query.redirect)
      if (redirect) {
        return navigateTo(redirect)
      }

      return navigateToRoleDefault(authStore.userRole)
    }

    return
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    })
  }

  const normalizedRole = String(authStore.userRole ?? "").toLowerCase()

  if (normalizedRole === "candidate" && !isCandidateRoute(to.path)) {
    return navigateToRoleDefault(authStore.userRole)
  }

  const requiredPermissions = Array.isArray(to.meta.requiredPermissions)
    ? (to.meta.requiredPermissions as string[])
    : []

  const allowAdminAccessWithoutPermissions = to.meta.allowAdminAccessWithoutPermissions === true
  if (
    requiredPermissions.length > 0 &&
    !authStore.hasAnyPermission(requiredPermissions) &&
    !(allowAdminAccessWithoutPermissions && isAdminRole(authStore.userRole))
  ) {
    if (to.path === "/dashboard") {
      return navigateTo("/profile")
    }

    return navigateToRoleDefault(authStore.userRole)
  }

  const allowedRoles = Array.isArray(to.meta.allowedRoles)
    ? (to.meta.allowedRoles as string[])
    : []

  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase())

    if (!normalizedAllowedRoles.includes(normalizedRole)) {
      return navigateToRoleDefault(authStore.userRole)
    }
  }
})
