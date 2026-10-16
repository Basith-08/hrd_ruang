<template>
  <UserManagementPage scope="users" />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import UserManagementPage from "@/features/admin/UserManagementPage.vue"

definePageMeta({
  name: "user-management",
  requiredPermissions: ["user:read"],
})
</script>
