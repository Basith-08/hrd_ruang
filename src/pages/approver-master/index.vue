<template>
  <ApproverMasterPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import ApproverMasterPage from "@/features/approvals/ApproverMasterPage.vue"

definePageMeta({
  allowedRoles: ["super_admin"],
  name: "approver-master",
  requiredPermissions: ["approval:read"],
})
</script>
