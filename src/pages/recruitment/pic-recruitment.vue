<template>
  <PicRecruitmentPage />
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import PicRecruitmentPage from '@/features/recruitment/PicRecruitmentPage.vue'

definePageMeta({
  name: 'recruitment-pic-recruitment',
  requiredPermissions: [
    'pic_recruitment:read',
    'recruitment:pic_recruitment_read',
  ],
})
</script>
