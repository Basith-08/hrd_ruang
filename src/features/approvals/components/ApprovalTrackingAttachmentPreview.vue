<template>
  <AppAttachmentPreviewCard
    :title="section.label"
    :items="section.items"
    :loading="loading"
    :loading-label="loadingLabel"
    :empty-label="emptyLabel"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { ApprovalTrackingAttachmentSection } from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppAttachmentPreviewCard from '@/presentation/components/files/AppAttachmentPreviewCard.vue'

defineProps({
  section: {
    type: Object as PropType<ApprovalTrackingAttachmentSection>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
  emptyLabel: {
    type: String,
    required: true,
  },
})
</script>
