<template>
  <UserHistoryPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import UserHistoryPage from "@/features/admin/UserHistoryPage.vue"

definePageMeta({
  name: "user-history",
  requiredPermissions: ["user_history:read"],
})
</script>
