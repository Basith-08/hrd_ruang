<template>
  <UserManagementPage scope="candidateEmployee" />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import UserManagementPage from "@/features/admin/UserManagementPage.vue"

definePageMeta({
  name: "candidate-employees",
  requiredPermissions: ["candidate_employee:read", "user:read"],
})
</script>
