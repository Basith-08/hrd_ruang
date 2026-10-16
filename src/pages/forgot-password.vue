<template>
  <ForgotPasswordPage />
</template>

<script setup lang="ts">
import { definePageMeta, useHead } from "#imports"
import { useLocale } from "@/composables/useLocale"
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage.vue"

definePageMeta({
  layout: false,
  name: "forgot-password",
  public: true,
})

const { text } = useLocale()

useHead(() => ({
  title: text("forgotPassword.title"),
}))
</script>
