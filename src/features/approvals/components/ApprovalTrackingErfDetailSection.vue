<template>
  <div class="app-surface-card p-5">
    <h3 class="app-label-compact">
      {{ title }}
    </h3>
    <AppInfoGrid class="mt-4" :fields="fields" />
    <p class="app-helper-text mt-4">
      {{ fileClickHintLabel }}
    </p>

    <div class="mt-5 grid gap-4 md:grid-cols-2">
      <ApprovalTrackingAttachmentPreview
        v-for="section in attachmentSections"
        :key="section.key"
        :section="section"
        :loading="loadingFiles"
        :loading-label="loadingFilesLabel"
        :empty-label="noFilesLabel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import ApprovalTrackingAttachmentPreview from '@/features/approvals/components/ApprovalTrackingAttachmentPreview.vue'
import type {
  ApprovalTrackingAttachmentSection,
  ApprovalTrackingDetailField,
} from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppInfoGrid from '@/presentation/components/data/AppInfoGrid.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  fields: {
    type: Array as PropType<ApprovalTrackingDetailField[]>,
    default: () => [],
  },
  attachmentSections: {
    type: Array as PropType<ApprovalTrackingAttachmentSection[]>,
    default: () => [],
  },
  loadingFiles: {
    type: Boolean,
    required: true,
  },
  loadingFilesLabel: {
    type: String,
    required: true,
  },
  noFilesLabel: {
    type: String,
    required: true,
  },
  fileClickHintLabel: {
    type: String,
    required: true,
  },
})
</script>
