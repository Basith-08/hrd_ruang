<template>
  <MasterDataManagementPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import MasterDataManagementPage from "@/features/admin/MasterDataManagementPage.vue"

definePageMeta({
  allowedRoles: ["super_admin"],
  name: "master-data-management",
  requiredPermissions: ["user:read"],
})
</script>
