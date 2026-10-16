<template>
  <ProfilePage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import ProfilePage from "@/features/profile/ProfilePage.vue"

definePageMeta({
  name: "profile",
})
</script>
