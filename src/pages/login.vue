<template>
  <LoginPage />
</template>

<script setup lang="ts">
import { definePageMeta, useHead } from "#imports"
import { useLocale } from "@/composables/useLocale"
import LoginPage from "@/features/auth/LoginPage.vue"

definePageMeta({
  layout: false,
  name: "login",
  public: true,
})

const { text } = useLocale()

useHead(() => ({
  title: text("page.login"),
}))
</script>
