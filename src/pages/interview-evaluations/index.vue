<template>
  <InterviewEvaluationsPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import InterviewEvaluationsPage from "@/features/interviewEvaluations/InterviewEvaluationsPage.vue"

definePageMeta({
  name: "interview-evaluations",
  requiredPermissions: ["interview_evaluation:interviewer_form", "interview_evaluation:read"],
  allowAdminAccessWithoutPermissions: true,
})
</script>
