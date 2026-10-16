<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-4">
    <AppPanelCard container-class="gap-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="app-section-eyebrow">
            {{ text('exportConfiguration.page.eyebrow') }}
          </p>
          <h1 class="app-page-title mt-2">
            {{ text('exportConfiguration.templatesPage.title') }}
          </h1>
          <p class="app-page-description mt-2">
            {{ text('exportConfiguration.templatesPage.description') }}
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
          :title="text('exportConfiguration.section.uploadTitle')"
          :description="text('exportConfiguration.section.uploadDescription')"
          :eyebrow="text('exportConfiguration.section.step1')"
        />
      </div>

      <div class="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <form class="space-y-4" @submit.prevent="handleUpload">
          <label class="block space-y-2">
            <span class="app-field-label">{{ text('exportConfiguration.form.templateName') }}</span>
            <input
              v-model="uploadName"
              type="text"
              :disabled="uploadLoading"
              class="app-field rounded-2xl"
              :placeholder="text('exportConfiguration.form.templateNamePlaceholder')"
            >
          </label>

          <label class="block space-y-2">
            <span class="app-field-label">{{ text('exportConfiguration.form.description') }}</span>
            <textarea
              v-model="uploadDescription"
              rows="4"
              :disabled="uploadLoading"
              class="app-field app-field-textarea rounded-2xl"
              :placeholder="text('exportConfiguration.form.descriptionPlaceholder')"
            />
          </label>

          <label class="block space-y-3">
            <span class="app-field-label">{{ text('exportConfiguration.form.docxFile') }}</span>
            <div class="app-attachment-preview p-4">
              <p class="app-copy-strong text-base">
                {{ text('exportConfiguration.form.uploadFileTitle') }}
              </p>
              <p class="app-copy-body mt-1 leading-7">
                {{ text('exportConfiguration.form.uploadFileDescription', { example: placeholderExample }) }}
              </p>

              <input
                ref="fileInputRef"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                :disabled="uploadLoading"
                class="app-field app-file-input mt-4 rounded-2xl"
                @change="handleFileSelected"
              >

              <div class="app-state-card app-state-card-neutral mt-4 px-4 py-3">
                <p class="app-copy-strong leading-6">
                  {{ selectedUploadFile?.name || text('exportConfiguration.form.noFileSelected') }}
                </p>
              </div>
            </div>
          </label>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <AppActionButton
              :label="text('exportConfiguration.actions.uploadTemplate')"
              :loading-label="text('exportConfiguration.actions.uploading')"
              :loading="uploadLoading"
              :disabled="!canUpload"
              variant="primary"
              type="submit"
            />
            <AppActionButton
              :label="text('exportConfiguration.actions.refreshData')"
              :loading-label="text('common.refreshing')"
              :loading="templatesLoading"
              :disabled="templatesLoading"
              variant="secondary"
              @click="loadTemplates"
            />
          </div>
        </form>

        <div
          v-if="lastUploadedTemplate"
          class="app-state-card app-state-card-success p-4"
        >
          <p class="app-tone-success-text text-sm font-semibold">
            {{ text('exportConfiguration.upload.successTitle') }}
          </p>
          <p class="app-tone-success-text mt-1 text-sm leading-6">
            {{ text('exportConfiguration.upload.successDescription', { name: lastUploadedTemplate.name }) }}
          </p>
          <p class="app-tone-success-text mt-3 text-sm leading-6">
            {{ text('exportConfiguration.upload.successFields', { count: lastUploadedTemplate.detected_fields.length }) }}
          </p>
        </div>
      </div>
    </AppPanelCard>

    <AppPanelCard container-class="gap-4 p-5 sm:p-6">
      <AppSectionHeader
        :title="text('exportConfiguration.upload.templateListTitle')"
        :description="text('exportConfiguration.upload.templateListDescription')"
      />

      <div
        v-if="templatesLoading && !templates.length"
        class="space-y-3"
      >
        <div
          v-for="index in 3"
          :key="index"
          class="app-surface-card px-4 py-4"
        >
          <div class="animate-pulse space-y-3">
            <div class="app-skeleton-fill-strong h-4 w-48 rounded-full" />
            <div class="app-skeleton-fill h-3 w-64 rounded-full" />
          </div>
        </div>
      </div>

      <div
        v-else-if="templates.length"
        class="space-y-3"
      >
        <div
          v-for="template in templates"
          :key="template.id"
          class="app-card-frame"
        >
          <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="app-copy-strong truncate text-sm">
                {{ template.name }}
              </p>
              <p class="app-helper-text mt-1 truncate">
                {{ template.file_name }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="app-button app-button-secondary shrink-0 px-3 py-2"
                :disabled="loadingFieldsTemplateId === template.id"
                @click="toggleTemplateMapping(template)"
              >
                {{
                  loadingFieldsTemplateId === template.id
                    ? text('common.loadingData')
                    : expandedTemplateId === template.id
                      ? text('exportConfiguration.actions.hideMapping')
                      : text('exportConfiguration.actions.manageMapping')
                }}
              </button>

              <button
                type="button"
                class="app-button app-button-danger-subtle shrink-0 px-3 py-2"
                :disabled="deletingTemplateId === template.id"
                @click="handleDeleteTemplate(template)"
              >
                {{ deletingTemplateId === template.id ? text('exportConfiguration.actions.deletingTemplate') : text('exportConfiguration.actions.deleteTemplate') }}
              </button>
            </div>
          </div>

          <div
            v-if="expandedTemplateId === template.id"
            class="border-t app-table-divider app-surface-card-muted px-4 py-4"
          >
            <div class="mb-4 flex flex-col gap-1">
              <p class="app-copy-strong text-sm">
                {{ text('exportConfiguration.mapping.title') }}
              </p>
              <p class="app-copy-body">
                {{ text('exportConfiguration.mapping.description') }}
              </p>
            </div>

            <div class="app-surface-card mb-4 p-4">
              <div class="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_auto] xl:items-end">
                <label class="block space-y-2">
                  <span class="app-label-compact">{{ text('exportConfiguration.mapping.searchLabel') }}</span>
                  <input
                    v-model="fieldSearchByTemplate[template.id]"
                    type="text"
                    class="app-field rounded-xl px-3.5 py-2.5"
                    :placeholder="text('exportConfiguration.mapping.searchPlaceholder')"
                  >
                </label>

                <label class="block space-y-2">
                  <span class="app-label-compact">{{ text('exportConfiguration.mapping.filterLabel') }}</span>
                  <select
                    v-model="fieldFilterByTemplate[template.id]"
                    class="app-field rounded-xl px-3.5 py-2.5"
                  >
                    <option value="all">
                      {{ text('exportConfiguration.mapping.filter.all') }}
                    </option>
                    <option value="needs_attention">
                      {{ text('exportConfiguration.mapping.filter.needsAttention') }}
                    </option>
                    <option value="ready">
                      {{ text('exportConfiguration.mapping.filter.ready') }}
                    </option>
                    <option value="custom">
                      {{ text('exportConfiguration.mapping.filter.custom') }}
                    </option>
                    <option value="manual">
                      {{ text('exportConfiguration.mapping.filter.manual') }}
                    </option>
                  </select>
                </label>

                <AppActionButton
                  :label="text('exportConfiguration.actions.saveAllMapping')"
                  :loading-label="text('exportConfiguration.actions.savingAllMapping')"
                  :loading="savingTemplateId === template.id"
                  :disabled="!hasSaveableDirtyFields(template.id)"
                  variant="secondary"
                  @click="handleSaveAllFieldMappings(template.id)"
                />
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <span class="app-status-chip app-status-chip-neutral">
                  {{ text('exportConfiguration.mapping.filteredCount', { count: filteredTemplateFields(template.id).length }) }}
                </span>
                <span class="app-status-chip app-status-chip-success">
                  {{ text('exportConfiguration.mapping.summary.ready', { count: countTemplateFieldsByStatus(template.id, 'ready') }) }}
                </span>
                <span class="app-status-chip app-status-chip-accent">
                  {{ text('exportConfiguration.mapping.summary.custom', { count: countTemplateFieldsByStatus(template.id, 'custom') }) }}
                </span>
                <span class="app-status-chip app-status-chip-warning">
                  {{ text('exportConfiguration.mapping.summary.manual', { count: countTemplateFieldsByStatus(template.id, 'empty') }) }}
                </span>
                <span
                  v-if="dirtyFieldCount(template.id)"
                  class="app-status-chip app-tone-orange-surface app-tone-orange-text"
                >
                  {{ text('exportConfiguration.mapping.changedCount', { count: dirtyFieldCount(template.id) }) }}
                </span>
              </div>
            </div>

            <div class="app-surface-card mb-4 p-4">
              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <label class="block space-y-2">
                  <span class="app-label-compact">{{ text('exportConfiguration.mapping.previewCandidate') }}</span>
                  <select
                    v-model="previewCandidateIdByTemplate[template.id]"
                    :disabled="candidatesLoading"
                    class="app-field rounded-xl px-3.5 py-2.5"
                  >
                    <option value="">
                      {{ candidatesLoading ? text('common.loadingData') : text('exportConfiguration.mapping.previewCandidatePlaceholder') }}
                    </option>
                    <option
                      v-for="candidate in candidates"
                      :key="candidate.id"
                      :value="candidate.id"
                    >
                      {{ candidate.candidate_name }}
                    </option>
                  </select>
                </label>

                <AppActionButton
                  :label="text('exportConfiguration.actions.testMapping')"
                  :loading-label="text('exportConfiguration.actions.testingMapping')"
                  :loading="previewLoadingTemplateId === template.id"
                  :disabled="!canPreviewTemplate(template.id)"
                  variant="secondary"
                  @click="handlePreviewTemplateMapping(template)"
                />
              </div>

              <p
                v-if="hasDirtyFields(template.id)"
                class="app-warning-text mt-3 leading-6"
              >
                {{ text('exportConfiguration.mapping.previewRequiresSaved') }}
              </p>
            </div>

            <div
              v-if="loadingFieldsTemplateId === template.id"
              class="app-surface-card px-4 py-5"
            >
              <div class="animate-pulse space-y-3">
                <div class="app-skeleton-fill-strong h-4 w-40 rounded-full" />
                <div class="app-skeleton-fill h-20 rounded-2xl" />
                <div class="app-skeleton-fill h-20 rounded-2xl" />
              </div>
            </div>

            <div
              v-else-if="templateFieldsMap[template.id]?.length"
              class="app-card-frame"
            >
              <div
                v-for="field in filteredTemplateFields(template.id)"
                :key="field.id"
                class="border-t app-table-divider px-4 py-4 first:border-t-0"
              >
                <div class="grid gap-4 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] xl:items-start">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="app-copy-strong text-sm">
                        {{ field.field_label || field.field_key }}
                      </p>
                      <span
                        class="app-status-chip w-fit px-2.5 py-1 text-[11px]"
                        :class="mappingStatusClassName(field)"
                      >
                        {{ mappingStatusLabel(field) }}
                      </span>
                    </div>
                    <p class="app-badge-muted mt-2 rounded-lg px-2.5 py-1">
                      {{ field.field_key }}
                    </p>
                  </div>

                  <div class="space-y-3">
                    <label class="block space-y-2">
                      <span class="app-label-compact">{{ text('exportConfiguration.mapping.sourceSelector') }}</span>
                      <select
                        :value="resolveSourceSelectValue(field)"
                        class="app-field rounded-xl px-3.5 py-2.5"
                        @change="applySourceSelection(field, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="">
                          {{ text('exportConfiguration.mapping.manualOption') }}
                        </option>
                        <option :value="FIELD_KEY_SOURCE_OPTION">
                          {{ text('exportConfiguration.mapping.fieldKeyOption', { field: field.field_key }) }}
                        </option>
                        <optgroup
                          v-for="group in sourceOptionGroups"
                          :key="group.label"
                          :label="group.label"
                        >
                          <option
                            v-for="preset in group.options"
                            :key="preset"
                            :value="preset"
                          >
                            {{ formatSourceOptionLabel(preset) }}
                          </option>
                        </optgroup>
                        <option :value="CUSTOM_SOURCE_OPTION">
                          {{ text('exportConfiguration.mapping.customOption') }}
                        </option>
                      </select>
                    </label>

                    <label v-if="showCustomSourceInput(field)" class="block space-y-2">
                      <span class="app-label-compact">{{ text('exportConfiguration.mapping.customPathLabel') }}</span>
                      <input
                        v-model="field.source_path"
                        type="text"
                        :list="mappingPresetListId"
                        class="app-field rounded-xl px-3.5 py-2.5"
                        :placeholder="text('exportConfiguration.mapping.sourcePathPlaceholder', { field: field.field_key })"
                      >
                      <p class="app-helper-text leading-5">
                        {{ text('exportConfiguration.mapping.customPathHelper') }}
                      </p>
                      <p class="app-helper-text leading-5 opacity-75">
                        {{ text('exportConfiguration.mapping.sourcePathExamples') }}
                      </p>
                    </label>
                  </div>

                  <div class="flex items-start xl:justify-end">
                    <AppActionButton
                      :label="text('exportConfiguration.actions.saveMapping')"
                      :loading-label="text('exportConfiguration.actions.savingMapping')"
                      :loading="isFieldSaving(field.id)"
                      :disabled="!isFieldDirty(field) || resolveMappingStatus(field) === 'invalid'"
                      variant="secondary"
                      @click="handleSaveFieldMapping(template.id, field)"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="!filteredTemplateFields(template.id).length"
                class="border-t app-table-divider app-helper-text px-4 py-5"
              >
                {{ text('exportConfiguration.mapping.noFilteredFields') }}
              </div>
            </div>

            <div
              v-if="!templateFieldsMap[template.id]?.length"
              class="app-empty-state px-4 py-5"
            >
              {{ text('exportConfiguration.mapping.empty') }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="app-empty-state px-4 py-5"
      >
        {{ text('exportConfiguration.upload.templateListEmpty') }}
      </div>
    </AppPanelCard>
  </div>

  <AppLoadingOverlay
    v-if="pageBusyMessage"
    :message="pageBusyMessage"
  />

  <datalist :id="mappingPresetListId">
    <option
      v-for="preset in SOURCE_PATH_PRESETS"
      :key="preset"
      :value="preset"
    />
  </datalist>

  <div
    v-if="previewModal"
    class="app-modal-overlay px-4 py-6"
    @click.self="closePreviewModal"
  >
    <div class="app-modal-card max-h-[90vh] max-w-4xl overflow-hidden p-4">
      <div class="flex items-start justify-between gap-4 border-b app-table-divider px-5 py-4 sm:px-6">
        <div>
          <p class="app-section-eyebrow">
            {{ text('exportConfiguration.mapping.previewTitle') }}
          </p>
          <h2 class="app-modal-title mt-2">
            {{ previewModal.templateName }}
          </h2>
          <p class="app-modal-description mt-2">
            {{ text('exportConfiguration.mapping.previewCandidateSelected', { name: previewModal.candidateName }) }}
          </p>
          <p class="app-helper-text mt-1 leading-6">
            {{ text('exportConfiguration.mapping.previewDescription') }}
          </p>
        </div>

        <button
          type="button"
          class="app-button app-button-secondary shrink-0 px-3 py-2"
          @click="closePreviewModal"
        >
          {{ text('common.actions.close') }}
        </button>
      </div>

      <div class="max-h-[calc(90vh-120px)] overflow-y-auto px-5 py-5 sm:px-6">
        <div class="space-y-3">
          <div
            v-for="previewField in previewModal.fields"
            :key="previewField.field_key"
            class="app-surface-card px-4 py-3"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="app-copy-strong text-sm">
                  {{ previewField.field_label }}
                </p>
                <p class="app-helper-text mt-1">
                  {{ previewField.field_key }}
                </p>
              </div>

              <span
                class="app-status-chip w-fit"
                :class="previewStatusClassName(previewField.status)"
              >
                {{ previewStatusLabel(previewField.status) }}
              </span>
            </div>

            <div class="app-state-card app-state-card-neutral app-copy-body mt-3 px-4 py-3">
              {{ previewField.value || text('exportConfiguration.mapping.previewEmptyValue') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

import { useLocale } from '@/composables/useLocale'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppPanelCard from '@/presentation/components/cards/AppPanelCard.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
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

type UploadTemplateResponse = {
  template: ExportTemplateRecord
}

type ExportTemplateFieldRecord = {
  id: string
  template_id: string
  field_key: string
  field_label: string | null
  source_type: string
  source_path: string | null
  field_type: string
  is_required: boolean
  is_editable: boolean
  default_value: string | null
  created_at: string
}

type ExportCandidateRecord = {
  id: string
  candidate_name: string
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

type PreviewModalState = {
  templateName: string
  candidateName: string
  fields: PreparedExportField[]
}

type FieldFilterMode = 'all' | 'needs_attention' | 'ready' | 'custom' | 'manual'

const FIELD_KEY_SOURCE_OPTION = '__field_key__'
const CUSTOM_SOURCE_OPTION = '__custom__'

const SOURCE_PATH_PRESETS = [
  'candidate_name',
  'candidate_address',
  'place_of_birth',
  'date_of_birth',
  'identity_card_number',
  'agreement_date',
  'main_position',
  'job_level',
  'department',
  'cost_center_pt',
  'cost_center_pt_address',
  'candidate.candidate_name',
  'candidate.candidate_address',
  'candidate.place_of_birth',
  'candidate.date_of_birth',
  'candidate.identity_card_number',
  'candidate.agreement_date',
  'candidate.main_position',
  'candidate.job_level',
  'candidate.department',
  'candidate.cost_center_pt',
  'candidate.cost_center_pt_address',
  'candidate_form.full_name',
  'candidate_form.residential_address',
  'candidate_form.id_card_address',
  'candidate_form.place_of_birth',
  'candidate_form.date_of_birth',
  'candidate_form.id_no',
  'candidate_form.join_date',
  'candidate_form.available_start_date',
  'employee_request_form.id',
  'employee_request_form.site',
  'employee_request_form.employment_status',
  'employee_request_form.direct_manager',
  'employee_request_form.periode_probation',
  'employee_request_form.bu_id',
  'employee_request_form.business_unit',
  'employee_request_form.department_id',
  'employee_request_form.master_designation_id',
  'employee_request_form.main_position',
  'employee_request_form.department_name',
  'employee_request_form.designation_name',
  'employee_request_form.pt_name',
  'employee_request_form.pt_address',
  'employee_contract_form.id',
  'employee_contract_form.contract_number',
  'employee_contract_form.employee_code',
  'employee_contract_form.contract_start_date',
  'employee_contract_form.contract_end_date',
  'employee_contract_form.approval_user_id',
  'employee_contract_form.approval_user_name',
  'employee_contract_form.approval_user_email',
  'employee_contract_form.approval_user_main_position',
  'employee_contract_form.approval_user_designation',
]

const DIRECT_SOURCE_PATH_PRESETS = new Set([
  'candidate_name',
  'candidate_address',
  'place_of_birth',
  'date_of_birth',
  'identity_card_number',
  'agreement_date',
  'main_position',
  'job_level',
  'department',
  'cost_center_pt',
  'cost_center_pt_address',
])

const ALLOWED_SOURCE_ROOTS = new Set(['candidate', 'candidate_form', 'employee_request_form', 'employee_contract_form'])

const appToast = useAppToast()
const appConfirm = useAppConfirm()
const { text } = useLocale()
const placeholderExample = '{{candidate_name}}'
const mappingPresetListId = 'export-template-source-path-presets'

const templates = ref<ExportTemplateRecord[]>([])
const candidates = ref<ExportCandidateRecord[]>([])
const templateFieldsMap = ref<Record<string, ExportTemplateFieldRecord[]>>({})
const originalFieldSourcePathMap = ref<Record<string, string>>({})
const previewCandidateIdByTemplate = ref<Record<string, string>>({})
const fieldSearchByTemplate = ref<Record<string, string>>({})
const fieldFilterByTemplate = ref<Record<string, FieldFilterMode>>({})
const previewModal = ref<PreviewModalState | null>(null)
const uploadName = ref('')
const uploadDescription = ref('')
const selectedUploadFile = ref<File | null>(null)
const lastUploadedTemplate = ref<ExportTemplateRecord | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const templatesLoading = ref(false)
const candidatesLoading = ref(false)
const uploadLoading = ref(false)
const deletingTemplateId = ref('')
const loadingFieldsTemplateId = ref('')
const expandedTemplateId = ref('')
const savingFieldIds = ref<string[]>([])
const savingTemplateId = ref('')
const previewLoadingTemplateId = ref('')

const canUpload = computed(() => Boolean(uploadName.value.trim() && selectedUploadFile.value))
const pageBusyMessage = computed(() => {
  if (uploadLoading.value) {
    return text('exportConfiguration.loading.uploadingTemplate')
  }

  if (savingTemplateId.value) {
    return text('exportConfiguration.loading.savingMapping')
  }

  if (deletingTemplateId.value) {
    return text('exportConfiguration.loading.deletingTemplate')
  }

  if (previewLoadingTemplateId.value) {
    return text('exportConfiguration.loading.preparingPreview')
  }

  if (templatesLoading.value && !templates.value.length) {
    return text('exportConfiguration.loading.templates')
  }

  if (candidatesLoading.value && !candidates.value.length) {
    return text('exportConfiguration.loading.candidates')
  }

  return ''
})
const sourceOptionGroups = computed(() => [
  {
    label: text('exportConfiguration.mapping.group.candidate'),
    options: SOURCE_PATH_PRESETS.filter((item) => !item.includes('.') || item.startsWith('candidate.')),
  },
  {
    label: text('exportConfiguration.mapping.group.candidateForm'),
    options: SOURCE_PATH_PRESETS.filter((item) => item.startsWith('candidate_form.')),
  },
  {
    label: text('exportConfiguration.mapping.group.employeeRequestForm'),
    options: SOURCE_PATH_PRESETS.filter((item) => item.startsWith('employee_request_form.')),
  },
  {
    label: text('exportConfiguration.mapping.group.employeeContractForm'),
    options: SOURCE_PATH_PRESETS.filter((item) => item.startsWith('employee_contract_form.')),
  },
])

onMounted(() => {
  void Promise.all([loadTemplates(), loadCandidates()])
})

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage
}

function normalizeValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function rememberOriginalFieldSourcePaths(fields: ExportTemplateFieldRecord[]) {
  const nextMap = { ...originalFieldSourcePathMap.value }
  for (const field of fields) {
    nextMap[field.id] = normalizeValue(field.source_path)
  }
  originalFieldSourcePathMap.value = nextMap
}

function markFieldSourcePathSaved(field: ExportTemplateFieldRecord) {
  originalFieldSourcePathMap.value = {
    ...originalFieldSourcePathMap.value,
    [field.id]: normalizeValue(field.source_path),
  }
}

function isFieldSaving(fieldId: string) {
  return savingFieldIds.value.includes(fieldId)
}

function setFieldSaving(fieldId: string, saving: boolean) {
  if (saving) {
    if (!savingFieldIds.value.includes(fieldId)) {
      savingFieldIds.value = [...savingFieldIds.value, fieldId]
    }
    return
  }

  savingFieldIds.value = savingFieldIds.value.filter((id) => id !== fieldId)
}

function isFieldDirty(field: ExportTemplateFieldRecord) {
  return normalizeValue(field.source_path) !== normalizeValue(originalFieldSourcePathMap.value[field.id])
}

function dirtyFieldCount(templateId: string) {
  return (templateFieldsMap.value[templateId] ?? []).filter(isFieldDirty).length
}

function hasDirtyFields(templateId: string) {
  return dirtyFieldCount(templateId) > 0
}

function hasSaveableDirtyFields(templateId: string) {
  return (templateFieldsMap.value[templateId] ?? []).some(
    (field) => isFieldDirty(field) && resolveMappingStatus(field) !== 'invalid',
  )
}

function canPreviewTemplate(templateId: string) {
  return Boolean(
    !hasDirtyFields(templateId) &&
    normalizeValue(previewCandidateIdByTemplate.value[templateId]),
  )
}

function titleCasePathSegment(value: string) {
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function formatSourceOptionLabel(sourcePath: string) {
  const normalizedSourcePath = normalizeValue(sourcePath)
  if (!normalizedSourcePath) {
    return ''
  }

  const explicitLabelMap: Record<string, string> = {
    candidate_name: 'Candidate Name',
    candidate_address: 'Candidate Address',
    place_of_birth: 'Place of Birth',
    date_of_birth: 'Date of Birth',
    identity_card_number: 'Identity Card Number',
    agreement_date: 'Agreement Date',
    main_position: 'Main Position',
    job_level: 'Job Level',
    department: 'Department',
    cost_center_pt: 'PT Name',
    cost_center_pt_address: 'PT Address',
    'candidate.candidate_name': 'Candidate Name',
    'candidate.candidate_address': 'Candidate Address',
    'candidate.place_of_birth': 'Place of Birth',
    'candidate.date_of_birth': 'Date of Birth',
    'candidate.identity_card_number': 'Identity Card Number',
    'candidate.agreement_date': 'Agreement Date',
    'candidate.main_position': 'Main Position',
    'candidate.job_level': 'Job Level',
    'candidate.department': 'Department',
    'candidate.cost_center_pt': 'PT Name',
    'candidate.cost_center_pt_address': 'PT Address',
    'candidate_form.full_name': 'Full Name',
    'candidate_form.residential_address': 'Residential Address',
    'candidate_form.id_card_address': 'ID Card Address',
    'candidate_form.place_of_birth': 'Place of Birth',
    'candidate_form.date_of_birth': 'Date of Birth',
    'candidate_form.id_no': 'Identity Number',
    'candidate_form.join_date': 'Join Date',
    'candidate_form.available_start_date': 'Available Start Date',
    'employee_request_form.id': 'ERF Number',
    'employee_request_form.site': 'Site',
    'employee_request_form.employment_status': 'Employment Status',
    'employee_request_form.direct_manager': 'Direct Head',
    'employee_request_form.periode_probation': 'Probation/Contract Period (Months)',
    'employee_request_form.bu_id': 'Business Unit Category ID',
    'employee_request_form.business_unit': 'Business Unit Category',
    'employee_request_form.department_id': 'Department ID',
    'employee_request_form.master_designation_id': 'Designation ID',
    'employee_request_form.main_position': 'Requested Position',
    'employee_request_form.department_name': 'Department Name',
    'employee_request_form.designation_name': 'Designation Name',
    'employee_request_form.pt_name': 'PT Name',
    'employee_request_form.pt_address': 'PT Address',
    'employee_contract_form.id': 'NECF ID',
    'employee_contract_form.contract_number': 'Contract Number',
    'employee_contract_form.employee_code': 'Employee Code',
    'employee_contract_form.contract_start_date': 'Contract Start Date',
    'employee_contract_form.contract_end_date': 'Contract End Date',
    'employee_contract_form.approval_user_id': 'Approval User ID',
    'employee_contract_form.approval_user_name': 'Approval User Name',
    'employee_contract_form.approval_user_email': 'Approval User Email',
    'employee_contract_form.approval_user_main_position': 'Approval User Main Position',
    'employee_contract_form.approval_user_designation': 'Approval User Designation',
  }

  if (explicitLabelMap[normalizedSourcePath]) {
    return explicitLabelMap[normalizedSourcePath]
  }

  if (!normalizedSourcePath.includes('.')) {
    return titleCasePathSegment(normalizedSourcePath)
  }

  const [root, ...rest] = normalizedSourcePath.split('.')
  const rootLabelMap: Record<string, string> = {
    candidate: 'Candidate',
    candidate_form: 'Candidate Form',
    employee_request_form: 'ERF',
    employee_contract_form: 'NECF',
  }

  const rootLabel = rootLabelMap[root as string] || titleCasePathSegment(root as string)
  const fieldLabel = rest.map(titleCasePathSegment).join(' / ')
  return `${rootLabel} · ${fieldLabel}`
}

function resolveSourceSelectValue(field: ExportTemplateFieldRecord) {
  const normalizedSourcePath = normalizeValue(field.source_path)
  if (!normalizedSourcePath) {
    return ''
  }

  if (normalizedSourcePath === field.field_key) {
    return FIELD_KEY_SOURCE_OPTION
  }

  if (SOURCE_PATH_PRESETS.includes(normalizedSourcePath)) {
    return normalizedSourcePath
  }

  return CUSTOM_SOURCE_OPTION
}

function showCustomSourceInput(field: ExportTemplateFieldRecord) {
  return resolveSourceSelectValue(field) === CUSTOM_SOURCE_OPTION
}

function applySourceSelection(field: ExportTemplateFieldRecord, value: string) {
  const normalizedValue = normalizeValue(value)
  if (!normalizedValue) {
    field.source_path = ''
    return
  }

  if (normalizedValue === FIELD_KEY_SOURCE_OPTION) {
    field.source_path = field.field_key
    return
  }

  if (normalizedValue === CUSTOM_SOURCE_OPTION) {
    if (resolveSourceSelectValue(field) !== CUSTOM_SOURCE_OPTION) {
      field.source_path = ''
    }
    return
  }

  field.source_path = normalizedValue
}

function resolveMappingStatus(field: ExportTemplateFieldRecord) {
  const sourcePath = normalizeValue(field.source_path)
  if (!sourcePath) {
    return 'empty'
  }

  if (SOURCE_PATH_PRESETS.includes(sourcePath)) {
    return 'ready'
  }

  if (DIRECT_SOURCE_PATH_PRESETS.has(sourcePath)) {
    return 'ready'
  }

  const segments = sourcePath.split('.').map((segment) => segment.trim()).filter(Boolean)
  if (!segments.length) {
    return 'empty'
  }

  const [root, ...rest] = segments
  if (!ALLOWED_SOURCE_ROOTS.has(root as string) || rest.length === 0) {
    return 'invalid'
  }

  const validSegmentPattern = /^[a-zA-Z0-9_-]+$/
  if (!rest.every((segment) => validSegmentPattern.test(segment))) {
    return 'invalid'
  }

  return 'custom'
}

function filteredTemplateFields(templateId: string) {
  const fields = templateFieldsMap.value[templateId] ?? []
  const keyword = normalizeValue(fieldSearchByTemplate.value[templateId]).toLowerCase()
  const filterMode = fieldFilterByTemplate.value[templateId] ?? 'all'

  return fields.filter((field) => {
    const matchesKeyword = !keyword || [field.field_label, field.field_key, field.source_path]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(keyword))

    if (!matchesKeyword) {
      return false
    }

    const status = resolveMappingStatus(field)
    if (filterMode === 'all') {
      return true
    }

    if (filterMode === 'needs_attention') {
      return status === 'empty' || status === 'invalid'
    }

    if (filterMode === 'manual') {
      return status === 'empty'
    }

    return status === filterMode
  })
}

function countTemplateFieldsByStatus(templateId: string, status: 'ready' | 'custom' | 'empty' | 'invalid') {
  return (templateFieldsMap.value[templateId] ?? []).filter((field) => resolveMappingStatus(field) === status).length
}

function mappingStatusClassName(field: ExportTemplateFieldRecord) {
  const status = resolveMappingStatus(field)
  if (status === 'ready') return 'app-status-chip-success'
  if (status === 'custom') return 'app-status-chip-accent'
  if (status === 'empty') return 'app-status-chip-warning'
  return 'app-status-chip-danger'
}

function mappingStatusLabel(field: ExportTemplateFieldRecord) {
  const status = resolveMappingStatus(field)
  if (status === 'ready') return text('exportConfiguration.mapping.status.ready')
  if (status === 'custom') return text('exportConfiguration.mapping.status.custom')
  if (status === 'empty') return text('exportConfiguration.mapping.status.empty')
  return text('exportConfiguration.mapping.status.invalid')
}

function previewStatusClassName(status: PreparedExportField['status']) {
  if (status === 'auto_filled') return 'app-status-chip-success'
  if (status === 'manual_required') return 'app-status-chip-warning'
  return 'app-status-chip-neutral'
}

function previewStatusLabel(status: PreparedExportField['status']) {
  if (status === 'auto_filled') return text('exportConfiguration.editor.status.autoFilled')
  if (status === 'manual_required') return text('exportConfiguration.editor.status.manualRequired')
  return text('exportConfiguration.editor.status.manual')
}

function closePreviewModal() {
  previewModal.value = null
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement | null
  selectedUploadFile.value = input?.files?.[0] ?? null
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

async function handleUpload() {
  if (!canUpload.value || !selectedUploadFile.value) {
    return
  }

  uploadLoading.value = true

  try {
    const formData = new FormData()
    formData.append('name', uploadName.value.trim())
    if (uploadDescription.value.trim()) {
      formData.append('description', uploadDescription.value.trim())
    }
    formData.append('file', selectedUploadFile.value)

    const response = await callBackendApi<UploadTemplateResponse>('/api/export-templates/upload', {
      method: 'POST',
      body: formData,
    })

    lastUploadedTemplate.value = response.template
    uploadName.value = ''
    uploadDescription.value = ''
    selectedUploadFile.value = null

    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }

    await loadTemplates()
    appToast.success(text('exportConfiguration.toast.templateUploaded'))
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.templateUploadFailed')))
  } finally {
    uploadLoading.value = false
  }
}

async function loadTemplateFields(templateId: string) {
  loadingFieldsTemplateId.value = templateId
  try {
    const fields = await callBackendApi<ExportTemplateFieldRecord[]>(
      `/api/export-templates/${encodeURIComponent(templateId)}/fields`,
    )
    rememberOriginalFieldSourcePaths(fields)
    templateFieldsMap.value = {
      ...templateFieldsMap.value,
      [templateId]: fields,
    }
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.fieldsLoadFailed')))
  } finally {
    loadingFieldsTemplateId.value = ''
  }
}

async function toggleTemplateMapping(template: ExportTemplateRecord) {
  if (expandedTemplateId.value === template.id) {
    expandedTemplateId.value = ''
    return
  }

  expandedTemplateId.value = template.id
  if (!fieldFilterByTemplate.value[template.id]) {
    fieldFilterByTemplate.value = {
      ...fieldFilterByTemplate.value,
      [template.id]: 'all',
    }
  }
  if (!fieldSearchByTemplate.value[template.id]) {
    fieldSearchByTemplate.value = {
      ...fieldSearchByTemplate.value,
      [template.id]: '',
    }
  }

  if (!templateFieldsMap.value[template.id]) {
    await loadTemplateFields(template.id)
  }
}

async function persistFieldMapping(
  templateId: string,
  field: ExportTemplateFieldRecord,
  options: { silent?: boolean } = {},
) {
  setFieldSaving(field.id, true)

  try {
    const response = await callBackendApi<{ field: ExportTemplateFieldRecord }>(
      `/api/export-templates/${encodeURIComponent(templateId)}/fields/${encodeURIComponent(field.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          source_path: field.source_path ?? '',
          source_type: field.source_type,
        }),
      },
    )

    templateFieldsMap.value = {
      ...templateFieldsMap.value,
      [templateId]: (templateFieldsMap.value[templateId] ?? []).map((item) =>
        item.id === field.id ? response.field : item,
      ),
    }
    markFieldSourcePathSaved(response.field)

    if (!options.silent) {
      appToast.success(text('exportConfiguration.toast.mappingSaved'))
    }
  } catch (error) {
    if (!options.silent) {
      appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.mappingSaveFailed')))
    }
    throw error
  } finally {
    setFieldSaving(field.id, false)
  }
}

async function handleSaveFieldMapping(templateId: string, field: ExportTemplateFieldRecord) {
  await persistFieldMapping(templateId, field)
}

async function handleSaveAllFieldMappings(templateId: string) {
  const fields = (templateFieldsMap.value[templateId] ?? [])
    .filter((field) => isFieldDirty(field))
    .filter((field) => resolveMappingStatus(field) !== 'invalid')

  if (!fields.length) {
    return
  }

  savingTemplateId.value = templateId

  try {
    for (const field of fields) {
      await persistFieldMapping(templateId, field, { silent: true })
    }

    appToast.success(text('exportConfiguration.toast.allMappingsSaved'))
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.mappingSaveFailed')))
  } finally {
    savingTemplateId.value = ''
  }
}

async function handlePreviewTemplateMapping(template: ExportTemplateRecord) {
  const candidateId = normalizeValue(previewCandidateIdByTemplate.value[template.id])
  if (!candidateId || hasDirtyFields(template.id)) {
    return
  }

  previewLoadingTemplateId.value = template.id

  try {
    const response = await callBackendApi<PrepareExportResponse>('/api/export-documents/prepare', {
      method: 'POST',
      body: JSON.stringify({
        template_id: template.id,
        candidate_id: candidateId,
      }),
    })

    previewModal.value = {
      templateName: response.template.name,
      candidateName: response.candidate.candidate_name,
      fields: response.fields,
    }
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.previewFailed')))
  } finally {
    previewLoadingTemplateId.value = ''
  }
}

async function handleDeleteTemplate(template: ExportTemplateRecord) {
  const confirmed = await appConfirm.confirm({
    title: text('exportConfiguration.confirm.deleteTemplateTitle'),
    message: text('exportConfiguration.confirm.deleteTemplateMessage', { name: template.name }),
    confirmLabel: text('common.actions.delete'),
    cancelLabel: text('common.actions.cancel'),
    tone: 'danger',
  })

  if (!confirmed) {
    return
  }

  deletingTemplateId.value = template.id

  try {
    await callBackendApi<{ success: true }>(`/api/export-templates/${encodeURIComponent(template.id)}`, {
      method: 'DELETE',
    })

    if (lastUploadedTemplate.value?.id === template.id) {
      lastUploadedTemplate.value = null
    }

    await loadTemplates()
    appToast.success(text('exportConfiguration.toast.templateDeleted'))
  } catch (error) {
    appToast.error(resolveErrorMessage(error, text('exportConfiguration.toast.templateDeleteFailed')))
  } finally {
    deletingTemplateId.value = ''
  }
}
</script>
