<template>
  <ApprovalTrackingPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import ApprovalTrackingPage from "@/features/approvals/ApprovalTrackingPage.vue"

definePageMeta({
  name: "approval-tracking",
  requiredPermissions: ["approval:read"],
})
</script>
