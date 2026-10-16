<template>
  <DashboardPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import DashboardPage from "@/features/dashboard/DashboardPage.vue"

definePageMeta({
  name: "dashboard",
  requiredPermissions: ["dashboard:read"],
})
</script>
