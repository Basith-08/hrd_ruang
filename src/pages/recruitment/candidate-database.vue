<template>
  <RecruitmentCandidateDatabasePage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import RecruitmentCandidateDatabasePage from '@/features/recruitment/RecruitmentCandidateDatabasePage.vue'

definePageMeta({
  name: 'recruitment-candidate-database',
  requiredPermissions: ['recruitment:candidate_database'],
})
</script>
