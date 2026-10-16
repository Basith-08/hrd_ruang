<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from "#imports"
import { isExternalRouteTarget } from "@/infrastructure/security/candidatePortal"
import { getDefaultRouteForRole } from "@/infrastructure/security/defaultRoute"
import { useAuthStore } from "@/stores/authStore"

definePageMeta({
  layout: false,
})

const authStore = useAuthStore()
const runtimeConfig = useRuntimeConfig()

const target = getDefaultRouteForRole(authStore.userRole, runtimeConfig.public.candidatePortalUrl)
await navigateTo(target, isExternalRouteTarget(target) ? { external: true } : undefined)
</script>
