<template>
  <CandidateFormList v-if="!candidatePortalTarget" />
</template>

<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from "#imports"
import { getCandidatePortalRoute, shouldRedirectCandidateToPortal } from "@/infrastructure/security/candidatePortal"
import CandidateFormList from "@/features/candidateForms/CandidateFormList.vue"
import { useAuthStore } from "@/stores/authStore"

definePageMeta({
  layout: "candidate",
  name: "candidate-forms",
  requiredPermissions: ["candidate_form:read", "employee_form:read", "candidate_employee:read", "user:read"],
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
} else if (authStore.hasAnyPermission(["candidate_employee:read", "user:read"])) {
  await navigateTo('/candidate-employees', { replace: true })
}
</script>
