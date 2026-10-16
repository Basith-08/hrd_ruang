<template>
  <NuxtLayout v-if="!isCandidateRole" name="default">
    <slot />
  </NuxtLayout>

  <div v-else class="app-shell">
    <main class="app-shell-content px-5 py-8 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useHead, useRoute } from "#imports"
import { useLocale } from "@/composables/useLocale"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"

const route = useRoute()
const { userRole } = useAuthViewModel()
const { text } = useLocale()
const isCandidateRole = computed(() => String(userRole.value ?? "").toLowerCase() === "candidate")

const pageTitle = computed(() => {
  if (route.path.endsWith("/edit")) {
    return text("page.candidateForms.editForm")
  }

  if (route.path.endsWith("/create")) {
    return text("page.candidateForms.newForm")
  }

  if (/^\/candidate-forms\/[^/]+$/.test(route.path)) {
    return text("page.candidateForms.formDetails")
  }

  return text("page.candidateEmployeeForms")
})

useHead(() => ({
  title: pageTitle.value,
}))
</script>
