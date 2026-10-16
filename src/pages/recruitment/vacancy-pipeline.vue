<template>
  <VacancyPipelinePage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import VacancyPipelinePage from "@/features/recruitment/VacancyPipelinePage.vue"

definePageMeta({
  name: "recruitment-vacancy-pipeline",
  requiredPermissions: ["recruitment:vacancy_pipeline"],
})
</script>
