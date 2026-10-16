<template>
  <InterviewEvaluationPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import InterviewEvaluationPage from "@/features/interviewEvaluations/InterviewEvaluationPage.vue"

definePageMeta({
  name: "interview-evaluations-manage",
  requiredPermissions: [
    "interview_evaluation:read",
    "interview_evaluation:create",
    "interview_evaluation:update",
  ],
})
</script>
