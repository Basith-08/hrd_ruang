<template>
  <RoleManagementFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import RoleManagementFormPage from "@/features/role/RoleManagementFormPage.vue"

definePageMeta({
  name: "role-management-create",
  requiredPermissions: ["role:manage"],
})
</script>
