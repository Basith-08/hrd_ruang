<template>
  <UserManagementFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import UserManagementFormPage from "@/features/admin/UserManagementFormPage.vue"

definePageMeta({
  name: "user-management-edit",
  requiredPermissions: ["user:update"],
})
</script>
