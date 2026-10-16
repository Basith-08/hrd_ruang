<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <AppToastProvider />
    <AppConfirmProvider />
  </ClientOnly>
</template>

<script setup lang="ts">
import AppConfirmProvider from "@/presentation/components/feedback/AppConfirmProvider.vue"
import AppToastProvider from "@/presentation/components/feedback/AppToastProvider.vue"
import { useLocale } from "@/composables/useLocale"

useLocale()
</script>
