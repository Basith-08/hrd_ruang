<template>
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="flex items-start gap-4">
        <AppActionButton variant="icon" :label="text('common.actions.back')" @click="router.back()">
          ←
        </AppActionButton>
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">{{ text('employeeRequestForms.form.eyebrow') }}</p>
          <h1 class="app-dashboard-title mt-3">
            {{ pageTitle }}
          </h1>
          <p class="app-dashboard-copy mt-2">
            {{ pageDescription }}
          </p>
        </div>
      </div>
      <AppActionButton
        v-if="canEditFromDetail"
        class="inline-flex min-h-11 min-w-[132px] items-center justify-center xl:flex-none"
        variant="primary"
        :label="text('employeeRequestForms.form.actions.editErf')"
        @click="goToEdit"
      />
      <div v-if="!isDetail" class="flex flex-wrap items-center gap-3">
        <AppActionButton
          class="inline-flex min-h-11 items-center justify-center"
          variant="secondary"
          :label="text('employeeRequestForms.form.actions.downloadTemplate')"
          @click="handleDownloadTemplate"
        />
        <AppActionButton
          class="inline-flex min-h-11 items-center justify-center"
          variant="primary"
          :disabled="isBusy || parsingErfDocument"
          :loading="parsingErfDocument"
          :loading-label="text('employeeRequestForms.form.actions.parsingDocument')"
          :label="text('employeeRequestForms.form.actions.uploadErf')"
          @click="triggerErfDocumentUpload"
        />
        <input
          ref="erfDocumentInputRef"
          type="file"
          class="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          @change="handleErfDocumentInputChange"
        />
      </div>
    </div>

    <div
      v-if="
        selectedAttachmentFiles.document_erf.length > 0 ||
        attachmentPreviewLinks.document_erf.length > 0
      "
      class="app-attachment-card"
    >
      <div class="app-attachment-card-header">
        <span class="app-attachment-card-title">{{
          text('employeeRequestForms.form.fields.erfDocument')
        }}</span>
        <span class="app-attachment-card-badge">
          {{
            selectedAttachmentFiles.document_erf.length + attachmentPreviewLinks.document_erf.length
          }}
        </span>
      </div>
      <div class="app-attachment-preview">
        <div
          v-if="selectedAttachmentFiles.document_erf.length > 0"
          class="app-attachment-group mt-4"
        >
          <p class="app-attachment-preview-title">
            {{ text('employeeRequestForms.form.attachments.pendingUpload') }}
          </p>
          <div
            v-for="(file, index) in selectedAttachmentFiles.document_erf"
            :key="`${file.name}-${file.size}-${index}`"
            class="app-file-list-row"
          >
            <span class="truncate pr-3">{{ file.name }}</span>
            <AppActionButton
              v-if="!isDetail"
              class="shrink-0"
              variant="ghost"
              :label="text('employeeRequestForms.form.actions.remove')"
              @click="removePendingAttachment('document_erf', index)"
            />
          </div>
        </div>

        <div
          v-if="attachmentPreviewLinks.document_erf.length > 0"
          class="app-attachment-group mt-4"
        >
          <p class="app-attachment-preview-title">
            {{ text('employeeRequestForms.form.attachments.uploadedFiles') }}
          </p>
          <div
            v-for="(item, index) in attachmentPreviewLinks.document_erf"
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
              @click="removeStoredAttachment('document_erf', index)"
            />
          </div>
        </div>
      </div>
    </div>

    <AppAlert :message="error" />

    <section class="app-dashboard-panel">
      <div class="app-dashboard-panel-body">
        <form v-if="!pageLoading" class="flex flex-col gap-6" @submit.prevent="handleSubmit">
          <fieldset class="contents" :disabled="isFormDisabled">
            <div class="grid gap-x-5 gap-y-6 md:grid-cols-2">
              <label v-if="canViewRequesterField" class="space-y-2 md:col-span-2">
                <span class="app-field-label">{{
                  text('employeeRequestForms.form.fields.requester')
                }}</span>
                <SearchableSelect
                  v-if="canEditRequesterField"
                  :model-value="form.created_by ?? ''"
                  :options="requesterSelectOptions"
                  :placeholder="text('employeeRequestForms.form.placeholders.searchRequester')"
                  :disabled="isBusy"
                  :loading="requesterOptionsLoading"
                  :show-empty-option="false"
                  @update:model-value="form.created_by = typeof $event === 'string' ? $event : null"
                />
                <AppFormInput v-else :model-value="requesterDisplayName" type="text" disabled />
              </label>

              <EmployeeRequestFormFields
                :form="form"
                :fields="formFields"
                :is-form-disabled="isFormDisabled"
                :text="text"
                :sanitize-number-field="sanitizeNumberField"
              >
                <template #before-custom-groups>
                  <EmployeeRequestFormAttachmentField
                    v-for="attachment in attachmentSections"
                    :key="attachment.key"
                    :title="attachment.title"
                    :pending-files="selectedAttachmentFiles[attachment.key]"
                    :stored-files="attachmentPreviewLinks[attachment.key]"
                    :accept="erfAttachmentAccept"
                    :is-busy="isBusy"
                    :is-detail="isDetail"
                    :text="text"
                    @change="handleAttachmentChange(attachment.key, $event)"
                    @remove-pending="removePendingAttachment(attachment.key, $event)"
                    @remove-stored="removeStoredAttachment(attachment.key, $event)"
                  />

                  <template v-if="!isDetail">
                    <div class="app-form-section-header md:col-span-2">
                      <span class="app-form-section-icon" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.8"
                        >
                          <path d="M12 3v18" />
                          <path d="M7 8h10" />
                          <path d="M7 12h10" />
                          <path d="M7 16h10" />
                        </svg>
                      </span>
                      <div class="app-form-section-line">
                        <span class="app-form-section-title">{{
                          text('employeeRequestForms.form.sections.approval')
                        }}</span>
                      </div>
                    </div>

                    <div v-if="!isEdit" class="md:col-span-2">
                      <div
                        class="language-switcher inline-flex items-center gap-1 p-1"
                        role="group"
                        :aria-label="text('employeeRequestForms.form.sections.approval')"
                      >
                        <button
                          type="button"
                          class="language-switcher__button min-w-[7rem] px-3 py-2"
                          :class="
                            approvalMode === 'manual'
                              ? 'language-switcher__button--active'
                              : 'language-switcher__button--inactive'
                          "
                          :aria-pressed="approvalMode === 'manual'"
                          :disabled="isFormDisabled"
                          @click="approvalMode = 'manual'"
                        >
                          {{ text('employeeRequestForms.form.approvalMode.manual') }}
                        </button>
                        <button
                          type="button"
                          class="language-switcher__button min-w-[7rem] px-3 py-2"
                          :class="
                            approvalMode === 'auto'
                              ? 'language-switcher__button--active'
                              : 'language-switcher__button--inactive'
                          "
                          :aria-pressed="approvalMode === 'auto'"
                          :disabled="isFormDisabled"
                          @click="approvalMode = 'auto'"
                        >
                          {{ text('employeeRequestForms.form.approvalMode.auto') }}
                        </button>
                      </div>
                    </div>

                    <div v-if="approvalMode === 'auto'" class="app-helper-text md:col-span-2">
                      {{ text('employeeRequestForms.form.messages.autoApprovalHelper') }}
                    </div>

                    <template v-else>
                      <div v-if="approvalPreviewLoading" class="app-copy-body md:col-span-2">
                        {{ text('employeeRequestForms.form.messages.loadingApprovalPreview') }}
                      </div>

                      <div
                        v-else-if="!selectedApprovalPreviewDesignationLabel"
                        class="app-helper-text md:col-span-2"
                      >
                        {{
                          text(
                            'employeeRequestForms.form.messages.selectDesignationToPreviewApproval',
                          )
                        }}
                      </div>

                      <div
                        v-else-if="!hasApprovalPreviewContent"
                        class="app-helper-text md:col-span-2"
                      >
                        {{
                          text('employeeRequestForms.form.messages.noApprovalConfigured', {
                            designationLabel: selectedApprovalPreviewDesignationLabel,
                            flowTitle: selectedApprovalFlowTitle,
                          })
                        }}
                      </div>

                      <div v-else class="space-y-4 md:col-span-2">
                        <p class="app-helper-text">
                          {{
                            text('employeeRequestForms.form.messages.approvalPreviewHelper', {
                              flowTitle: selectedApprovalFlowTitle,
                            })
                          }}
                        </p>

                        <div class="grid gap-x-5 gap-y-6 md:grid-cols-2">
                          <label class="space-y-2">
                            <span class="app-field-label">{{
                              text('employeeRequestForms.form.fields.buDirectorApproval')
                            }}</span>
                            <SearchableSelect
                              :model-value="form.approval_director_bu_id ?? ''"
                              :options="directorBuApprovalSelectOptions"
                              :placeholder="
                                text('employeeRequestForms.form.placeholders.searchBuDirector')
                              "
                              :disabled="
                                isFormDisabled || directorBuApprovalSelectOptions.length === 0
                              "
                              show-empty-option
                              :empty-label="
                                text('employeeRequestForms.form.placeholders.selectBuDirector')
                              "
                              :empty-value="null"
                              @update:model-value="updateDirectorBuApproval($event)"
                            />
                            <p v-if="directorBuApprovalError" class="app-error-text">
                              {{ directorBuApprovalError }}
                            </p>
                          </label>
                          <label
                            v-for="step in approvalPreviewSteps"
                            :key="step.key"
                            class="space-y-2"
                          >
                            <span class="app-field-label">{{ step.label }}</span>
                            <AppFormInput :model-value="step.value" type="text" readonly />
                          </label>
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </EmployeeRequestFormFields>
            </div>
          </fieldset>

          <div
            v-if="!isDetail"
            class="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"
          >
            <AppActionButton
              variant="secondary"
              :label="text('common.actions.cancel')"
              :disabled="isBusy"
              @click="router.back()"
            />

            <AppActionButton
              type="submit"
              variant="primary"
              :label="submitActionLabel"
              :disabled="isBusy"
            />
          </div>
        </form>
        <div v-else class="app-copy-body py-10 text-center">
          {{ text('employeeRequestForms.form.messages.loadingData') }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from '#imports'

import {
  employmentStatusOptions,
  positionStatusOptions,
} from '@/domain/entities/EmployeeRequestForm'
import type { MasterDataItem } from '@/domain/entities/MasterData'
import type { EmployeeRequestFormRequest } from '@/domain/requests/EmployeeRequestFormRequest'
import {
  getApprovalFlowTemplate,
  resolveConfiguredApprovalFlowKeyFromDesignation,
} from '@/domain/utils/approvalFlowConfig'
import {
  createAttachmentPreviewLinksState,
  createEmployeeRequestFormState,
  createSelectedAttachmentFilesState,
  type AttachmentPreviewLinksState,
  type SelectedAttachmentFilesState,
} from '@/features/employeeRequestForms/EmployeeRequestFormPage.state'
import EmployeeRequestFormAttachmentField from '@/features/employeeRequestForms/components/EmployeeRequestFormAttachmentField.vue'
import EmployeeRequestFormFields, {
  type EmployeeRequestFormFieldConfig,
} from '@/features/employeeRequestForms/components/EmployeeRequestFormFields.vue'
import type {
  AttachmentPreviewItem,
  DirectManagerOption,
  EmployeeRequestFormSelectOption,
  ErfAttachmentFieldKey,
} from '@/features/employeeRequestForms/types/EmployeeRequestFormPage.type'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppFormInput from '@/presentation/components/forms/AppFormInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'
import { useMasterDataViewModel } from '@/viewmodels/useMasterDataViewModel'
import { supabase } from '@/infrastructure/supabase/client'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import { useLocale } from '@/composables/useLocale'
import {
  ErfDocumentParseError,
  extractErfDocumentFields,
  parseErfDateValue,
  parseErfProbationMonths,
  type ParsedErfDocumentFields,
} from '@/presentation/utils/employeeRequestFormDocumentParser'
import { findOptionByLabel } from '@/presentation/utils/fuzzyMatch'

const route = useRoute()
const router = useRouter()
const { text } = useLocale()
const { loading, saving, error, create, update, getById } = useEmployeeRequestFormViewModel({
  autoLoad: false,
})
const { optionsByType, loadAllOptions: loadMasterDataOptions } = useMasterDataViewModel()
const { hasPermission, user } = useAuthViewModel()
const appToast = useAppToast()

const { erfDocumentBucket } = getPublicAppConfig()
const maxErfAttachmentSizeInBytes = 10 * 1024 * 1024
const allowedErfAttachmentMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const erfAttachmentAccept = '.pdf,.jpg,.jpeg,.png,.webp'

const id = computed(() => route.params.id as string | undefined)
const isDetail = computed(() => route.name === 'employee-request-forms-detail')
const isEdit = computed(() => route.name === 'employee-request-forms-edit')
const isExistingRecord = computed(() => Boolean(id.value))
const canEditFromDetail = computed(
  () => isDetail.value && hasPermission('employee_request_form:update'),
)
const uploadingAttachments = ref(false)
const recordLoading = ref(false)
const erfTemplateDownloadUrl =
  'https://kjjrokinkbxvxbbukeik.supabase.co/storage/v1/object/public/template-erf/Template%20Employee%20Request%20Form%20(ERF).docx'
const erfDocumentInputRef = ref<HTMLInputElement | null>(null)
const parsingErfDocument = ref(false)
const approvalMode = ref<'auto' | 'manual'>('manual')
const fieldMismatchWarnings = reactive<Record<string, string>>({})
const fieldMismatchValues = reactive<Record<string, string>>({})
const parsedFieldOverrideOptions = reactive<Record<string, EmployeeRequestFormSelectOption>>({})
const hasResolvedExistingRecord = ref(false)
const loadedJob = ref<Awaited<ReturnType<typeof getById>>>(null)
const isBusy = computed(() => saving.value || uploadingAttachments.value)
const isFormDisabled = computed(() => isDetail.value || isBusy.value)
const pageLoading = computed(() => loading.value || recordLoading.value)
const canReadEmployeeRequestForms = computed(() => hasPermission('employee_request_form:read'))
const canReadApprovedEmployeeRequestForms = computed(() =>
  hasPermission('recruitment:approved_erf_read'),
)
const canViewRequesterField = computed(() => hasPermission('employee_request_form:requester_read'))
const canEditRequesterField = computed(() =>
  hasPermission('employee_request_form:requester_update'),
)
const pageTitle = computed(() => {
  if (isDetail.value) return text('employeeRequestForms.form.title.detail')
  if (isEdit.value) return text('employeeRequestForms.form.title.edit')
  return text('employeeRequestForms.form.title.new')
})
const pageDescription = computed(() => {
  if (isDetail.value) return text('employeeRequestForms.form.description.detail')
  if (isEdit.value) return text('employeeRequestForms.form.description.edit')
  return text('employeeRequestForms.form.description.new')
})
const submitLabel = computed(() =>
  isEdit.value
    ? text('employeeRequestForms.form.actions.updateErf')
    : text('employeeRequestForms.form.actions.saveErf'),
)
const submitActionLabel = computed(() => {
  if (uploadingAttachments.value) return text('employeeRequestForms.form.actions.uploadingFiles')
  if (saving.value) return text('employeeRequestForms.form.actions.saving')
  return submitLabel.value
})

const form = reactive<EmployeeRequestFormRequest>(createEmployeeRequestFormState())
const directManagers = ref<DirectManagerOption[]>([])
const allUserProfiles = ref<DirectManagerOption[]>([])
const requesterProfiles = ref<DirectManagerOption[]>([])
const requesterOptionsLoading = ref(false)
const directorBuApprovalError = ref('')
const approvalPreviewLoading = ref(false)
const approvalPreviewRows = ref<
  Array<{
    profile_id: string
    approval_flow_key: string
    approval_role_key: string
    step_order: number
    approval_role_label: string
    approver_display: string
  }>
>([])
const selectedAttachmentFiles = reactive<SelectedAttachmentFilesState>(
  createSelectedAttachmentFilesState(),
)
const attachmentPreviewLinks = reactive<AttachmentPreviewLinksState>(
  createAttachmentPreviewLinksState(),
)

const attachmentSections = computed<Array<{ key: ErfAttachmentFieldKey; title: string }>>(() => [
  {
    key: 'organizational_structure',
    title: text('employeeRequestForms.form.fields.organizationalStructure'),
  },
  {
    key: 'job_description',
    title: text('employeeRequestForms.form.fields.jobDescription'),
  },
])

const requesterDisplayName = computed(() => {
  if (isExistingRecord.value) {
    return String(loadedJob.value?.created_by_name ?? '').trim() || '-'
  }

  return (
    String(user.value?.full_name ?? user.value?.username ?? user.value?.email ?? '').trim() || '-'
  )
})
const requesterSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() => {
  const options = requesterProfiles.value.map((profile) => ({
    value: profile.id,
    label: profile.label,
  }))
  const selectedRequesterId = String(form.created_by ?? '').trim()

  if (
    !selectedRequesterId ||
    options.some((option) => String(option.value ?? '').trim() === selectedRequesterId)
  ) {
    return options
  }

  return [
    {
      value: selectedRequesterId,
      label: requesterDisplayName.value === '-' ? selectedRequesterId : requesterDisplayName.value,
    },
    ...options,
  ]
})

function sanitizeNumberField(target: Record<string, any>, field: string) {
  if (target[field] < 0) {
    target[field] = 0
  }
}

function getJakartaTodayDateKey() {
  return formatDateKeyInJakarta(new Date())
}

function formatDateKeyInJakarta(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${byType.year}-${byType.month}-${byType.day}`
}

function addMonthsToDateKey(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return dateKey

  const targetMonthIndex = month - 1 + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedTargetMonthIndex = ((targetMonthIndex % 12) + 12) % 12
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, normalizedTargetMonthIndex + 1, 0),
  ).getUTCDate()
  const safeDay = Math.min(day, lastDayOfTargetMonth)

  return [
    String(targetYear).padStart(4, '0'),
    String(normalizedTargetMonthIndex + 1).padStart(2, '0'),
    String(safeDay).padStart(2, '0'),
  ].join('-')
}

function normalizeRequiredDateLeadTimeMonths(value: unknown) {
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return 0
  }

  return parsedValue
}

function getRequiredDateLeadTimeLabel(monthCount: number) {
  if (monthCount === 1)
    return text('employeeRequestForms.form.messages.monthSingular', { count: monthCount })
  return text('employeeRequestForms.form.messages.monthPlural', { count: monthCount })
}

function createUploadKeySuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sanitizeStorageSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getStoredAttachments(fieldKey: ErfAttachmentFieldKey) {
  return Array.isArray(form[fieldKey]) ? [...form[fieldKey]] : []
}

function createFileFingerprint(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function removePendingAttachment(fieldKey: ErfAttachmentFieldKey, index: number) {
  selectedAttachmentFiles[fieldKey].splice(index, 1)
}

function removeStoredAttachment(fieldKey: ErfAttachmentFieldKey, index: number) {
  const attachments = getStoredAttachments(fieldKey)
  attachments.splice(index, 1)
  form[fieldKey] = attachments
  void resolveAttachmentPreviewLink(fieldKey)
}

function clearSelectedAttachment(fieldKey: ErfAttachmentFieldKey) {
  selectedAttachmentFiles[fieldKey] = []
}

function normalizeAttachmentPaths(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getAttachmentPathFingerprint(path: string) {
  return String(path ?? '')
    .trim()
    .toLowerCase()
}

function getAttachmentOwnerId() {
  return (
    sanitizeStorageSegment(String(user.value?.id ?? 'employee-request-form')) ||
    'employee-request-form'
  )
}

function getAttachmentFilePath(fieldKey: ErfAttachmentFieldKey, file: File) {
  const fileExtension = String(file.name.split('.').pop() ?? 'bin').toLowerCase()
  const ownerId = getAttachmentOwnerId()
  const uploadKeySuffix = createUploadKeySuffix()
  const fileName =
    sanitizeStorageSegment(`${ownerId}-${fieldKey}-${uploadKeySuffix}`) ||
    `${ownerId}-${fieldKey}-${uploadKeySuffix}`

  return `employee-request-forms/${ownerId}/${fieldKey}/${fileName}.${fileExtension}`
}

function getAttachmentExistingPaths(fieldKey: ErfAttachmentFieldKey) {
  return new Set(getStoredAttachments(fieldKey).map(getAttachmentPathFingerprint))
}

function getPendingAttachmentFingerprints(fieldKey: ErfAttachmentFieldKey) {
  return new Set(selectedAttachmentFiles[fieldKey].map(createFileFingerprint))
}

function getAttachmentUploadPath(fieldKey: ErfAttachmentFieldKey, file: File) {
  return getAttachmentFilePath(fieldKey, file)
}

function getAttachmentNormalizedPath(path: string) {
  return String(path ?? '').trim()
}

function getAttachmentFileExtension(value: string) {
  const source = String(value ?? '').trim()
  if (!source) return ''

  const sanitizedSource = source.split('?')[0]?.split('#')[0] ?? source
  const fileName = sanitizedSource.split('/').pop() ?? sanitizedSource
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (!/^[a-z0-9]{1,10}$/.test(extension)) {
    return ''
  }

  return extension
}

function getAttachmentDisplayTitle(fieldKey: ErfAttachmentFieldKey) {
  if (fieldKey === 'organizational_structure') {
    return text('employeeRequestForms.form.fields.organizationalStructure')
  }

  if (fieldKey === 'document_erf') {
    return text('employeeRequestForms.form.fields.erfDocument')
  }

  return text('employeeRequestForms.form.fields.jobDescription')
}

function getAttachmentDisplayName(
  fieldKey: ErfAttachmentFieldKey,
  sourceName: string,
  index: number,
  totalItems: number,
) {
  const title = getAttachmentDisplayTitle(fieldKey)
  const suffix = totalItems > 1 ? ` ${index + 1}` : ''
  const extension = getAttachmentFileExtension(sourceName)

  return extension ? `${title}${suffix}.${extension}` : `${title}${suffix}`
}

function getAttachmentFilePreview(
  fieldKey: ErfAttachmentFieldKey,
  path: string,
  url: string,
  index: number,
  totalItems: number,
): AttachmentPreviewItem {
  return {
    path,
    name: getAttachmentDisplayName(fieldKey, path, index, totalItems),
    url,
  }
}

function isAllowedAttachmentFile(file: File) {
  if (allowedErfAttachmentMimeTypes.has(file.type)) return true

  const extension = String(file.name.split('.').pop() ?? '').toLowerCase()
  return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(extension)
}

function handleAttachmentChange(fieldKey: ErfAttachmentFieldKey, event: Event) {
  const input = event.target as HTMLInputElement | null
  const nextFiles = Array.from(input?.files ?? [])

  if (nextFiles.length === 0) return

  let hasInvalidType = false
  let hasOversizedFile = false
  const existingFingerprints = getPendingAttachmentFingerprints(fieldKey)
  const validFiles: File[] = []

  for (const file of nextFiles) {
    if (file.size > maxErfAttachmentSizeInBytes) {
      hasOversizedFile = true
      continue
    }

    if (!isAllowedAttachmentFile(file)) {
      hasInvalidType = true
      continue
    }

    const fingerprint = createFileFingerprint(file)
    if (existingFingerprints.has(fingerprint)) {
      continue
    }

    existingFingerprints.add(fingerprint)
    validFiles.push(file)
  }

  if (validFiles.length > 0) {
    selectedAttachmentFiles[fieldKey].push(...validFiles)
  }

  if (input) {
    input.value = ''
  }

  if (hasOversizedFile) {
    appToast.error(text('employeeRequestForms.form.errors.attachmentTooLarge'))
  }

  if (hasInvalidType) {
    appToast.error(text('employeeRequestForms.form.errors.invalidAttachmentType'))
  }
}

async function resolveAttachmentPreviewLink(fieldKey: ErfAttachmentFieldKey) {
  const paths = getStoredAttachments(fieldKey)

  if (paths.length === 0) {
    attachmentPreviewLinks[fieldKey] = []
    return
  }

  const items = await Promise.all(
    paths.map(async (path, index) => {
      const normalizedPath = getAttachmentNormalizedPath(path)

      if (/^https?:\/\//i.test(normalizedPath)) {
        return getAttachmentFilePreview(
          fieldKey,
          normalizedPath,
          normalizedPath,
          index,
          paths.length,
        )
      }

      const { data, error } = await supabase.storage
        .from(erfDocumentBucket)
        .createSignedUrl(normalizedPath, 60 * 60)

      return getAttachmentFilePreview(
        fieldKey,
        normalizedPath,
        error ? '' : data.signedUrl,
        index,
        paths.length,
      )
    }),
  )

  attachmentPreviewLinks[fieldKey] = items.filter((item) => item.url)
}

async function syncAttachmentPreviewLinks() {
  await Promise.all([
    resolveAttachmentPreviewLink('organizational_structure'),
    resolveAttachmentPreviewLink('job_description'),
    resolveAttachmentPreviewLink('document_erf'),
  ])
}

type ErfAttachmentUploadOptions = {
  refreshPreview?: boolean
}

async function uploadAttachmentIfNeeded(
  fieldKey: ErfAttachmentFieldKey,
  options: ErfAttachmentUploadOptions = {},
) {
  const { refreshPreview = true } = options
  const files = [...selectedAttachmentFiles[fieldKey]]
  const uploadedPaths = [...getStoredAttachments(fieldKey)]
  const existingPaths = getAttachmentExistingPaths(fieldKey)

  if (files.length === 0) {
    return uploadedPaths
  }

  const uploadedFilePaths = await Promise.all(
    files.map(async (file) => {
      const filePath = getAttachmentUploadPath(fieldKey, file)

      const { error: uploadError } = await supabase.storage
        .from(erfDocumentBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      return filePath
    }),
  )

  for (const filePath of uploadedFilePaths) {
    const fingerprint = getAttachmentPathFingerprint(filePath)
    if (!existingPaths.has(fingerprint)) {
      existingPaths.add(fingerprint)
      uploadedPaths.push(filePath)
    }
  }

  selectedAttachmentFiles[fieldKey] = []
  form[fieldKey] = uploadedPaths
  if (refreshPreview) {
    await resolveAttachmentPreviewLink(fieldKey)
  }

  return uploadedPaths
}

async function uploadErfAttachmentsIfNeeded(options: ErfAttachmentUploadOptions = {}) {
  uploadingAttachments.value = true

  try {
    const [organizationalStructure, jobDescription, documentErf] = await Promise.all([
      uploadAttachmentIfNeeded('organizational_structure', options),
      uploadAttachmentIfNeeded('job_description', options),
      uploadAttachmentIfNeeded('document_erf', options),
    ])

    return {
      organizational_structure: organizationalStructure,
      job_description: jobDescription,
      document_erf: documentErf,
    }
  } finally {
    uploadingAttachments.value = false
  }
}

function withCurrentOption(options: MasterDataItem[], currentValue: string) {
  const normalizedValue = currentValue.trim()
  if (!normalizedValue) return options
  if (options.some((option) => option.name === normalizedValue)) return options

  return [
    {
      id: `current-${normalizedValue}`,
      name: normalizedValue,
      description: text('employeeRequestForms.form.messages.existingErfValue'),
      created_at: null,
      updated_at: null,
    },
    ...options,
  ]
}

function withOverrideOption(fieldKey: string, options: EmployeeRequestFormSelectOption[]) {
  const override = parsedFieldOverrideOptions[fieldKey]
  if (!override) return options
  if (options.some((option) => String(option.value ?? '') === String(override.value ?? '')))
    return options

  return [override, ...options]
}

const ptOptions = computed(() => withCurrentOption(optionsByType.value.pt, form.pt_pembebanan))
const businessUnitOptions = computed(() => optionsByType.value.bu ?? [])
const departmentOptions = computed(() =>
  withCurrentOption(optionsByType.value.department, form.department),
)
const ptSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  ptOptions.value.map((option) => ({ value: option.name, label: option.name })),
)
const businessUnitSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  withOverrideOption(
    'bu_id',
    businessUnitOptions.value.map((option) => ({ value: option.id, label: option.name })),
  ),
)
const departmentSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  departmentOptions.value.map((option) => ({ value: option.name, label: option.name })),
)
const designationSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  withOverrideOption(
    'master_designation_id',
    optionsByType.value.designation.map((option) => ({
      value: option.id,
      label: option.name,
    })),
  ),
)
const employmentStatusSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  withOverrideOption(
    'employment_status',
    employmentStatusOptions.map((option) => ({ value: option, label: option })),
  ),
)
const positionStatusSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  withOverrideOption(
    'position_status',
    positionStatusOptions.map((option) => ({ value: option, label: option })),
  ),
)
const directManagerSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() =>
  withOverrideOption(
    'direct_manager',
    directManagers.value.map((manager) => ({ value: manager.label, label: manager.label })),
  ),
)

function handleDownloadTemplate() {
  window.open(erfTemplateDownloadUrl, '_blank', 'noopener')
}

function triggerErfDocumentUpload() {
  if (isBusy.value || parsingErfDocument.value) return
  erfDocumentInputRef.value?.click()
}

function clearErfDocumentParseState() {
  for (const key of Object.keys(fieldMismatchWarnings)) {
    delete fieldMismatchWarnings[key]
  }
  for (const key of Object.keys(fieldMismatchValues)) {
    delete fieldMismatchValues[key]
  }
  for (const key of Object.keys(parsedFieldOverrideOptions)) {
    delete parsedFieldOverrideOptions[key]
  }
}

function clearMismatchWarningIfChanged(fieldKey: string, currentValue: unknown) {
  if (!(fieldKey in fieldMismatchWarnings)) return
  if (String(currentValue ?? '') === fieldMismatchValues[fieldKey]) return

  delete fieldMismatchWarnings[fieldKey]
  delete fieldMismatchValues[fieldKey]
}

function applyParsedFreeTextField(
  formKey: 'main_position' | 'site' | 'working_location',
  rawValue: string | undefined,
) {
  const trimmed = String(rawValue ?? '').trim()
  if (!trimmed) return
  ;(form as unknown as Record<string, unknown>)[formKey] = trimmed
}

function applyParsedNameField(
  formKey: 'pt_pembebanan' | 'department',
  rawValue: string | undefined,
  options: EmployeeRequestFormSelectOption[],
) {
  const trimmed = String(rawValue ?? '').trim()
  if (!trimmed) return

  // pt_pembebanan/department are persisted by resolving an *exact* name match
  // against master data server-side (see resolveMasterDataIds) — there is no
  // raw-text fallback column. So once a match (even a fuzzy one) is found, we
  // must store the master data's real label, not the as-typed text, or the
  // save-time lookup will silently fail to resolve pt_id/department_id.
  const matched = findOptionByLabel(options, trimmed)

  if (matched) {
    ;(form as unknown as Record<string, unknown>)[formKey] = matched.label
    return
  }

  ;(form as unknown as Record<string, unknown>)[formKey] = trimmed
  fieldMismatchWarnings[formKey] = text('employeeRequestForms.form.messages.fieldMismatchWarning')
  fieldMismatchValues[formKey] = trimmed
}

function applyParsedSelectField(
  formKey:
    | 'bu_id'
    | 'master_designation_id'
    | 'employment_status'
    | 'position_status'
    | 'direct_manager',
  overrideKey: string,
  rawValue: string | undefined,
  options: EmployeeRequestFormSelectOption[],
) {
  const trimmed = String(rawValue ?? '').trim()
  if (!trimmed) return

  const matched = findOptionByLabel(options, trimmed)

  if (matched) {
    ;(form as unknown as Record<string, unknown>)[formKey] = matched.value
    return
  }

  ;(form as unknown as Record<string, unknown>)[formKey] = trimmed
  parsedFieldOverrideOptions[overrideKey] = { value: trimmed, label: trimmed }
  fieldMismatchWarnings[formKey] = text('employeeRequestForms.form.messages.fieldMismatchWarning')
  fieldMismatchValues[formKey] = trimmed
}

function applyParsedDateField(
  formKey: 'requested_date' | 'required_date',
  rawValue: string | undefined,
) {
  const trimmed = String(rawValue ?? '').trim()
  if (!trimmed) return

  const isoDate = parseErfDateValue(trimmed)
  if (isoDate) {
    ;(form as unknown as Record<string, unknown>)[formKey] = isoDate
    return
  }

  fieldMismatchWarnings[formKey] = text('employeeRequestForms.form.messages.dateParseWarning')
  fieldMismatchValues[formKey] = String(form[formKey] ?? '')
}

function applyParsedProbationField(rawValue: string | undefined) {
  const trimmed = String(rawValue ?? '').trim()
  if (!trimmed) return

  const months = parseErfProbationMonths(trimmed)
  if (months !== null) {
    form.periode_probation = months
    return
  }

  fieldMismatchWarnings.periode_probation = text(
    'employeeRequestForms.form.messages.fieldMismatchWarning',
  )
  fieldMismatchValues.periode_probation = String(form.periode_probation ?? '')
}

function applyParsedErfFields(parsed: ParsedErfDocumentFields) {
  applyParsedDateField('requested_date', parsed.requested_date)
  applyParsedDateField('required_date', parsed.required_date)
  applyParsedNameField('pt_pembebanan', parsed.pt_pembebanan, ptSelectOptions.value)
  applyParsedSelectField(
    'bu_id',
    'bu_id',
    parsed.bu_category,
    businessUnitOptions.value.map((option) => ({ value: option.id, label: option.name })),
  )
  applyParsedNameField('department', parsed.department, departmentSelectOptions.value)
  applyParsedSelectField(
    'master_designation_id',
    'master_designation_id',
    parsed.designation,
    optionsByType.value.designation.map((option) => ({ value: option.id, label: option.name })),
  )
  applyParsedFreeTextField('main_position', parsed.main_position)
  applyParsedSelectField(
    'employment_status',
    'employment_status',
    parsed.employment_status,
    employmentStatusOptions.map((option) => ({ value: option, label: option })),
  )
  applyParsedSelectField(
    'position_status',
    'position_status',
    parsed.position_status,
    positionStatusOptions.map((option) => ({ value: option, label: option })),
  )
  applyParsedProbationField(parsed.periode_probation)
  applyParsedSelectField(
    'direct_manager',
    'direct_manager',
    parsed.direct_manager,
    directManagers.value.map((manager) => ({ value: manager.label, label: manager.label })),
  )
  applyParsedFreeTextField('site', parsed.site)
  applyParsedFreeTextField('working_location', parsed.working_location)
}

async function handleErfDocumentUpload(file: File) {
  if (file.size > maxErfAttachmentSizeInBytes) {
    appToast.error(text('employeeRequestForms.form.errors.attachmentTooLarge'))
    return
  }

  // Keep the uploaded document even if parsing below fails — the file itself
  // is still worth saving so it isn't lost, only the autofill is best-effort.
  selectedAttachmentFiles.document_erf.push(file)

  clearErfDocumentParseState()
  parsingErfDocument.value = true

  try {
    const parsed = await extractErfDocumentFields(file)

    if (Object.keys(parsed).length === 0) {
      appToast.error(text('employeeRequestForms.form.errors.noFieldsRecognized'))
      return
    }

    applyParsedErfFields(parsed)

    const warningCount = Object.keys(fieldMismatchWarnings).length
    if (warningCount > 0) {
      appToast.error(
        text('employeeRequestForms.form.toasts.documentParsedWithWarnings', {
          count: warningCount,
        }),
      )
    } else {
      appToast.success(text('employeeRequestForms.form.toasts.documentParsed'))
    }
  } catch (err) {
    const message =
      err instanceof ErfDocumentParseError
        ? err.message
        : text('employeeRequestForms.form.errors.parseFailed')
    appToast.error(message)
  } finally {
    parsingErfDocument.value = false
  }
}

function handleErfDocumentInputChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] ?? null

  if (input) {
    input.value = ''
  }

  if (!file) return

  void handleErfDocumentUpload(file)
}

const availableApprovalFlowKeys = computed(
  () =>
    new Set(
      approvalPreviewRows.value
        .map((row) => String(row.approval_flow_key ?? '').trim())
        .filter(Boolean),
    ),
)
const selectedApprovalPreviewDesignationLabel = computed(() =>
  String(selectedDesignationOption.value?.name ?? form.designation ?? '').trim(),
)
const selectedApprovalFlowKey = computed(() => {
  const masterDesignationId = String(form.master_designation_id ?? '').trim()

  if (!masterDesignationId) {
    return ''
  }

  return resolveConfiguredApprovalFlowKeyFromDesignation(
    masterDesignationId,
    availableApprovalFlowKeys.value,
  )
})
const selectedApprovalFlowTitle = computed(() => {
  const flowKey = String(selectedApprovalFlowKey.value ?? '').trim()
  return flowKey ? getApprovalFlowTemplate(flowKey).title : ''
})
const selectedDirectorBuApprovalLabel = computed(() =>
  String(loadedJob.value?.approval_director_bu_label ?? '').trim(),
)
const directorBuApprovalCandidateIds = computed(
  () => new Set(allUserProfiles.value.map((row) => String(row.id ?? '').trim()).filter(Boolean)),
)
const directorBuApprovalSelectOptions = computed<EmployeeRequestFormSelectOption[]>(() => {
  const selectedProfileId = String(form.approval_director_bu_id ?? '').trim()
  const options = allUserProfiles.value.map((row) => ({
    value: row.id,
    label: row.label,
  }))

  if (
    !selectedProfileId ||
    options.some((option) => String(option.value ?? '').trim() === selectedProfileId)
  ) {
    return options
  }

  return [
    {
      value: selectedProfileId,
      label: selectedDirectorBuApprovalLabel.value || selectedProfileId,
    },
    ...options,
  ]
})
const hasApprovalPreviewContent = computed(
  () => approvalPreviewSteps.value.length > 0 || directorBuApprovalSelectOptions.value.length > 0,
)
function isDirectorBuApprovalRow(row: { approval_role_key: string; approval_role_label: string }) {
  if (String(row.approval_role_key ?? '').trim() === 'director_approval') {
    return true
  }

  const normalizedLabel = String(row.approval_role_label ?? '')
    .trim()
    .toLowerCase()
  return (
    normalizedLabel === 'director bu' ||
    normalizedLabel === 'bu director' ||
    normalizedLabel === 'director approval'
  )
}

const approvalPreviewSteps = computed(() => {
  const flowKey = String(selectedApprovalFlowKey.value ?? '').trim()
  if (!flowKey) {
    return []
  }

  const flowTemplate = getApprovalFlowTemplate(flowKey)

  return approvalPreviewRows.value
    .filter(
      (row) =>
        String(row.approval_flow_key ?? '').trim() === flowKey && !isDirectorBuApprovalRow(row),
    )
    .sort((left, right) => left.step_order - right.step_order)
    .map((row, index) => ({
      key: `${flowKey}:${row.step_order || index + 1}`,
      label:
        String(row.approval_role_label ?? '').trim() ||
        flowTemplate.steps.find((step) => step.stepOrder === row.step_order)?.label ||
        `Approval Step ${index + 1}`,
      value:
        String(row.approver_display ?? '').trim() ||
        text('employeeRequestForms.form.messages.approverNotConfigured'),
    }))
})

async function loadDirectManagers() {
  requesterOptionsLoading.value = true
  const { data, error } = await supabase
    .from('profiles')
    .select(`id, full_name, username, main_position`)

  if (error) {
    requesterOptionsLoading.value = false
    return
  }

  const profileIds = (data ?? []).map((employee: any) => employee.id)
  if (profileIds.length === 0) {
    directManagers.value = []
    requesterProfiles.value = []
    requesterOptionsLoading.value = false
    return
  }

  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, roles(name)')
    .in('user_id', profileIds)

  if (roleError) {
    requesterOptionsLoading.value = false
    return
  }

  const blockedDirectManagerRoles = new Set(['candidate', 'super_admin'])
  const blockedRequesterRoles = new Set(['candidate'])
  const roleMap = new Map<string, string>()
  for (const row of roleRows ?? []) {
    const roleName = String((row as { roles?: { name?: string } | null }).roles?.name ?? '')
      .toLowerCase()
      .trim()

    if (roleName) {
      roleMap.set(row.user_id, roleName)
    }
  }

  const mappedProfiles = (data ?? []).map((employee: any) => {
    const fullName = String(employee.full_name ?? employee.username ?? '').trim()
    const position =
      String(employee.main_position ?? '').trim() ||
      text('employeeRequestForms.form.messages.noMainPosition')

    return {
      id: employee.id,
      label: `${fullName || text('employeeRequestForms.form.messages.unnamed')} - ${position}`,
    }
  })

  allUserProfiles.value = mappedProfiles
  directManagers.value = mappedProfiles.filter(
    (employee: any) => !blockedDirectManagerRoles.has(roleMap.get(employee.id) ?? ''),
  )
  requesterProfiles.value = mappedProfiles.filter(
    (employee: any) => !blockedRequesterRoles.has(roleMap.get(employee.id) ?? ''),
  )
  requesterOptionsLoading.value = false
}

async function loadApprovalPreviewRows() {
  approvalPreviewLoading.value = true

  try {
    const { data, error } = await supabase
      .from('approver_master')
      .select(
        'profile_id, approval_flow_key, approval_role_key, step_order, approval_role_label, profile:profiles!approver_master_profile_id_fkey(full_name, username, main_position)',
      )
      .order('approval_flow_key', { ascending: true })
      .order('step_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    approvalPreviewRows.value = (data ?? []).map((row: any) => {
      const profile = row.profile as {
        full_name?: string | null
        username?: string | null
        main_position?: string | null
      } | null
      const fullName = String(profile?.full_name ?? profile?.username ?? '').trim()
      const mainPosition = String(profile?.main_position ?? '').trim()
      const displayName = fullName || text('employeeRequestForms.form.messages.unnamed')

      return {
        profile_id: String(row.profile_id ?? '').trim(),
        approval_flow_key: String(row.approval_flow_key ?? '').trim(),
        approval_role_key: String(row.approval_role_key ?? '').trim(),
        step_order: Number(row.step_order ?? 0),
        approval_role_label: String(row.approval_role_label ?? '').trim(),
        approver_display: mainPosition ? `${displayName} - ${mainPosition}` : displayName,
      }
    })
  } finally {
    approvalPreviewLoading.value = false
  }
}

function findDesignationOptionById(designationId: string | null | undefined) {
  const normalizedId = String(designationId ?? '').trim()
  if (!normalizedId) return null

  return (
    optionsByType.value.designation.find((option) => option.id === normalizedId) ?? null
  )
}

function updateDirectorBuApproval(value: string | number | null) {
  form.approval_director_bu_id = typeof value === 'string' && value.trim() ? value : null
  directorBuApprovalError.value = ''
}

function findDesignationOptionByName(designationName: string | null | undefined) {
  const normalizedName = String(designationName ?? '').trim()
  if (!normalizedName) return null

  return optionsByType.value.designation.find((option) => option.name === normalizedName) ?? null
}

function getDetailFieldValue(field: EmployeeRequestFormFieldConfig): string | number {
  switch (field.key) {
    case 'bu_id':
      return (
        loadedJob.value?.business_unit ??
        businessUnitOptions.value.find((option) => option.id === form.bu_id)?.name ??
        ''
      )
    case 'master_designation_id':
      return form.designation ?? ''
    default:
      if (!field.model) {
        return typeof field.value === 'number' ? field.value : String(field.value ?? '')
      }

      const value = form[field.model]
      return typeof value === 'number' ? value : String(value ?? '')
  }
}

const selectedDesignationOption = computed(
  () =>
    findDesignationOptionById(form.master_designation_id) ??
    findDesignationOptionByName(form.designation),
)
const requiredDateLeadTimeMonths = computed(() =>
  normalizeRequiredDateLeadTimeMonths(selectedDesignationOption.value?.required_date_min_months),
)
const requiredDateMinimumDate = computed(() => {
  if (requiredDateLeadTimeMonths.value <= 0) return ''
  return addMonthsToDateKey(getJakartaTodayDateKey(), requiredDateLeadTimeMonths.value)
})
const requiredDateWarningMessage = computed(() => {
  if (!isRequiredDateBeforeMinimum.value) return ''

  const designationLabel =
    selectedDesignationOption.value?.name ||
    text('employeeRequestForms.form.messages.selectedDesignation')
  const monthLabel = getRequiredDateLeadTimeLabel(requiredDateLeadTimeMonths.value)

  return text('employeeRequestForms.form.messages.requiredDateWarning', {
    designationLabel,
    minimumDate: requiredDateMinimumDate.value,
    monthLabel,
  })
})
const requiredDateLeadTimeHelperText = computed(() => {
  if (!requiredDateMinimumDate.value || requiredDateLeadTimeMonths.value <= 0) return ''
  if (isRequiredDateBeforeMinimum.value) return ''

  const designationLabel =
    selectedDesignationOption.value?.name ||
    text('employeeRequestForms.form.messages.selectedDesignation')
  const monthLabel = getRequiredDateLeadTimeLabel(requiredDateLeadTimeMonths.value)

  return text('employeeRequestForms.form.messages.requiredDateHelper', {
    designationLabel,
    minimumDate: requiredDateMinimumDate.value,
    monthLabel,
  })
})
const isRequiredDateBeforeMinimum = computed(() =>
  Boolean(
    requiredDateMinimumDate.value &&
    form.required_date &&
    form.required_date < requiredDateMinimumDate.value,
  ),
)
const editableFormFields = computed<EmployeeRequestFormFieldConfig[]>(() => [
  {
    key: 'pt_pembebanan',
    model: 'pt_pembebanan',
    section: 'organization',
    label: text('employeeRequestForms.form.fields.costCenterPt'),
    type: 'select',
    options: ptSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchPt'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectPt'),
    colSpan: 2,
    warningText: fieldMismatchWarnings.pt_pembebanan,
  },
  {
    key: 'bu_id',
    model: 'bu_id',
    section: 'organization',
    label: text('common.labels.businessUnit'),
    type: 'select',
    options: businessUnitSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchBusinessUnit'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectBusinessUnit'),
    emptyValue: null,
    warningText: fieldMismatchWarnings.bu_id,
    update: (value) => {
      form.bu_id = typeof value === 'string' ? value : null
    },
  },
  {
    key: 'department',
    model: 'department',
    section: 'organization',
    label: text('common.labels.department'),
    type: 'select',
    options: departmentSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchDepartment'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectDepartment'),
    warningText: fieldMismatchWarnings.department,
  },
  {
    key: 'master_designation_id',
    model: 'master_designation_id',
    section: 'position',
    label: text('common.labels.designation'),
    type: 'select',
    options: designationSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchDesignation'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectDesignation'),
    emptyValue: null,
    warningText: fieldMismatchWarnings.master_designation_id,
    update: (value) => {
      form.master_designation_id = typeof value === 'string' ? value : null
    },
  },
  {
    key: 'main_position',
    model: 'main_position',
    section: 'position',
    label: text('employeeRequestForms.form.fields.mainPositionRequired'),
    type: 'text',
    required: true,
    placeholder: text('employeeRequestForms.form.placeholders.mainPositionExample'),
  },
  {
    key: 'employment_status',
    model: 'employment_status',
    section: 'position',
    label: text('common.labels.employmentStatus'),
    type: 'select',
    options: employmentStatusSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchEmploymentStatus'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectStatus'),
    warningText: fieldMismatchWarnings.employment_status,
  },
  {
    key: 'position_status',
    model: 'position_status',
    section: 'position',
    label: text('common.labels.positionStatus'),
    type: 'select',
    options: positionStatusSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchPositionStatus'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectStatus'),
    warningText: fieldMismatchWarnings.position_status,
  },
  {
    key: 'periode_probation',
    model: 'periode_probation',
    section: 'position',
    label: text('employeeRequestForms.form.fields.probationPeriodMonths'),
    type: 'number',
    min: 0,
    warningText: fieldMismatchWarnings.periode_probation,
  },
  {
    key: 'direct_manager',
    model: 'direct_manager',
    section: 'position',
    label: text('employeeRequestForms.form.fields.directHead'),
    type: 'select',
    options: directManagerSelectOptions.value,
    placeholder: text('employeeRequestForms.form.placeholders.searchManager'),
    emptyLabel: text('employeeRequestForms.form.placeholders.selectManager'),
    warningText: fieldMismatchWarnings.direct_manager,
  },
  {
    key: 'site',
    model: 'site',
    section: 'location',
    label: text('employeeRequestForms.form.fields.site'),
    type: 'text',
    placeholder: text('employeeRequestForms.form.placeholders.siteLocation'),
  },
  {
    key: 'working_location',
    model: 'working_location',
    section: 'location',
    label: text('employeeRequestForms.form.fields.workingLocation'),
    type: 'text',
    placeholder: text('employeeRequestForms.form.placeholders.workingLocation'),
  },
  {
    key: 'requested_date',
    model: 'requested_date',
    section: 'location',
    label: text('employeeRequestForms.form.fields.requestedDate'),
    type: 'date',
    warningText: fieldMismatchWarnings.requested_date,
  },
  {
    key: 'required_date',
    model: 'required_date',
    section: 'location',
    label: text('common.labels.requiredDate'),
    type: 'date',
    helperText: requiredDateLeadTimeHelperText.value,
    warningText: requiredDateWarningMessage.value || fieldMismatchWarnings.required_date,
  },
])

const formFields = computed<EmployeeRequestFormFieldConfig[]>(() => {
  if (!isDetail.value) {
    return editableFormFields.value
  }

  return editableFormFields.value.map((field) =>
    field.type === 'select'
      ? {
          ...field,
          type: 'text',
          model: undefined,
          value: getDetailFieldValue(field),
          placeholder: undefined,
          options: undefined,
          emptyLabel: undefined,
          emptyValue: undefined,
          helperText: undefined,
          errorText: undefined,
          update: undefined,
        }
      : field,
  )
})

function loadData() {
  if (isExistingRecord.value && id.value) {
    const job = loadedJob.value
    if (job) {
      if (
        isDetail.value &&
        !canReadEmployeeRequestForms.value &&
        canReadApprovedEmployeeRequestForms.value &&
        !job.approval_director_hrd_date
      ) {
        appToast.error(text('employeeRequestForms.form.errors.approvedOnly'))
        router.push('/employee-request-forms')
        return
      }

      directorBuApprovalError.value = ''
      Object.assign(form, {
        created_by: job.created_by ?? null,
        pt_pembebanan: job.pt_pembebanan ?? '',
        bu_id: job.bu_id ?? null,
        department: job.department ?? '',
        master_designation_id: job.master_designation_id ?? null,
        designation: job.designation ?? '',
        approval_director_bu_id: job.approval_director_bu_id ?? null,
        main_position: job.main_position,
        employment_status: job.employment_status ?? '',
        position_status: job.position_status ?? '',
        direct_manager: job.direct_manager ?? '',
        site: job.site ?? '',
        working_location: job.working_location ?? '',
        requested_date:
          job.requested_date ||
          formatDateKeyInJakarta(job.created_at ?? '') ||
          getJakartaTodayDateKey(),
        custom_grup_1_id: job.custom_grup_1_id ?? null,
        custom_grup_2_id: job.custom_grup_2_id ?? null,
        custom_grup_3_id: job.custom_grup_3_id ?? null,
        custom_grup_4_id: job.custom_grup_4_id ?? null,
        custom_grup_5_id: job.custom_grup_5_id ?? null,
        custom_grup_6_id: job.custom_grup_6_id ?? null,
        required_date: job.required_date ?? '',
        periode_probation: job.periode_probation ?? 0,
        organizational_structure: normalizeAttachmentPaths(job.organizational_structure),
        job_description: normalizeAttachmentPaths(job.job_description),
        document_erf: normalizeAttachmentPaths(job.document_erf),
      })
      clearSelectedAttachment('organizational_structure')
      clearSelectedAttachment('job_description')
      clearSelectedAttachment('document_erf')
      void syncAttachmentPreviewLinks()
    } else if (hasResolvedExistingRecord.value && !pageLoading.value) {
      appToast.error(text('employeeRequestForms.form.errors.dataNotFound'))
      router.back()
    }
  } else {
    Object.assign(form, {
      ...createEmployeeRequestFormState(),
      created_by: String(user.value?.id ?? '').trim() || null,
      requested_date: getJakartaTodayDateKey(),
    })
    directorBuApprovalError.value = ''
    clearSelectedAttachment('organizational_structure')
    clearSelectedAttachment('job_description')
    clearSelectedAttachment('document_erf')
    attachmentPreviewLinks.organizational_structure = []
    attachmentPreviewLinks.job_description = []
    attachmentPreviewLinks.document_erf = []
    approvalMode.value = 'manual'
    clearErfDocumentParseState()
  }
}

watch([() => loadedJob.value, () => hasResolvedExistingRecord.value], loadData, { immediate: true })

// Once the user manually changes a field that was flagged as mismatched by
// the document parser, the warning no longer applies to the new value.
watch(
  () => form.pt_pembebanan,
  (value) => clearMismatchWarningIfChanged('pt_pembebanan', value),
)
watch(
  () => form.bu_id,
  (value) => clearMismatchWarningIfChanged('bu_id', value),
)
watch(
  () => form.department,
  (value) => clearMismatchWarningIfChanged('department', value),
)
watch(
  () => form.master_designation_id,
  (value) => clearMismatchWarningIfChanged('master_designation_id', value),
)
watch(
  () => form.employment_status,
  (value) => clearMismatchWarningIfChanged('employment_status', value),
)
watch(
  () => form.position_status,
  (value) => clearMismatchWarningIfChanged('position_status', value),
)
watch(
  () => form.direct_manager,
  (value) => clearMismatchWarningIfChanged('direct_manager', value),
)
watch(
  () => form.periode_probation,
  (value) => clearMismatchWarningIfChanged('periode_probation', value),
)
watch(
  () => form.requested_date,
  (value) => clearMismatchWarningIfChanged('requested_date', value),
)
watch(
  () => form.required_date,
  (value) => clearMismatchWarningIfChanged('required_date', value),
)

watch(
  [
    () => form.master_designation_id,
    () => optionsByType.value.designation,
  ],
  () => {
    if (isDetail.value) {
      return
    }

    const selectedByMasterDesignation = findDesignationOptionById(form.master_designation_id)
    if (selectedByMasterDesignation) {
      form.designation = selectedByMasterDesignation.name
      return
    }

    if (form.designation) {
      const matchedDesignation = findDesignationOptionByName(form.designation)
      if (matchedDesignation) {
        form.master_designation_id = optionsByType.value.designation.find(
          (o) => o.id === matchedDesignation.id,
        )
          ? matchedDesignation.id
          : form.master_designation_id
        form.designation = matchedDesignation.name
        return
      }
    }

    if (form.master_designation_id) {
      form.designation = ''
    }
  },
  { immediate: true },
)

watch(
  [directorBuApprovalSelectOptions, approvalPreviewLoading],
  ([options, isLoading]) => {
    if (isLoading) {
      return
    }

    const selectedProfileId = String(form.approval_director_bu_id ?? '').trim()
    if (!selectedProfileId) {
      directorBuApprovalError.value = ''
      return
    }

    const isStillValid = directorBuApprovalCandidateIds.value.has(selectedProfileId)
    if (!isStillValid) {
      form.approval_director_bu_id = null
      directorBuApprovalError.value = ''
    }
  },
  { immediate: true },
)

async function loadExistingRecord() {
  if (!isExistingRecord.value || !id.value) {
    hasResolvedExistingRecord.value = true
    loadedJob.value = null
    return
  }

  recordLoading.value = true
  hasResolvedExistingRecord.value = false
  try {
    loadedJob.value = await getById(id.value, { includeSupplementaryData: false })
  } finally {
    recordLoading.value = false
    hasResolvedExistingRecord.value = true
  }
}

watch(
  id,
  () => {
    void loadExistingRecord()
  },
  { immediate: true },
)

onMounted(() => {
  if (!isDetail.value) {
    loadDirectManagers()
    loadApprovalPreviewRows().catch(() => {
      appToast.error(text('employeeRequestForms.form.errors.approvalPreviewLoadFailed'))
    })
    loadMasterDataOptions().catch(() => {
      appToast.error(text('employeeRequestForms.form.errors.masterDataLoadFailed'))
    })
  }
})

function goToEdit() {
  if (!id.value) return
  router.push(`/employee-request-forms/${id.value}/edit`)
}

async function handleSubmit() {
  if (isDetail.value) return

  if (!String(form.created_by ?? '').trim()) {
    appToast.error(text('employeeRequestForms.form.errors.requesterRequired'))
    return
  }

  const selectedDirectorBuId = String(form.approval_director_bu_id ?? '').trim()
  if (selectedDirectorBuId && !directorBuApprovalCandidateIds.value.has(selectedDirectorBuId)) {
    directorBuApprovalError.value = text('employeeRequestForms.form.errors.invalidBuDirector')
    appToast.error(directorBuApprovalError.value)
    return
  }

  try {
    const attachments = await uploadErfAttachmentsIfNeeded({ refreshPreview: false })
    const payload = {
      ...form,
      requested_date: String(form.requested_date ?? '').trim() || getJakartaTodayDateKey(),
      auto_approval: approvalMode.value === 'auto',
      ...attachments,
    }

    if (isEdit.value && id.value) {
      await update(id.value, payload, { refresh: false })
      appToast.updated('ERF')
    } else {
      await create(payload, { refresh: false })
      appToast.created('ERF')
    }
    router.push('/employee-request-forms')
  } catch (err) {
    const message =
      err instanceof Error ? err.message : text('employeeRequestForms.form.errors.saveFailed')
    appToast.error(message)
  }
}
</script>

<style scoped>
.language-switcher {
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface);
  box-shadow: var(--app-shadow-sm);
}

.language-switcher__button {
  border-radius: var(--app-radius-sm);
  font-size: var(--app-font-size-xs);
  font-weight: 600;
  letter-spacing: var(--app-letterspacing-label);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.language-switcher__button--active {
  background: var(--app-color-accent);
  color: var(--app-color-text-inverse);
  box-shadow: var(--app-shadow-sm);
}

.language-switcher__button--inactive {
  color: var(--app-color-text-muted);
}

.language-switcher__button--inactive:hover {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.language-switcher__button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

:global(.field) {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--app-color-border-strong);
  background: var(--app-color-surface-muted);
  padding: 0.75rem 1rem;
  color: var(--app-color-text);
  outline: none;
  transition: all 0.2s;
}

:global(.field:focus) {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface);
  box-shadow: 0 0 0 2px var(--app-color-accent-ring);
}
</style>
