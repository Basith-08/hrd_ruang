<template>
  <RoleManagementPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import RoleManagementPage from "@/features/role/RoleManagementPage.vue"

definePageMeta({
  name: "role-management",
  requiredPermissions: ["role:manage"],
})
</script>
