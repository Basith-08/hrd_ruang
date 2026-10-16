<template>
  <section class="space-y-4">
    <div class="space-y-1">
      <h3 class="app-section-title-compact text-xl">{{ title }}</h3>
      <p v-if="description" class="app-copy-body">{{ description }}</p>
    </div>
    <div class="candidate-form-document-grid">
      <div
        v-for="entry in visibleEntries"
        :key="entry.documentType"
        class="candidate-form-document-card relative"
      >
        <div class="candidate-form-document-card__header">
          <p class="app-card-title">{{ entry.label }}</p>
          <span class="candidate-form-document-count">
            {{ entry.files.length }}
            {{ entry.files.length !== 1 ? text('candidateForms.form.labels.files') : text('candidateForms.form.labels.file') }}
          </span>
        </div>
        <ul class="candidate-form-document-chip-list">
          <li v-for="path in entry.files" :key="path" class="candidate-form-document-chip-item">
            <button
              type="button"
              class="candidate-form-document-chip candidate-form-document-chip--interactive"
              :disabled="!onOpenFile || openingDocumentKeys.includes(getDocumentOpenKey(entry.documentType, path))"
              @click="onOpenFile?.(entry.documentType, path)"
            >
              <span
                v-if="openingDocumentKeys.includes(getDocumentOpenKey(entry.documentType, path))"
                class="candidate-form-document-chip__overlay"
              >
                <span class="candidate-form-document-chip__overlay-content">
                  <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
                  <span>{{ openingDocumentLabel }}</span>
                </span>
              </span>
              {{ getReadableEmployeeDocumentFileName(entry.documentType, path) }}
            </button>
            <button
              v-if="entry.editable && onRemoveUploadedFile"
              type="button"
              class="candidate-form-document-chip-remove"
              :disabled="removingDocumentKeys.includes(getDocumentOpenKey(entry.documentType, path))"
              :aria-label="text('candidateForms.form.employeeDocuments.actions.remove')"
              :title="text('candidateForms.form.employeeDocuments.actions.remove')"
              @click="onRemoveUploadedFile(entry.documentType, path)"
            >
              <LoaderCircle
                v-if="removingDocumentKeys.includes(getDocumentOpenKey(entry.documentType, path))"
                class="h-3.5 w-3.5 animate-spin"
              />
              <X v-else class="h-3.5 w-3.5" />
            </button>
          </li>
        </ul>
        <div v-if="entry.editable" class="mt-4 space-y-3">
          <input
            class="candidate-form-field app-file-input text-sm"
            type="file"
            multiple
            :accept="documentAccept"
            :disabled="isBusy"
            @change="onSelectFiles?.(entry.documentType, $event)"
          />
          <p class="app-helper-text">
            {{ uploadHelperText || text('candidateForms.form.employeeDocuments.uploadHelper') }}
          </p>
          <ul v-if="entry.selectedFiles?.length" class="candidate-form-document-chip-list">
            <li
              v-for="(file, index) in entry.selectedFiles"
              :key="`${entry.documentType}-${file.name}-${file.lastModified}-${file.size}`"
            >
              <button
                type="button"
                class="candidate-form-document-chip"
                :disabled="isBusy"
                @click="onRemoveSelectedFile?.(entry.documentType, index)"
              >
                {{ file.name }}
              </button>
            </li>
          </ul>
          <button
            v-if="showPerEntryUploadAction"
            type="button"
            class="app-button app-button-primary px-3 py-2"
            :disabled="isBusy || !entry.selectedFiles?.length"
            @click="onUploadFiles?.(entry.documentType)"
          >
            {{ isBusy ? text('candidateForms.form.employeeDocuments.actions.uploading') : text('candidateForms.form.employeeDocuments.actions.upload') }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="showSubmitEntriesAction" class="flex justify-end">
      <button
        type="button"
        class="app-button app-button-primary px-4 py-2"
        :disabled="isBusy || isSubmitEntriesDisabled"
        @click="onSubmitEntries?.()"
      >
        {{ isBusy ? submitEntriesBusyLabel || text('candidateForms.form.employeeDocuments.actions.uploading') : submitEntriesLabel }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { LoaderCircle, X } from 'lucide-vue-next'

import type { EmployeeDocumentFieldKey } from '@/domain/entities/CandidateForm'
import type { CandidateFormEmployeeDocumentEntry } from '@/features/candidateForms/types/CandidateFormPage.type'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
  entries: {
    type: Array as PropType<CandidateFormEmployeeDocumentEntry[]>,
    default: () => [],
  },
  getReadableEmployeeDocumentFileName: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => string>,
    required: true,
  },
  onOpenFile: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => void>,
    default: undefined,
  },
  openingDocumentKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  getDocumentOpenKey: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => string>,
    default: (documentType: EmployeeDocumentFieldKey, path: string) => `${documentType}:${path}`,
  },
  openingDocumentLabel: {
    type: String,
    default: 'Preparing document...',
  },
  onRemoveUploadedFile: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => void>,
    default: undefined,
  },
  removingDocumentKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  onSelectFiles: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, event: Event) => void>,
    default: undefined,
  },
  onRemoveSelectedFile: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, index: number) => void>,
    default: undefined,
  },
  onUploadFiles: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey) => void>,
    default: undefined,
  },
  documentAccept: {
    type: String,
    default: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  uploadHelperText: {
    type: String,
    default: '',
  },
  isBusy: {
    type: Boolean,
    default: false,
  },
  showPerEntryUploadAction: {
    type: Boolean,
    default: true,
  },
  showSubmitEntriesAction: {
    type: Boolean,
    default: false,
  },
  onSubmitEntries: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  submitEntriesLabel: {
    type: String,
    default: '',
  },
  submitEntriesBusyLabel: {
    type: String,
    default: '',
  },
  isSubmitEntriesDisabled: {
    type: Boolean,
    default: false,
  },
})

function isVisibleDocumentPath(path: string) {
  const normalizedPath = String(path ?? '').trim()
  return normalizedPath.length > 0 && !normalizedPath.endsWith('.emptyFolderPlaceholder')
}

const visibleEntries = computed(() =>
  props.entries.map((entry) => ({
    ...entry,
    files: (Array.isArray(entry.files) ? entry.files : []).filter(isVisibleDocumentPath),
  })),
)
</script>

<style scoped>
.candidate-form-document-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
}

.candidate-form-document-chip-remove {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface);
  color: var(--app-color-text-muted);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.candidate-form-document-chip-remove:hover:not(:disabled) {
  border-color: var(--app-color-danger-border);
  background: var(--app-color-danger-soft);
  color: var(--app-color-danger-strong);
}

.candidate-form-document-chip-remove:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.candidate-form-document-chip--interactive {
  position: relative;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
}

.candidate-form-document-chip--interactive:hover:not(:disabled) {
  border-color: var(--app-color-accent-border);
  background: var(--app-color-accent-soft);
  color: var(--app-color-accent-strong);
}

.candidate-form-document-chip--interactive:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.candidate-form-document-chip__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: color-mix(in srgb, var(--app-color-surface) 86%, transparent);
  backdrop-filter: blur(1.5px);
}

.candidate-form-document-chip__overlay-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-color-accent-soft) 92%, var(--app-color-surface));
  color: var(--app-color-accent-strong);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
</style>
