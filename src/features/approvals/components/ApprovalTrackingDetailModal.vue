<template>
  <div class="app-modal-overlay">
    <div class="app-modal-card max-h-[90vh] max-w-5xl overflow-auto">
      <div class="app-table-divider flex items-start justify-between gap-4 border-b px-6 py-5">
        <div>
          <p class="app-page-eyebrow">
            {{ eyebrow }}
          </p>
          <h2 class="app-modal-title mt-2 text-2xl">
            {{ chain.employee_request_form?.main_position || noPositionLabel }}
          </h2>
          <p class="app-modal-description mt-2">
            {{ approvalScopeText }}
          </p>
        </div>
        <AppActionButton
          variant="secondary"
          :label="closeLabel"
          @click="$emit('close')"
        />
      </div>

      <div class="grid gap-6 p-6">
        <section class="space-y-5">
          <ApprovalTrackingErfDetailSection
            :title="erfDetailLabel"
            :fields="detailFields"
            :attachment-sections="attachmentSections"
            :loading-files="loadingFiles"
            :loading-files-label="loadingFilesLabel"
            :no-files-label="noFilesLabel"
            :file-click-hint-label="fileClickHintLabel"
          />
        </section>

        <aside class="space-y-3">
          <ApprovalTrackingScopeCard
            :title="approvalScopeLabel"
            :scope-text="approvalScopeText"
            :signed-in-as-text="signedInAsText"
            :notice="notice"
          />

          <ApprovalTrackingActionCard
            v-if="canApprove"
            :title="notesLabel"
            :note-value="noteValue"
            :notes-placeholder="notesPlaceholder"
            :approve-label="approveLabel"
            :reject-label="rejectLabel"
            :saving="saving"
            @update:note-value="$emit('update:noteValue', $event)"
            @approve="$emit('approve')"
            @reject="$emit('reject')"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { ApprovalChain, ApprovalStep } from '@/domain/entities/ApprovalChain'
import ApprovalTrackingActionCard from '@/features/approvals/components/ApprovalTrackingActionCard.vue'
import ApprovalTrackingErfDetailSection from '@/features/approvals/components/ApprovalTrackingErfDetailSection.vue'
import ApprovalTrackingScopeCard from '@/features/approvals/components/ApprovalTrackingScopeCard.vue'
import type {
  ApprovalTrackingAttachmentSection,
  ApprovalTrackingDetailField,
  ApprovalTrackingNotice,
} from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'

defineProps({
  chain: {
    type: Object as PropType<ApprovalChain>,
    required: true,
  },
  step: {
    type: Object as PropType<ApprovalStep>,
    required: true,
  },
  detailFields: {
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
  eyebrow: {
    type: String,
    required: true,
  },
  noPositionLabel: {
    type: String,
    required: true,
  },
  closeLabel: {
    type: String,
    required: true,
  },
  erfDetailLabel: {
    type: String,
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
  approvalScopeLabel: {
    type: String,
    required: true,
  },
  approvalScopeText: {
    type: String,
    required: true,
  },
  signedInAsText: {
    type: String,
    required: true,
  },
  notice: {
    type: Object as PropType<ApprovalTrackingNotice>,
    required: true,
  },
  canApprove: {
    type: Boolean,
    required: true,
  },
  notesLabel: {
    type: String,
    required: true,
  },
  noteValue: {
    type: String,
    default: '',
  },
  notesPlaceholder: {
    type: String,
    required: true,
  },
  approveLabel: {
    type: String,
    required: true,
  },
  rejectLabel: {
    type: String,
    required: true,
  },
  saving: {
    type: Boolean,
    required: true,
  },
})

defineEmits<{
  (event: 'close'): void
  (event: 'update:noteValue', value: string): void
  (event: 'approve'): void
  (event: 'reject'): void
}>()
</script>
