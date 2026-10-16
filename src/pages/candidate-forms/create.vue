<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from "#imports"
import { getCandidatePortalRoute, shouldRedirectCandidateToPortal } from "@/infrastructure/security/candidatePortal"
import { useAuthStore } from "@/stores/authStore"

definePageMeta({
  layout: "candidate",
  name: "candidate-forms-create",
  requiredPermissions: ["candidate_form:read", "employee_form:read"],
  allowAdminAccessWithoutPermissions: true,
})

const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const candidatePortalTarget = shouldRedirectCandidateToPortal(
  authStore.userRole,
  runtimeConfig.public.candidatePortalUrl,
)
  ? getCandidatePortalRoute(runtimeConfig.public.candidatePortalUrl)
  : ''

if (candidatePortalTarget) {
  await navigateTo(candidatePortalTarget, { external: true, replace: true })
} else {
  await navigateTo('/candidate-forms', { replace: true })
}
</script>
