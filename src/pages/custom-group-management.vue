<template>
  <CustomGroupManagementPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import CustomGroupManagementPage from "@/features/admin/CustomGroupManagementPage.vue"

definePageMeta({
  allowedRoles: ["super_admin"],
  name: "custom-group-management",
  requiredPermissions: ["user:read"],
})
</script>
