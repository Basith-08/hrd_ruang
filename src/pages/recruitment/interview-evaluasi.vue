<template>
  <InterviewEvaluasiPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import InterviewEvaluasiPage from "@/features/recruitment/InterviewEvaluasiPage.vue"

definePageMeta({
  name: "recruitment-interview-evaluasi",
  requiredPermissions: ["recruitment:interview_evaluasi"],
})
</script>
