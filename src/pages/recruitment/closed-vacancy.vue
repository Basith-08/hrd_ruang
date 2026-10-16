<template>
  <VacancyPipelinePage status-mode="closed" />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import VacancyPipelinePage from "@/features/recruitment/VacancyPipelinePage.vue"

definePageMeta({
  name: "recruitment-closed-vacancy",
  requiredPermissions: ["recruitment:closed_vacancy"],
})
</script>
