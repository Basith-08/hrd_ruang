<template>
  <div class="app-modal-overlay">
    <div class="app-modal-card max-h-[90vh] max-w-5xl overflow-auto">
      <div class="flex items-start justify-between gap-4 border-b app-table-divider px-6 py-5">
        <div>
          <p class="app-page-eyebrow">
            {{ eyebrow }}
          </p>
          <h2 class="app-modal-title mt-2 text-2xl">
            {{ employeeRequestForm?.main_position || noPositionLabel }}
          </h2>
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

        <section class="space-y-3">
          <div class="app-section-panel p-5">
            <h3 class="app-fieldset-label">
              {{ recruiterTitle }}
            </h3>
            <div class="mt-2">
              <p class="app-modal-title mt-2 text-lg">
                {{ recruiterName || '-' }}
              </p>
            </div>
          </div>

          <div class="app-section-panel p-5">
            <h3 class="app-fieldset-label">
              {{ candidatesTitle }}
            </h3>

            <p v-if="loadingCandidates" class="app-copy-body mt-4">
              {{ loadingCandidatesLabel }}
            </p>
            <p v-else-if="candidatesError" class="app-error-text mt-4 text-sm">
              {{ candidatesError }}
            </p>
            <p v-else-if="pipelineCandidates.length === 0" class="app-copy-body mt-4">
              {{ emptyCandidatesLabel }}
            </p>
            <div v-else class="mt-4 space-y-3">
              <div
                v-for="candidate in pipelineCandidates"
                :key="candidate.id"
                :class="candidate.isSelected ? 'app-state-card app-state-card-success' : 'app-state-card app-state-card-neutral'"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div v-if="candidate.isSelected" class="mb-2">
                      <span class="app-status-chip app-status-chip-success">
                        {{ selectedCandidateLabel }}
                      </span>
                    </div>
                    <p class="app-copy-strong">
                      {{ candidate.name }}
                    </p>
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="app-fieldset-label">
                      {{ interviewDateLabel }}
                    </p>
                    <p class="app-copy-strong mt-2 text-sm">
                      {{ candidate.interviewDate }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { EmployeeRequestForm } from '@/domain/entities/EmployeeRequestForm'
import ApprovalTrackingErfDetailSection from '@/features/approvals/components/ApprovalTrackingErfDetailSection.vue'
import type {
  ApprovalTrackingAttachmentSection,
  ApprovalTrackingDetailField,
} from '@/features/approvals/types/ApprovalTrackingPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'

defineProps({
  employeeRequestForm: {
    type: Object as PropType<EmployeeRequestForm | null>,
    default: null,
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
  candidatesTitle: {
    type: String,
    required: true,
  },
  recruiterTitle: {
    type: String,
    required: true,
  },
  recruiterName: {
    type: String,
    required: true,
  },
  pipelineCandidates: {
    type: Array as PropType<Array<{ id: string; name: string; interviewDate: string; isSelected: boolean }>>,
    default: () => [],
  },
  loadingCandidates: {
    type: Boolean,
    required: true,
  },
  loadingCandidatesLabel: {
    type: String,
    required: true,
  },
  emptyCandidatesLabel: {
    type: String,
    required: true,
  },
  candidatesError: {
    type: String,
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
  interviewDateLabel: {
    type: String,
    required: true,
  },
  selectedCandidateLabel: {
    type: String,
    required: true,
  },
})

defineEmits<{
  (event: 'close'): void
}>()
</script>
