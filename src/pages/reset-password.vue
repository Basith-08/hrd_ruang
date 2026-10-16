<template>
  <ResetPasswordPage />
</template>

<script setup lang="ts">
import { definePageMeta, useHead } from "#imports"
import { useLocale } from "@/composables/useLocale"
import ResetPasswordPage from "@/features/auth/ResetPasswordPage.vue"

definePageMeta({
  layout: false,
  name: "reset-password",
  public: true,
})

const { text } = useLocale()

useHead(() => ({
  title: text("resetPassword.title"),
}))
</script>
