<template>
  <ApproverMasterFormPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import ApproverMasterFormPage from "@/features/approvals/ApproverMasterFormPage.vue"

definePageMeta({
  allowedRoles: ["super_admin"],
  name: "approver-master-configure",
  requiredPermissions: ["approval:read"],
})
</script>
