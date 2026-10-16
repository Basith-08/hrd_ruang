<template>
  <InterviewerEvaluationPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import InterviewerEvaluationPage from "@/features/interviewEvaluations/InterviewerEvaluationPage.vue"

definePageMeta({
  name: "interview-evaluations-evaluate",
  requiredPermissions: ["interview_evaluation:interviewer_form", "interview_evaluation:read"],
})
</script>
