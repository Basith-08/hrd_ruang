<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-4">
    <AppPanelCard container-class="gap-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="app-section-eyebrow">
            {{ text('exportConfiguration.page.eyebrow') }}
          </p>
          <h1 class="app-page-title mt-2">
            {{ text('exportConfiguration.generatePage.title') }}
          </h1>
          <p class="app-page-description mt-2">
            {{ text('exportConfiguration.generatePage.description') }}
          </p>
        </div>

        <NuxtLink
          to="/configuration-export"
          class="app-button app-button-secondary px-4 py-2"
        >
          {{ text('exportConfiguration.actions.backToHome') }}
        </NuxtLink>
      </div>
    </AppPanelCard>

    <AppPanelCard container-class="gap-0 overflow-hidden p-0">
      <div class="border-b app-table-divider px-5 py-5 sm:px-6">
        <AppSectionHeader
          :title="text('exportConfiguration.section.generateTitle')"
          :description="text('exportConfiguration.section.generateDescription')"
          :eyebrow="text('exportConfiguration.section.step2')"
        />
      </div>

      <div class="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label class="block space-y-2">
            <span class="app-field-label">{{ text('exportConfiguration.generate.template') }}</span>
            <SearchableSelect
              v-model="selectedTemplateId"
              :options="templateOptions"
              :placeholder="text('exportConfiguration.generate.templatePlaceholder')"
              :loading="templatesLoading"
              :loading-label="text('common.loadingData')"
              :disabled="initialLoading"
            />
          </label>

          <label class="block space-y-2">
            <span class="app-field-label">{{ text('exportConfiguration.generate.candidate') }}</span>
            <SearchableSelect
              v-model="selectedCandidateId"
              :options="candidateOptions"
              :placeholder="text('exportConfiguration.generate.candidatePlaceholder')"
              :loading="candidatesLoading"
              :loading-label="text('common.loadingData')"
              :disabled="initialLoading"
            />
          </label>

          <AppActionButton
            :label="text('exportConfiguration.actions.prepareFields')"
            :loading-label="text('exportConfiguration.actions.preparing')"
            :loading="prepareLoading"
            :disabled="!canPrepare"
            variant="secondary"
            @click="handlePrepare"
          />
        </div>

        <div
          v-if="prepareSummary"
          class="app-state-card app-state-card-neutral px-4 py-3"
        >
          <p class="app-copy-body">
            <span class="app-copy-strong">{{ text('exportConfiguration.generate.summaryTemplate', { name: prepareSummary.templateName }) }}</span>
          </p>
          <p class="app-copy-body mt-1">
            <span class="app-copy-strong">{{ text('exportConfiguration.generate.summaryCandidate', { name: prepareSummary.candidateName }) }}</span>
          </p>
        </div>

        <div
          v-if="preparedFields.length"
          class="grid gap-3 lg:grid-cols-2"
        >
          <div class="app-state-card app-state-card-success px-4 py-3">
            <p class="app-label-compact app-tone-success-text">
              {{ text('exportConfiguration.generate.autoFilled') }}
            </p>
            <p class="app-tone-success-text mt-2 text-xl font-semibold leading-none">
              {{ autoFilledCount }}
            </p>
          </div>
          <div class="app-state-card app-state-card-warning px-4 py-3">
            <p class="app-label-compact app-tone-warning-text">
              {{ text('exportConfiguration.generate.needReview') }}
            </p>
            <p class="app-tone-warning-text mt-2 text-xl font-semibold leading-none">
              {{ manualRequiredCount + manualCount }}
            </p>
          </div>
        </div>

        <div v-if="preparedFields.length" class="space-y-5">
          <div class="app-state-card app-state-card-neutral flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 class="app-section-title">
                {{ text('exportConfiguration.editor.title') }}
              </h3>
              <p class="app-copy-body mt-2 max-w-2xl">
                {{ text('exportConfiguration.editor.description') }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <p class="app-copy-body">
                {{ text('exportConfiguration.editor.fieldsReady', { count: preparedFields.length }) }}
              </p>
              <AppActionButton
                :label="text('exportConfiguration.actions.previewDocument')"
                :loading-label="text('exportConfiguration.actions.preparingPreview')"
                :loading="previewLoading"
                :disabled="!preparedFields.length"
                variant="secondary"
                @click="openPreviewModal"
              />
              <AppActionButton
                :label="text('exportConfiguration.actions.downloadDocx')"
                :loading-label="text('exportConfiguration.actions.generating')"
                :loading="downloadLoading"
                variant="success"
                @click="handleDownload"
              />
            </div>
          </div>

          <div class="grid gap-3 2xl:grid-cols-2">
            <div
              v-for="(field, index) in preparedFields"
              :key="field.field_key"
              class="app-surface-card p-3.5"
            >
              <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="app-copy-strong text-[15px]">
                    {{ field.field_label }}
                  </p>
                  <p class="app-helper-text mt-1 break-all leading-6">
                    {{ field.field_key }}
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="app-badge-role px-3 py-1 text-sm"
                    :class="statusClassName(field.status)"
                  >
                    {{ fieldStatusLabel(field.status) }}
                  </span>
                  <span
                    v-if="field.is_required"
                    class="app-badge-role app-status-chip-danger px-3 py-1 text-sm"
                  >
                    {{ text('exportConfiguration.editor.required') }}
                  </span>
                  <span
                    v-if="!field.is_editable"
                    class="app-badge-role app-status-chip-neutral px-3 py-1 text-sm"
                  >
                    {{ text('exportConfiguration.editor.locked') }}
                  </span>
                </div>
              </div>

              <textarea
                :value="field.value"
                rows="3"
                class="app-field app-field-textarea rounded-2xl"
                :disabled="!field.is_editable"
                :placeholder="field.status === 'manual_required' ? text('exportConfiguration.editor.manualPlaceholder') : text('exportConfiguration.editor.noValuePlaceholder')"
                @input="updateFieldValue(index, ($event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </div>
        </div>

        <div
          v-else-if="initialLoading"
          class="app-surface-card px-6 py-10"
        >
          <div class="space-y-3 animate-pulse">
            <div class="app-skeleton-fill-strong h-4 w-40 rounded-full" />
            <div class="app-skeleton-fill h-3 w-72 rounded-full" />
            <div class="app-skeleton-fill h-24 rounded-2xl" />
          </div>
        </div>

        <div
          v-else
          class="app-empty-state px-6 py-10"
        >
          <p class="app-copy-strong text-base">
            {{ text('exportConfiguration.empty.title') }}
          </p>
          <p class="app-helper-text mt-2 leading-7">
            {{ text('exportConfiguration.empty.description', { action: text('exportConfiguration.actions.prepareFields') }) }}
          </p>
        </div>
      </div>
    </AppPanelCard>
  </div>

  <AppLoadingOverlay
    v-if="pageBusyMessage"
    :message="pageBusyMessage"
  />

  <div
    v-if="previewModalOpen"
    class="app-modal-overlay px-4 py-6"
    @click.self="closePreviewModal"
  >
    <div class="app-modal-card max-h-[92vh] max-w-6xl overflow-hidden">
      <div class="flex items-start justify-between gap-4 border-b app-table-divider px-5 py-4 sm:px-6">
        <div>
          <p class="app-section-eyebrow app-tone-success-text">
            {{ text('exportConfiguration.preview.eyebrow') }}
          </p>
          <h2 class="app-modal-title mt-2">
            {{ preparedTemplate?.name || text('exportConfiguration.preview.title') }}
          </h2>
          <p class="app-modal-description mt-2">
            {{ text('exportConfiguration.preview.candidate', { name: preparedCandidate?.candidate_name || '-' }) }}
          </p>
          <div class="app-state-card app-state-card-warning app-tone-warning-text mt-3 px-3.5 py-3 text-sm leading-6">
            {{ text('exportConfiguration.preview.disclaimer') }}
          </div>
        </div>

        <button
          type="button"
          class="app-button app-button-secondary shrink-0 px-3 py-2"
          @click="closePreviewModal"
        >
          {{ text('common.actions.close') }}
        </button>
      </div>

      <div class="border-b app-table-divider app-surface-card-muted px-5 py-4 sm:px-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="app-status-chip app-status-chip-neutral">
            {{ text('exportConfiguration.preview.totalFields', { count: preparedFields.length }) }}
          </span>
          <span class="app-status-chip app-status-chip-success">
            {{ text('exportConfiguration.preview.autoFilled', { count: autoFilledCount }) }}
          </span>
          <span class="app-status-chip app-status-chip-warning">
            {{ text('exportConfiguration.preview.needsReview', { count: manualRequiredCount + manualCount }) }}
          </span>
        </div>
      </div>

      <div class="app-preview-frame h-[calc(92vh-200px)] overflow-hidden">
        <iframe
          v-if="previewHtml"
          class="app-preview-frame h-full w-full border-0"
          :srcdoc="previewHtml"
          :title="text('exportConfiguration.preview.title')"
        />
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3 border-t app-table-divider px-5 py-4 sm:px-6">
        <AppActionButton
          :label="text('common.actions.close')"
          variant="secondary"
          @click="closePreviewModal"
        />
        <AppActionButton
          :label="text('exportConfiguration.actions.downloadDocx')"
          :loading-label="text('exportConfiguration.actions.generating')"
          :loading="downloadLoading"
          variant="success"
          @click="handleDownload"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { useLocale } from '@/composables/useLocale'
import { callBackendApi, fetchBackendApi } from '@/infrastructure/http/backendApi'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppSectionHeader from '@/presentation/components/layout/AppSectionHeader.vue'

type ExportTemplateRecord = {
  id: string
  name: string
  code: string | null
  description: string | null
  file_name: string
  file_path: string
  storage_bucket: string
  detected_fields: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

type ExportCandidateRecord = {
  id: string
  candidate_name: string
  candidate_address: string
  place_of_birth: string
  date_of_birth: string
  identity_card_number: string
  agreement_date: string
  main_position: string
  job_level: string
  department: string
  cost_center_pt: string
  cost_center_pt_address: string
}

type PreparedExportField = {
  field_key: string
  field_label: string
  value: string
  status: 'auto_filled' | 'manual_required' | 'manual'
  is_editable: boolean
  is_required: boolean
  field_type: string
  source_path: string | null
}

type PrepareExportResponse = {
  template: {
    id: string
    name: string
  }
  candidate: {
    id: string
    candidate_name: string
  }
  fields: PreparedExportField[]
}

type ExportPreviewResponse = {
  html: string
}

const appToast = useAppToast()
const { text } = useLocale()

const templates = ref<ExportTemplateRecord[]>([])
const candidates = ref<ExportCandidateRecord[]>([])
const selectedTemplateId = ref('')
const selectedCandidateId = ref('')
const preparedTemplate = ref<PrepareExportResponse['template'] | null>(null)
const preparedCandidate = ref<PrepareExportResponse['candidate'] | null>(null)
const preparedFields = ref<PreparedExportField[]>([])
const previewModalOpen = ref(false)
const previewHtml = ref('')

const templatesLoading = ref(false)
const candidatesLoading = ref(false)
const prepareLoading = ref(false)
const previewLoading = ref(false)
const downloadLoading = ref(false)

const initialLoading = computed(() => templatesLoading.value || candidatesLoading.value)
const templateOptions = computed(() =>
  templates.value.map((template) => ({
    value: template.id,
    label: template.name,
  })),
)
const candidateOptions = computed(() =>
  candidates.value.map((candidate) => ({
    value: candidate.id,
    label: candidate.candidate_name,
  })),
)
const canPrepare = computed(() => Boolean(selectedTemplateId.value && selectedCandidateId.value))
const pageBusyMessage = computed(() => {
  if (downloadLoading.value) {
    return text('exportConfiguration.loading.generating')
  }

  if (previewLoading.value) {
    return text('exportConfiguration.loading.previewDocument')
  }

  if (prepareLoading.value) {
    return text('exportConfiguration.loading.preparing')
  }

  if (initialLoading.value) {
    return text('exportConfiguration.loading.initialData')
  }

  return ''
})
const prepareSummary = computed(() => {
  if (!preparedTemplate.value || !preparedCandidate.value) {
    return null
  }

  return {
    templateName: preparedTemplate.value.name,
    candidateName: preparedCandidate.value.candidate_name,
  }
})
const autoFilledCount = computed(() =>
  preparedFields.value.filter((field) => field.status === 'auto_filled').length,
)
const manualRequiredCount = computed(() =>
  preparedFields.value.filter((field) => field.status === 'manual_required').length,
)
const manualCount = computed(() =>
  preparedFields.value.filter((field) => field.status === 'manual').length,
)

watch([selectedTemplateId, selectedCandidateId], () => {
  resetPreparedState()
})

onMounted(() => {
  void loadInitialData()
})

function resetPreparedState() {
  preparedTemplate.value = null
  preparedCandidate.value = null
  preparedFields.value = []
  previewModalOpen.value = false
  previewHtml.value = ''
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage
}

function statusClassName(status: PreparedExportField['status']) {
  if (status === 'auto_filled') {
    return 'app-status-chip-success'
  }

  if (status === 'manual_required') {
    return 'app-status-chip-warning'
  }

  return 'app-status-chip-neutral'
}

function fieldStatusLabel(status: PreparedExportField['status']) {
  if (status === 'auto_filled') {
    return text('exportConfiguration.editor.status.autoFilled')
  }

  if (status === 'manual_required') {
    return text('exportConfiguration.editor.status.manualRequired')
  }

  return text('exportConfiguration.editor.status.manual')
}

function resolveDownloadFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i)
  return match?.[1]?.trim() || 'export-document.docx'
}

function updateFieldValue(index: number, value: string) {
  const currentField = preparedFields.value[index]
  if (!currentField) {
    return
  }

  preparedFields.value[index] = {
    ...currentField,
    value,
  }
}

async function openPreviewModal() {
  if (!preparedFields.value.length) {
    return
  }

  previewLoading.value = true

  try {
    const payload = Object.fromEntries(
      preparedFields.value.map((field) => [field.field_key, field.value ?? '']),
    )

    const response = await callBackendApi<ExportPreviewResponse>('/api/export-documents/preview', {
      method: 'POST',
      body: JSON.stringify({
        template_id: selectedTemplateId.value,
        candidate_id: selectedCandidateId.value,
        payload,
      }),
    })

    previewHtml.value = response.html || ''
    previewModalOpen.value = true
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.previewDocumentFailed')))
  } finally {
    previewLoading.value = false
  }
}

function closePreviewModal() {
  previewModalOpen.value = false
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    templates.value = await callBackendApi<ExportTemplateRecord[]>('/api/export-templates')
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.templatesLoadFailed')))
  } finally {
    templatesLoading.value = false
  }
}

async function loadCandidates() {
  candidatesLoading.value = true
  try {
    candidates.value = await callBackendApi<ExportCandidateRecord[]>('/api/candidates')
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.candidatesLoadFailed')))
  } finally {
    candidatesLoading.value = false
  }
}

async function loadInitialData() {
  await Promise.all([loadTemplates(), loadCandidates()])
}

async function handlePrepare() {
  if (!canPrepare.value) {
    return
  }

  prepareLoading.value = true

  try {
    const response = await callBackendApi<PrepareExportResponse>('/api/export-documents/prepare', {
      method: 'POST',
      body: JSON.stringify({
        template_id: selectedTemplateId.value,
        candidate_id: selectedCandidateId.value,
      }),
    })

    preparedTemplate.value = response.template
    preparedCandidate.value = response.candidate
    preparedFields.value = response.fields.map((field) => ({
      ...field,
      value: field.value ?? '',
    }))

    appToast.success(text('exportConfiguration.toast.fieldsPrepared'))
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.prepareFailed')))
  } finally {
    prepareLoading.value = false
  }
}

async function handleDownload() {
  if (!canPrepare.value || !preparedFields.value.length) {
    return
  }

  downloadLoading.value = true

  try {
    const payload = Object.fromEntries(
      preparedFields.value.map((field) => [field.field_key, field.value ?? '']),
    )

    const response = await fetchBackendApi('/api/export-documents/generate', {
      method: 'POST',
      body: JSON.stringify({
        template_id: selectedTemplateId.value,
        candidate_id: selectedCandidateId.value,
        payload,
      }),
    })

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = resolveDownloadFilename(response.headers.get('Content-Disposition'))
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(blobUrl)

    appToast.success(text('exportConfiguration.toast.docxDownloaded'))
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.docxGenerateFailed')))
  } finally {
    downloadLoading.value = false
  }
}
</script>
