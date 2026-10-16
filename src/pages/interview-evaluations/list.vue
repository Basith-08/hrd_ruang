<template>
  <InterviewEvaluationsPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import InterviewEvaluationsPage from "@/features/interviewEvaluations/InterviewEvaluationsPage.vue"

definePageMeta({
  name: "interview-evaluations-list",
  requiredPermissions: [
    "interview_evaluation:read",
    "interview_evaluation:interviewer_form",
  ],
  allowAdminAccessWithoutPermissions: true,
})
</script>
