<template>
  <div class="app-attachment-card">
    <div class="app-attachment-card-header">
      <span class="app-attachment-card-title">{{ title }}</span>
      <span class="app-attachment-card-badge">
        {{ totalFiles }}
      </span>
    </div>
    <div class="app-attachment-preview">
      <AppFileInput
        v-if="!isDetail"
        multiple
        :accept="accept"
        :disabled="isBusy"
        @change="$emit('change', $event)"
      />

      <div v-if="pendingFiles.length > 0" class="app-attachment-group mt-4">
        <p class="app-attachment-preview-title">{{ text('employeeRequestForms.form.attachments.pendingUpload') }}</p>
        <div
          v-for="(file, index) in pendingFiles"
          :key="`${file.name}-${file.size}-${index}`"
          class="app-file-list-row"
        >
          <span class="truncate pr-3">{{ file.name }}</span>
          <AppActionButton
            class="shrink-0"
            variant="ghost"
            :label="text('employeeRequestForms.form.actions.remove')"
            @click="$emit('removePending', index)"
          />
        </div>
      </div>

      <div v-if="storedFiles.length > 0" class="app-attachment-group mt-4">
        <p class="app-attachment-preview-title">{{ text('employeeRequestForms.form.attachments.uploadedFiles') }}</p>
        <div
          v-for="(item, index) in storedFiles"
          :key="`${item.path}-${index}`"
          class="app-file-list-row"
        >
          <a
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="app-file-link truncate pr-3"
          >
            {{ item.name }}
          </a>
          <AppActionButton
            v-if="!isDetail"
            class="shrink-0"
            variant="ghost"
            :label="text('employeeRequestForms.form.actions.remove')"
            @click="$emit('removeStored', index)"
          />
        </div>
      </div>

      <p v-if="pendingFiles.length === 0 && storedFiles.length === 0" class="app-attachment-preview-copy">
        {{ text('common.noFilesUploaded') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { AttachmentPreviewItem } from '@/features/employeeRequestForms/types/EmployeeRequestFormPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppFileInput from '@/presentation/components/forms/AppFileInput.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  pendingFiles: {
    type: Array as PropType<File[]>,
    default: () => [],
  },
  storedFiles: {
    type: Array as PropType<AttachmentPreviewItem[]>,
    default: () => [],
  },
  accept: {
    type: String,
    required: true,
  },
  isBusy: {
    type: Boolean,
    required: true,
  },
  isDetail: {
    type: Boolean,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
})

const totalFiles = computed(() => props.pendingFiles.length + props.storedFiles.length)

defineEmits<{
  (event: 'change', value: Event): void
  (event: 'removePending', value: number): void
  (event: 'removeStored', value: number): void
}>()
</script>
