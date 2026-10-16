<template>
  <RecruitmentDashboardPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import RecruitmentDashboardPage from "@/features/recruitment/RecruitmentDashboardPage.vue"

definePageMeta({
  name: "recruitment",
  requiredPermissions: ["recruitment:read"],
})
</script>
