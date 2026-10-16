<template>
  <RecruitmentDocumentExplorerPage />
</template>

<script setup lang="ts">
import { definePageMeta } from "#imports"
import RecruitmentDocumentExplorerPage from "@/features/recruitment/RecruitmentDocumentExplorerPage.vue"

definePageMeta({
  name: "recruitment-document-explorer",
  requiredPermissions: ["recruitment:document_explorer"],
})
</script>
