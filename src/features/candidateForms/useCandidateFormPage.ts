import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from '#imports'

import {
  bpjsEmploymentStatusOptions,
  bpjsHealthDeclineReasonOptions,
  bpjsHealthEnrollmentPreferenceOptions,
  bloodTypeOptions,
  candidateEmployeeDocumentFieldKeys,
  employeeDocumentFieldKeys,
  employeeDocumentFieldLabels,
  employeeVisibleDocumentFieldKeys,
  familyCategoryOptions,
  genderOptions,
  languageProficiencyOptions,
  maritalStatusOptions,
  residenceOwnershipOptions,
  transportationOwnershipOptions,
  type CandidateForm,
  type EmployeeDocumentFieldKey,
} from '@/domain/entities/CandidateForm'
import type {
  CandidateFormRequest,
  CandidateLanguageRequest,
  CandidateReferenceRequest,
  CandidateSkillRequest,
  EducationHistoryRequest,
  FamilyEmergencyRequest,
  PersonalStatementRequest,
  WorkHistoryRequest,
} from '@/domain/requests/CandidateFormRequest'
import {
  createCandidateFormStateFromLevels as createEmptyForm,
  createEducationItemState as createEducationItem,
  createEmployeePayrollProfileState as createEmployeePayrollProfile,
  createFamilyItemState as createFamilyItem,
  createLanguageItemState as createLanguageItem,
  createPersonalStatementState as createPersonalStatement,
  createReferenceItemState as createReferenceItem,
  createSkillItemState as createSkillItem,
  createWorkHistoryItemState as createWorkHistoryItem,
  ensureMinimumItemsState as ensureMinimumItems,
} from '@/features/candidateForms/CandidateFormPage.state'
import { candidateStatusBadge, candidateStatusLabel } from '@/features/candidateForms/candidateFormStatus'
import { resolveCandidateFormRole } from '@/features/candidateForms/candidateFormRole'
import type {
  CandidateFormEmployeeDocumentEntry,
  CandidateFormFormalEducationRow,
  CandidateFormGroupedFamilySection,
  CandidateFormIndexedEducationRow,
  EditableFormSectionKey,
} from '@/features/candidateForms/types/CandidateFormPage.type'
import { useLocale } from '@/composables/useLocale'
import { getPublicAppConfig } from '@/infrastructure/runtime/publicConfig'
import { callBackendApi } from '@/infrastructure/http/backendApi'
import { supabase } from '@/infrastructure/supabase/client'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import { useAppConfirm } from '@/presentation/components/feedback/useAppConfirm'
import { exportCandidateFormExcel } from '@/presentation/utils/candidateFormExcelExport'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useCandidateFormViewModel } from '@/viewmodels/useCandidateFormViewModel'
import { useEmployeeRequestFormViewModel } from '@/viewmodels/useEmployeeRequestFormViewModel'

type FamilySectionConfig = {
  key: string
  category: FamilyEmergencyRequest['category']
  label: string
  shortLabel: string
}

type SelectOption<T = string | number | null> = {
  value: T
  label: string
}

const formalEducationLevels = [
  { level: 'SD / Sederajat', label: 'SD' },
  { level: 'SMP / MTs / Sederajat', label: 'SMP' },
  { level: 'SMA / SMK / MA / Sederajat', label: 'SMA' },
  { level: 'Diploma III (D3)', label: 'D-3' },
  { level: 'Sarjana (S1)', label: 'S-1' },
  { level: 'Magister (S2)', label: 'S-2' },
  { level: 'Doktor (S3)', label: 'S-3' },
] as const

const familySectionDefinitions = [
  {
    key: 'spouse',
    category: 'Spouse',
    labelKey: 'candidateForms.form.family.spouse.label',
    shortLabelKey: 'candidateForms.form.family.spouse.shortLabel',
  },
  {
    key: 'child',
    category: 'Child',
    labelKey: 'candidateForms.form.family.child.label',
    shortLabelKey: 'candidateForms.form.family.child.shortLabel',
  },
  {
    key: 'parent',
    category: 'Parent',
    labelKey: 'candidateForms.form.family.parent.label',
    shortLabelKey: 'candidateForms.form.family.parent.shortLabel',
  },
  {
    key: 'sibling',
    category: 'Sibling',
    labelKey: 'candidateForms.form.family.sibling.label',
    shortLabelKey: 'candidateForms.form.family.sibling.shortLabel',
  },
  {
    key: 'emergency-contact',
    category: 'Emergency Contact',
    labelKey: 'candidateForms.form.family.emergency.label',
    shortLabelKey: 'candidateForms.form.family.emergency.shortLabel',
  },
  {
    key: 'other',
    category: 'Other',
    labelKey: 'candidateForms.form.family.other.label',
    shortLabelKey: 'candidateForms.form.family.other.shortLabel',
  },
] as const

const requiredContractDocumentTypes: EmployeeDocumentFieldKey[] = ['format_office']
const editableContractDocumentTypes: EmployeeDocumentFieldKey[] = ['format_office', 'skb', 'other']
const employeeDetailDocumentTypes: EmployeeDocumentFieldKey[] = employeeVisibleDocumentFieldKeys
  .filter((documentType) => !editableContractDocumentTypes.includes(documentType))
type CandidateFormDetailTab = 'employee' | 'contract_documents' | 'candidate_history'

function toSelectOptions<T>(
  options: readonly T[],
  getLabel: (option: T) => string = (option) => String(option),
): SelectOption<T>[] {
  return options.map((option) => ({
    value: option,
    label: getLabel(option),
  }))
}

function normalizeRouteId(value: string | null | undefined) {
  return String(value ?? '').trim()
}

function candidateRecordMatchesRoute(candidate: CandidateForm | null | undefined, routeId: string | null | undefined) {
  const normalizedRouteId = normalizeRouteId(routeId)
  if (!candidate || !normalizedRouteId) return false

  return [
    candidate.id,
    candidate.candidate_service_form_id,
    candidate.candidate_service_application_id,
    candidate.candidate_service_candidate_id,
  ].some((value) => normalizeRouteId(value) === normalizedRouteId)
}

function resolveCandidateFormDocumentId(
  primaryCandidate: CandidateForm | null | undefined,
  fallbackCandidate: CandidateForm | null | undefined,
  routeId: string | null | undefined,
) {
  return normalizeRouteId(
    primaryCandidate?.candidate_service_form_id ??
    primaryCandidate?.id ??
    fallbackCandidate?.candidate_service_form_id ??
    fallbackCandidate?.id ??
    routeId,
  )
}

export function useCandidateFormPage() {
  const route = useRoute()
  const router = useRouter()
  const { text } = useLocale()
  const {
    candidates,
    loading: candidateLoading,
    error: candidateError,
    saving: candidateSaving,
    create,
    getById,
    update,
    refresh: refreshCandidates,
    updateStatus,
  } = useCandidateFormViewModel()
  const {
    jobs,
    error: employeeRequestFormError,
    refresh: refreshJobs,
  } = useEmployeeRequestFormViewModel()
  const { user, userRole, hasAnyPermission } = useAuthViewModel()
  const appToast = useAppToast()
  const appConfirm = useAppConfirm()
  const { candidatePhotographBucket, employeeDocumentBucket } = getPublicAppConfig()
  const maxPhotographSizeInBytes = 5 * 1024 * 1024
  const maxEmployeeDocumentSizeInBytes = 10 * 1024 * 1024

  const id = computed(() => route.params.id as string | undefined)
  const isDetail = computed(() => route.name === 'candidate-forms-detail')
  const isEdit = computed(() => route.name === 'candidate-forms-edit')
  const isExistingCandidateRoute = computed(() => isDetail.value || isEdit.value)
  const isCandidateRole = computed(() => String(userRole.value ?? '').toLowerCase() === 'candidate')
  const canUpdateCandidateForm = computed(() =>
    hasAnyPermission(['candidate_form:update', 'employee_form:update']),
  )
  const canUpdateContractDocuments = computed(() =>
    hasAnyPermission(['employee_form:update_contract_documents']),
  )
  const canCompleteCandidateForm = computed(
    () => isCandidateRole.value && canUpdateCandidateForm.value,
  )
  const detailCandidateRecord = ref<CandidateForm | null>(null)
  const detailCandidateLoading = ref(false)
  const hasAttemptedDetailFetch = ref(false)
  const existingCandidateForm = computed(() =>
    isCandidateRole.value ? (candidates.value[0] ?? null) : null,
  )
  const currentCandidateRecord = computed(() => {
    if (id.value) {
      return candidateRecordMatchesRoute(detailCandidateRecord.value, id.value)
        ? detailCandidateRecord.value
        : candidates.value.find((item) => candidateRecordMatchesRoute(item, id.value)) ?? null
    }

    return existingCandidateForm.value
  })
  const form = reactive(createEmptyForm(formalEducationLevels))
  const activeDetailTab = ref<CandidateFormDetailTab>('employee')
  const isEmployeeCandidateForm = computed(
    () =>
      resolveCandidateFormRole(currentCandidateRecord.value) === 'employee'
      || form.role === 'employee',
  )
  const isCandidateServiceMirror = computed(
    () =>
      currentCandidateRecord.value?.candidate_source === 'candidate_service'
      || Boolean(currentCandidateRecord.value?.candidate_service_form_id),
  )
  const isReadOnlyMode = computed(() => isDetail.value || isCandidateServiceMirror.value)
  const canShowEmployeeHistoryTab = computed(
    () => isDetail.value && isEmployeeCandidateForm.value,
  )
  const showingCandidateHistory = computed(
    () => canShowEmployeeHistoryTab.value && activeDetailTab.value === 'candidate_history',
  )
  const showingContractDocuments = computed(
    () => canShowEmployeeHistoryTab.value && activeDetailTab.value === 'contract_documents',
  )
  const showingEmployeeData = computed(
    () => !canShowEmployeeHistoryTab.value || activeDetailTab.value === 'employee',
  )
  const canShowCompleteButton = computed(
    () =>
      isExistingCandidateRoute.value &&
      canCompleteCandidateForm.value &&
      !isCandidateServiceMirror.value &&
      currentCandidateRecord.value?.completion_status !== 'completed',
  )
  const currentEmployeeRequestForm = computed(() =>
    jobs.value.find((job) => job.id === (currentCandidateRecord.value?.employee_request_form_id ?? form.employee_request_form_id)) ?? null,
  )
  const isEmployeeContractFormStageActive = computed(
    () => normalizeRouteId(currentEmployeeRequestForm.value?.recruitment_flow_stage) === 'employee_contract_form_in_progress',
  )
  const canManageContractDocuments = computed(() =>
    isDetail.value &&
    showingContractDocuments.value &&
    isEmployeeCandidateForm.value &&
    isCandidateServiceMirror.value &&
    canUpdateContractDocuments.value &&
    isEmployeeContractFormStageActive.value,
  )
  function resolveRoleText(candidateKey: string, employeeKey: string) {
    return text(isEmployeeCandidateForm.value ? employeeKey : candidateKey)
  }

  const formEyebrow = computed(() =>
    resolveRoleText(
      'candidateForms.form.eyebrow.candidate',
      'candidateForms.form.eyebrow.employee',
    ),
  )
  const formTitle = computed(() => {
    if (isDetail.value) {
      return resolveRoleText(
        'candidateForms.form.title.detail.candidate',
        'candidateForms.form.title.detail.employee',
      )
    }

    if (isEdit.value) {
      return resolveRoleText(
        'candidateForms.form.title.edit.candidate',
        'candidateForms.form.title.edit.employee',
      )
    }

    return resolveRoleText(
      'candidateForms.form.title.new.candidate',
      'candidateForms.form.title.new.employee',
    )
  })
  const actionNoteTitle = computed(() => {
    if (isReadOnlyMode.value || !isCandidateRole.value) {
      return ''
    }

    if (isEdit.value) {
      return resolveRoleText(
        'candidateForms.form.actions.updateAndComplete',
        'candidateForms.form.actions.updateEmployeeForm',
      )
    }

    return resolveRoleText(
      'candidateForms.form.actions.saveCandidateForm',
      'candidateForms.form.actions.saveEmployeeForm',
    )
  })
  const actionNoteDescription = computed(() => {
    if (isReadOnlyMode.value || !isCandidateRole.value) {
      return ''
    }

    if (isEdit.value && canShowCompleteButton.value) {
      return resolveRoleText(
        'candidateForms.form.notes.editCandidateWithComplete',
        'candidateForms.form.notes.editEmployeeWithComplete',
      )
    }

    if (isEdit.value) {
      return resolveRoleText(
        'candidateForms.form.notes.editCandidate',
        'candidateForms.form.notes.editEmployee',
      )
    }

    return resolveRoleText(
      'candidateForms.form.notes.createCandidate',
      'candidateForms.form.notes.createEmployee',
    )
  })
  const boundEmployeeRequestFormId = computed(() =>
    String(existingCandidateForm.value?.employee_request_form_id ?? '').trim(),
  )
  const isBoundEmployeeRequestForm = computed(
    () => isCandidateRole.value && !isEdit.value && Boolean(boundEmployeeRequestFormId.value),
  )
  const isPositionAppliedForReadOnly = computed(
    () => isReadOnlyMode.value || isCandidateRole.value || isBoundEmployeeRequestForm.value,
  )

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index)
  const positionAppliedSelectOptions = computed(() =>
    jobs.value.map((job) => ({
      value: job.id,
      label: `${job.main_position || '-'} - ${job.designation || '-'}`,
    })),
  )
  const genderSelectOptions = toSelectOptions(genderOptions)
  const maritalStatusSelectOptions = toSelectOptions(maritalStatusOptions)
  const bloodTypeSelectOptions = toSelectOptions(bloodTypeOptions)
  const familyCategorySelectOptions = toSelectOptions(familyCategoryOptions)
  const languageProficiencySelectOptions = toSelectOptions(languageProficiencyOptions)
  const transportationOwnershipSelectOptions = toSelectOptions(transportationOwnershipOptions)
  const residenceOwnershipSelectOptions = toSelectOptions(residenceOwnershipOptions)
  const yearSelectOptions = toSelectOptions(yearOptions, (year) => String(year))
  const bpjsHealthEnrollmentPreferenceSelectOptions = toSelectOptions(
    bpjsHealthEnrollmentPreferenceOptions,
    (option) =>
      option === 'willing_to_enroll'
        ? text('candidateForms.form.options.bpjsHealthPreference.willingToEnroll')
        : text('candidateForms.form.options.bpjsHealthPreference.declineEnrollment'),
  )
  const bpjsHealthDeclineReasonSelectOptions = toSelectOptions(
    bpjsHealthDeclineReasonOptions,
    (option) =>
      option === 'pbi'
        ? 'PBI'
        : option === 'self_registered'
          ? text('candidateForms.form.options.bpjsHealthDeclineReason.selfRegistered')
          : option === 'local_government'
            ? text('candidateForms.form.options.bpjsHealthDeclineReason.localGovernment')
            : 'Other',
  )
  const bpjsEmploymentStatusSelectOptions = toSelectOptions(
    bpjsEmploymentStatusOptions,
    (option) =>
      option === 'cash_out_first'
        ? text('candidateForms.form.options.bpjsEmploymentStatus.cashOutFirst')
        : option === 'enroll_new'
          ? text('candidateForms.form.options.bpjsEmploymentStatus.enrollAsNew')
          : text('candidateForms.form.options.bpjsEmploymentStatus.continueExisting'),
  )

  const familySectionConfigs = computed<FamilySectionConfig[]>(() =>
    familySectionDefinitions.map((section) => ({
      key: section.key,
      category: section.category,
      label: text(section.labelKey),
      shortLabel: text(section.shortLabelKey),
    })),
  )

  const groupedFamilySections = computed<CandidateFormGroupedFamilySection[]>(() =>
    familySectionConfigs.value.map((section) => ({
      ...section,
      items: form.family_and_emergency
        .map((item, formIndex) => ({ item, formIndex }))
        .filter(
          (entry) => String(entry.item.category ?? '').trim() === section.category,
        ),
    })),
  )

  function getEmployeeDocumentLabel(documentType: EmployeeDocumentFieldKey) {
    switch (documentType) {
      case 'cv':
        return 'CV'
      case 'integrity_pact':
        return text('candidateForms.form.employeeDocuments.labels.integrityPact')
      case 'email_usage_policy':
        return text('candidateForms.form.employeeDocuments.labels.emailUsagePolicy')
      case 'identity_card':
        return text('candidateForms.form.employeeDocuments.labels.identityCard')
      case 'family_card':
        return text('candidateForms.form.employeeDocuments.labels.familyCard')
      case 'latest_diploma':
        return text('candidateForms.form.employeeDocuments.labels.latestDiploma')
      case 'academic_transcript':
        return text('candidateForms.form.employeeDocuments.labels.academicTranscript')
      case 'certificate_of_employment':
        return text('candidateForms.form.employeeDocuments.labels.certificateOfEmployment')
      case 'tax_id':
        return text('candidateForms.form.employeeDocuments.labels.taxIdentificationNumber')
      case 'bpjs_health_card':
        return text('candidateForms.form.employeeDocuments.labels.bpjsHealthCard')
      case 'bpjs_health_statement':
        return text('candidateForms.form.employeeDocuments.labels.bpjsHealthStatement')
      case 'bpjs_employment_card':
        return text('candidateForms.form.employeeDocuments.labels.bpjsEmploymentCard')
      case 'bank_account_book':
        return text('candidateForms.form.employeeDocuments.labels.bankAccountBook')
      case 'format_office':
        return text('candidateForms.form.employeeDocuments.labels.formatOffice')
      case 'skb':
        return text('candidateForms.form.employeeDocuments.labels.skb')
      case 'other':
        return text('candidateForms.form.employeeDocuments.labels.other')
      default:
        return employeeDocumentFieldLabels[documentType] ?? 'Document'
    }
  }

  const candidateDocumentEntries = computed<CandidateFormEmployeeDocumentEntry[]>(() =>
    candidateEmployeeDocumentFieldKeys.map((documentType) => ({
      documentType,
      label: getEmployeeDocumentLabel(documentType),
      files: form.employee_documents?.[documentType] ?? [],
    })),
  )
  const employeeDocumentEntries = computed<CandidateFormEmployeeDocumentEntry[]>(() =>
    employeeDetailDocumentTypes
      .filter((documentType) =>
        documentType !== 'bpjs_health_statement' || resolveEmployeeDocumentFiles(documentType).length > 0,
      )
      .map((documentType) => ({
        documentType,
        label: getEmployeeDocumentLabel(documentType),
        files: resolveEmployeeDocumentFiles(documentType),
        editable: false,
        selectedFiles: selectedEmployeeDocumentFiles[documentType] ?? [],
      })),
  )
  const employeeContractDocumentEntries = computed<CandidateFormEmployeeDocumentEntry[]>(() =>
    editableContractDocumentTypes.map((documentType) => ({
      documentType,
      label: getEmployeeDocumentLabel(documentType),
      files: resolveEmployeeDocumentFiles(documentType),
      editable: canManageContractDocuments.value,
      selectedFiles: selectedEmployeeDocumentFiles[documentType] ?? [],
    })),
  )
  const hasSelectedContractDocumentFiles = computed(
    () => editableContractDocumentTypes.some((documentType) => selectedEmployeeDocumentFiles[documentType].length > 0),
  )
  const hasAllRequiredContractDocumentFiles = computed(
    () => requiredContractDocumentTypes.every((documentType) => {
      const existingFiles = resolveEmployeeDocumentFiles(documentType)
      const selectedFiles = selectedEmployeeDocumentFiles[documentType] ?? []
      return existingFiles.length > 0 || selectedFiles.length > 0
    }),
  )
  const canSubmitContractDocuments = computed(
    () =>
      canManageContractDocuments.value &&
      (hasSelectedContractDocumentFiles.value || hasAllRequiredContractDocumentFiles.value),
  )

  function resolveEmployeeDocumentFiles(documentType: EmployeeDocumentFieldKey) {
    return form.employee_documents?.[documentType] ?? []
  }

  function getReadableEmployeeDocumentFileName(documentType: EmployeeDocumentFieldKey, path: string) {
    const rawName = String(path ?? '').split('/').pop() || String(path ?? '')
    const extensionMatch = rawName.match(/(\.[a-z0-9]+)$/i)
    const extension = extensionMatch?.[1] ?? ''
    const baseName = extension ? rawName.slice(0, -extension.length) : rawName
    const normalizedType = String(documentType ?? '').trim().toLowerCase()
    const contextLabel = getEmployeeDocumentLabel(documentType)

    let readableBaseName = baseName
      .replace(new RegExp(`^${normalizedType}[-_ ]*`, 'i'), '')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '')
      .replace(/\bcandidate[-_ ]?form\b/gi, '')
      .replace(/\bemployee[-_ ]?forms?\b/gi, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (/^[a-z0-9]{5,14}$/i.test(readableBaseName)) {
      readableBaseName = ''
    }

    if (readableBaseName.length > 42) {
      readableBaseName = readableBaseName.slice(0, 42).trim()
    }

    const finalBaseName = readableBaseName || contextLabel
    return `${finalBaseName}${extension}`
  }

  function getEmployeeDocumentOpenKey(documentType: EmployeeDocumentFieldKey, path: string) {
    return `${documentType}:${String(path ?? '').trim()}`
  }

  function dedupeFiles(files: File[]) {
    const seen = new Set<string>()

    return files.filter((file) => {
      const key = [file.name, file.size, file.lastModified, file.type].join(':')
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  const allowedEmployeeDocumentMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  const allowedEmployeeDocumentExtensions = ['.pdf', '.doc', '.docx']

  function isAllowedEmployeeDocumentFile(file: File) {
    const normalizedType = String(file.type ?? '').trim().toLowerCase()
    const normalizedName = String(file.name ?? '').trim().toLowerCase()
    return (
      allowedEmployeeDocumentMimeTypes.has(normalizedType) ||
      allowedEmployeeDocumentExtensions.some((extension) => normalizedName.endsWith(extension))
    )
  }

  function resolveEmployeeDocumentStorageSource(documentType: EmployeeDocumentFieldKey) {
    if (editableContractDocumentTypes.includes(documentType)) {
      return 'dashboard'
    }

    return isCandidateServiceMirror.value ? 'candidate_service' : 'dashboard'
  }

  async function createEmployeeDocumentSignedUrl(
    documentType: EmployeeDocumentFieldKey,
    path: string,
  ) {
    const normalizedPath = String(path ?? '').trim()
    if (!normalizedPath) {
      throw new Error('Document path is missing.')
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath
    }

    const candidateFormDocumentId = resolveCandidateFormDocumentId(
      currentCandidateRecord.value,
      detailCandidateRecord.value,
      id.value,
    )

    const payload = await callBackendApi<{ signed_url?: string }>(
      '/api/candidate-forms/documents/sign-url',
      {
        method: 'POST',
        body: JSON.stringify({
          bucket: employeeDocumentBucket,
          candidate_form_id: candidateFormDocumentId,
          path: normalizedPath,
          storage_source: resolveEmployeeDocumentStorageSource(documentType),
        }),
      },
    )

    if (!payload.signed_url) {
      throw new Error('Unable to open document.')
    }

    return payload.signed_url
  }

  async function handleOpenEmployeeDocumentFile(
    documentType: EmployeeDocumentFieldKey,
    path: string,
  ) {
    const documentOpenKey = getEmployeeDocumentOpenKey(documentType, path)
    if (openingEmployeeDocumentKeys.value.includes(documentOpenKey)) {
      return
    }

    openingEmployeeDocumentKeys.value = [...openingEmployeeDocumentKeys.value, documentOpenKey]

    try {
      const url = await createEmployeeDocumentSignedUrl(documentType, path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open document.'
      appToast.error(message)
    } finally {
      openingEmployeeDocumentKeys.value = openingEmployeeDocumentKeys.value
        .filter((pendingKey) => pendingKey !== documentOpenKey)
    }
  }

  async function removeUploadedEmployeeDocumentFile(
    documentType: EmployeeDocumentFieldKey,
    path: string,
  ) {
    if (!canManageContractDocuments.value || !editableContractDocumentTypes.includes(documentType)) {
      return
    }

    const candidateFormId = String(currentCandidateRecord.value?.id ?? '').trim()
    if (!candidateFormId) {
      appToast.error(text('candidateForms.form.employeeDocuments.errors.candidateFormUnavailable'))
      return
    }

    const confirmed = await appConfirm.confirm({
      title: text('candidateForms.form.confirm.removeDocumentTitle'),
      message: text('candidateForms.form.confirm.removeDocumentMessage'),
      confirmLabel: text('common.actions.delete'),
      cancelLabel: text('common.actions.cancel'),
      tone: 'danger',
    })
    if (!confirmed) {
      return
    }

    const documentKey = getEmployeeDocumentOpenKey(documentType, path)
    removingEmployeeDocumentKeys.value = [...removingEmployeeDocumentKeys.value, documentKey]

    try {
      const payload = await callBackendApi<{ candidate_form?: CandidateForm | null }>(
        `/api/candidate-forms/${encodeURIComponent(candidateFormId)}/employee-documents`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            document_type: documentType,
            file_path: path,
          }),
        },
      )

      if (payload.candidate_form) {
        detailCandidateRecord.value = payload.candidate_form
        populateForm(payload.candidate_form)
      } else {
        await fetchCandidateDetail()
        if (detailCandidateRecord.value) {
          populateForm(detailCandidateRecord.value)
        }
      }

      appToast.success(text('candidateForms.form.employeeDocuments.success.removed'))
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : text('candidateForms.form.employeeDocuments.errors.removeFailed')
      appToast.error(message)
    } finally {
      removingEmployeeDocumentKeys.value = removingEmployeeDocumentKeys.value
        .filter((pendingKey) => pendingKey !== documentKey)
    }
  }

  function handleEmployeeDocumentChange(documentType: EmployeeDocumentFieldKey, event: Event) {
    if (!canManageContractDocuments.value || !editableContractDocumentTypes.includes(documentType)) {
      return
    }

    const input = event.target as HTMLInputElement | null
    const nextFiles = Array.from(input?.files ?? [])

    if (!nextFiles.length) {
      return
    }

    const oversizedFile = nextFiles.find((file) => file.size > maxEmployeeDocumentSizeInBytes)
    if (oversizedFile) {
      selectedEmployeeDocumentFiles[documentType] = []
      if (input) {
        input.value = ''
      }
      appToast.error(text('candidateForms.form.employeeDocuments.errors.fileTooLarge'))
      return
    }

    if (nextFiles.some((file) => !isAllowedEmployeeDocumentFile(file))) {
      selectedEmployeeDocumentFiles[documentType] = []
      if (input) {
        input.value = ''
      }
      appToast.error(text('candidateForms.form.employeeDocuments.errors.pdfOnly'))
      return
    }

    selectedEmployeeDocumentFiles[documentType] = dedupeFiles([
      ...selectedEmployeeDocumentFiles[documentType],
      ...nextFiles,
    ])

    if (input) {
      input.value = ''
    }
  }

  function removeSelectedEmployeeDocumentFile(documentType: EmployeeDocumentFieldKey, index: number) {
    selectedEmployeeDocumentFiles[documentType] = selectedEmployeeDocumentFiles[documentType]
      .filter((_, fileIndex) => fileIndex !== index)
  }

  const formalEducationRows = computed<CandidateFormFormalEducationRow[]>(() =>
    formalEducationLevels.map((config) => ({
      ...config,
      item:
        form.education.find(
          (item) => item.category === 'Formal Education' && item.level === config.level,
        ) ?? createEducationItem({ category: 'Formal Education', level: config.level }),
    })),
  )

  const nonFormalEducationRows = computed<CandidateFormIndexedEducationRow[]>(() =>
    form.education
      .map((item, formIndex) => ({ item, formIndex }))
      .filter((entry) => entry.item.category !== 'Formal Education'),
  )

  const selectedPhotographFile = ref<File | null>(null)
  const selectedEmployeeDocumentFiles = reactive(
    employeeDocumentFieldKeys.reduce((files, documentType) => {
      files[documentType] = []
      return files
    }, {} as Record<EmployeeDocumentFieldKey, File[]>),
  )
  const uploadingPhotograph = ref(false)
  const uploadingEmployeeDocuments = ref(false)
  const openingEmployeeDocumentKeys = ref<string[]>([])
  const removingEmployeeDocumentKeys = ref<string[]>([])
  const excelActionLoading = ref(false)
  const photographPreviewUrl = ref('')
  const isUploadingAnyFile = computed(() => uploadingPhotograph.value || uploadingEmployeeDocuments.value)

  function normalizeWithDefaults<T extends object, TSource extends object>(
    source: TSource | null | undefined,
    defaults: T,
  ): T {
    const normalized = { ...defaults } as T
    const sourceRecord = source as Record<string, unknown> | null | undefined
    const normalizedRecord = normalized as Record<string, unknown>

    for (const key of Object.keys(defaults) as Array<keyof T>) {
      normalizedRecord[String(key)] = sourceRecord?.[String(key)] ?? (defaults[key] as unknown)
    }

    return normalized
  }

  function mapRequestItem<T extends { id?: string }, TSource extends { id?: string }>(
    source: TSource | null | undefined,
    createDefault: () => T,
  ): T {
    const normalized = normalizeWithDefaults(source, createDefault())

    if (source?.id !== undefined) {
      normalized.id = source.id
    }

    return normalized
  }

  function mapWithMinimumItems<TSource, TOutput>(
    items: TSource[],
    mapper: (item: TSource) => TOutput,
    minimumCount: number,
    createFallback: () => TOutput,
  ) {
    return ensureMinimumItems(items.map(mapper), minimumCount, createFallback)
  }

  const sectionFactories: Record<EditableFormSectionKey, () => unknown> = {
    family_and_emergency: createFamilyItem,
    education: createEducationItem,
    work_history: createWorkHistoryItem,
    candidate_languages: createLanguageItem,
    candidate_skills: createSkillItem,
    candidate_references: createReferenceItem,
  }

  function getSectionItems(section: EditableFormSectionKey) {
    return form[section] as unknown[]
  }

  function buildLegacyFullName(...parts: Array<string | null | undefined>) {
    return parts.map((part) => String(part ?? '').trim()).filter(Boolean).join(' ')
  }

  function buildNameParts(fullName: string) {
    const parts = String(fullName ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (parts.length === 0) {
      return {
        first_name: '',
        middle_name: '',
        last_name: '',
      }
    }

    if (parts.length === 1) {
      return {
        first_name: parts[0],
        middle_name: '',
        last_name: '',
      }
    }

    return {
      first_name: parts[0],
      middle_name: parts.slice(1, -1).join(' '),
      last_name: parts[parts.length - 1] ?? '',
    }
  }

  function getProfileValue(key: string) {
    const personalData = user.value?.personal_data
    if (!personalData || typeof personalData !== 'object') {
      return ''
    }

    const value = (personalData as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : ''
  }

  function applyCandidateProfileBinding() {
    if (isExistingCandidateRoute.value || !isCandidateRole.value) {
      return
    }

    if (!form.employee_request_form_id && boundEmployeeRequestFormId.value) {
      form.employee_request_form_id = boundEmployeeRequestFormId.value
    }

    if (!form.personal_email) {
      form.personal_email = getProfileValue('personal_email') || user.value?.email || ''
    }

    if (!form.phone_number) {
      form.phone_number =
        getProfileValue('phone_number') || getProfileValue('home_phone') || user.value?.phone || ''
    }

    if (!form.full_name) {
      form.full_name =
        getProfileValue('full_name') ||
        buildLegacyFullName(
          getProfileValue('first_name'),
          getProfileValue('middle_name'),
          getProfileValue('last_name'),
        ) ||
        user.value?.full_name ||
        ''
    }

    if (!form.photograph) {
      form.photograph = getProfileValue('photograph')
    }

    const keys: Array<keyof CandidateFormRequest> = [
      'hire_location',
      'date_of_birth',
      'place_of_birth',
      'nationality',
      'religion',
      'ethnic',
      'id_card_address',
      'residential_address',
      'instagram',
      'linkedin',
      'id_type',
      'id_no',
      'available_start_date',
      'join_date',
      'transportation_type',
      'transportation_ownership',
      'residence_ownership',
    ]

    for (const key of keys) {
      if (!form[key]) {
        form[key] = getProfileValue(String(key)) as never
      }
    }

    if (!form.gender) {
      form.gender = getProfileValue('gender') as CandidateFormRequest['gender']
    }

    if (!form.marital_status) {
      form.marital_status = getProfileValue('marital_status') as CandidateFormRequest['marital_status']
    }

    if (!form.blood_type) {
      form.blood_type = getProfileValue('blood_type') as CandidateFormRequest['blood_type']
    }
  }

  function mapFamilyItem(item: CandidateForm['family_and_emergency'][number]): FamilyEmergencyRequest {
    return mapRequestItem(item, createFamilyItem)
  }

  function mapEducationItem(item: CandidateForm['education'][number]): EducationHistoryRequest {
    return mapRequestItem(item, createEducationItem)
  }

  function buildEducationFormItems(items: CandidateForm['education']): EducationHistoryRequest[] {
    const mappedItems = items.map(mapEducationItem)
    const formalRows = formalEducationLevels.map((config) => {
      const existing = mappedItems.find(
        (item) => item.category === 'Formal Education' && item.level === config.level,
      )

      return (
        existing ??
        createEducationItem({
          category: 'Formal Education',
          level: config.level,
        })
      )
    })
    const nonFormalRows = mappedItems.filter((item) => item.category !== 'Formal Education')

    return [
      ...formalRows,
      ...(nonFormalRows.length > 0
        ? nonFormalRows
        : [createEducationItem({ category: 'Training / Non-Formal' })]),
    ]
  }

  function mapWorkHistoryItem(item: CandidateForm['work_history'][number]): WorkHistoryRequest {
    return mapRequestItem(item, createWorkHistoryItem)
  }

  function mapLanguageItem(item: CandidateForm['candidate_languages'][number]): CandidateLanguageRequest {
    return mapRequestItem(item, createLanguageItem)
  }

  function mapSkillItem(item: CandidateForm['candidate_skills'][number]): CandidateSkillRequest {
    return mapRequestItem(item, createSkillItem)
  }

  function mapReferenceItem(item: CandidateForm['candidate_references'][number]): CandidateReferenceRequest {
    return mapRequestItem(item, createReferenceItem)
  }

  function mapPersonalStatement(
    personalStatement: CandidateForm['personal_statement'],
  ): PersonalStatementRequest {
    if (!personalStatement) {
      return createPersonalStatement()
    }

    return normalizeWithDefaults(personalStatement, createPersonalStatement())
  }

  function mapEmployeePayrollProfile(
    employeePayrollProfile: CandidateForm['employee_payroll_profile'],
  ) {
    return normalizeWithDefaults(employeePayrollProfile, createEmployeePayrollProfile())
  }

  function mapListOrDefault<TSource, TOutput>(
    items: TSource[],
    mapper: (item: TSource) => TOutput,
    createFallback: () => TOutput,
  ) {
    return items.length > 0 ? items.map(mapper) : [createFallback()]
  }

  function populateForm(candidateForm: CandidateForm) {
    Object.assign(form, {
      role: resolveCandidateFormRole(candidateForm),
      employee_request_form_id: candidateForm.employee_request_form_id ?? '',
      candidate_id: candidateForm.candidate_id ?? null,
      photograph: candidateForm.photograph ?? '',
      date_application: candidateForm.date_application ?? '',
      notice_period: candidateForm.notice_period ?? '',
      full_name:
        candidateForm.full_name ??
        buildLegacyFullName(candidateForm.first_name, candidateForm.middle_name, candidateForm.last_name),
      hire_location: candidateForm.hire_location ?? '',
      date_of_birth: candidateForm.date_of_birth ?? '',
      place_of_birth: candidateForm.place_of_birth ?? '',
      nationality: candidateForm.nationality ?? '',
      marital_status: candidateForm.marital_status ?? '',
      religion: candidateForm.religion ?? '',
      gender: candidateForm.gender ?? '',
      ethnic: candidateForm.ethnic ?? '',
      blood_type: candidateForm.blood_type ?? '',
      id_card_address: candidateForm.id_card_address ?? '',
      residential_address: candidateForm.residential_address ?? '',
      personal_email: candidateForm.personal_email ?? '',
      instagram: candidateForm.instagram ?? '',
      linkedin: candidateForm.linkedin ?? '',
      phone_number: candidateForm.phone_number ?? candidateForm.home_phone ?? '',
      id_type: candidateForm.id_type ?? '',
      id_no: candidateForm.id_no ?? '',
      available_start_date: candidateForm.available_start_date ?? '',
      join_date: candidateForm.join_date ?? '',
      transportation_type: candidateForm.transportation_type ?? '',
      transportation_ownership: candidateForm.transportation_ownership ?? '',
      residence_ownership: candidateForm.residence_ownership ?? '',
      family_and_emergency: mapListOrDefault(
        candidateForm.family_and_emergency,
        mapFamilyItem,
        createFamilyItem,
      ),
      education: buildEducationFormItems(candidateForm.education),
      work_history: mapListOrDefault(
        candidateForm.work_history,
        mapWorkHistoryItem,
        createWorkHistoryItem,
      ),
      candidate_languages: mapWithMinimumItems(
        candidateForm.candidate_languages,
        mapLanguageItem,
        3,
        createLanguageItem,
      ),
      candidate_skills: mapWithMinimumItems(
        candidateForm.candidate_skills,
        mapSkillItem,
        3,
        createSkillItem,
      ),
      candidate_references: mapListOrDefault(
        candidateForm.candidate_references,
        mapReferenceItem,
        createReferenceItem,
      ),
      employee_payroll_profile: mapEmployeePayrollProfile(candidateForm.employee_payroll_profile),
      employee_documents: {
        ...(form.employee_documents ?? {}),
        ...(candidateForm.employee_documents ?? {}),
      },
      personal_statement: mapPersonalStatement(candidateForm.personal_statement),
    })
  }

  function loadData() {
    if (!isExistingCandidateRoute.value) {
      applyCandidateProfileBinding()
      return
    }

    if (currentCandidateRecord.value) {
      populateForm(currentCandidateRecord.value)
    } else if (
      id.value
      && !candidateLoading.value
      && !detailCandidateLoading.value
      && hasAttemptedDetailFetch.value
    ) {
      appToast.error('Candidate form not found.')
      router.back()
    }
  }

  function setActiveDetailTab(tab: CandidateFormDetailTab) {
    if (!canShowEmployeeHistoryTab.value) {
      activeDetailTab.value = 'employee'
      return
    }
    activeDetailTab.value = tab
  }

  async function fetchCandidateDetail() {
    if (!isExistingCandidateRoute.value || !id.value) {
      detailCandidateRecord.value = null
      hasAttemptedDetailFetch.value = false
      return
    }

    detailCandidateLoading.value = true
    hasAttemptedDetailFetch.value = true

    try {
      detailCandidateRecord.value = await getById(id.value)
    } finally {
      detailCandidateLoading.value = false
    }
  }

  function addSectionItem(section: EditableFormSectionKey) {
    getSectionItems(section).push(sectionFactories[section]())
  }

  function removeSectionItem(section: EditableFormSectionKey, index: number) {
    const items = getSectionItems(section)

    if (items.length === 1) {
      items.splice(0, 1, sectionFactories[section]())
      return
    }

    items.splice(index, 1)
  }

  function addFamilyItemForCategory(category: FamilyEmergencyRequest['category']) {
    form.family_and_emergency.push({
      ...createFamilyItem(),
      category,
    })
  }

  function removeFamilyItem(index: number) {
    removeSectionItem('family_and_emergency', index)
  }

  function addEducationItem() {
    form.education.push(
      createEducationItem({
        category: 'Training / Non-Formal',
      }),
    )
  }

  function removeEducationItem(index: number) {
    removeSectionItem('education', index)
  }

  function addWorkHistoryItem() {
    addSectionItem('work_history')
  }

  function removeWorkHistoryItem(index: number) {
    removeSectionItem('work_history', index)
  }

  function addLanguageItem() {
    addSectionItem('candidate_languages')
  }

  function addSkillItem() {
    addSectionItem('candidate_skills')
  }

  function removeSkillItem(index: number) {
    removeSectionItem('candidate_skills', index)
  }

  function addReferenceItem() {
    addSectionItem('candidate_references')
  }

  function removeReferenceItem(index: number) {
    removeSectionItem('candidate_references', index)
  }

  async function handleComplete() {
    if (!canCompleteCandidateForm.value) {
      appToast.error(text('candidateForms.form.errors.onlyCandidatesCanComplete'))
      return
    }

    if (isCandidateServiceMirror.value) {
      appToast.error(text('candidateForms.form.errors.candidatePortalReadOnly'))
      return
    }

    if (!id.value) {
      appToast.error(text('candidateForms.form.errors.saveBeforeComplete'))
      return
    }

    const confirmed = await appConfirm.confirm({
      title: text('common.actions.confirm'),
      message: text('candidateForms.form.confirm.markComplete'),
      confirmLabel: text('common.actions.confirm'),
      cancelLabel: text('common.actions.cancel'),
    })
    if (!confirmed) return

    try {
      if (!isDetail.value) {
        const photograph = await uploadPhotographIfNeeded()
        await update(id.value, buildPayload(photograph))
      }

      await updateStatus(id.value, 'completed')
      appToast.success(text('candidateForms.form.success.markedComplete'))
      await router.push(`/candidate-forms/${id.value}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : text('candidateForms.form.errors.completeFailed')
      appToast.error(message)
    }
  }

  function sanitizeNestedNumberField(
    target: object,
    key: string,
  ) {
    const targetRecord = target as Record<string, string | number | boolean | null | undefined>
    const value = targetRecord[key]

    if (value === '' || value === null || value === undefined) {
      targetRecord[key] = null
      return
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
      targetRecord[key] = null
      return
    }

    targetRecord[key] = Math.max(0, value)
  }

  function buildPayload(photograph = form.photograph): CandidateFormRequest {
    const nameParts = buildNameParts(form.full_name)

    return {
      ...form,
      role: form.role ?? 'candidate',
      photograph,
      ...nameParts,
      gender: form.gender as CandidateFormRequest['gender'],
      marital_status: form.marital_status as CandidateFormRequest['marital_status'],
      blood_type: form.blood_type as CandidateFormRequest['blood_type'],
      education: form.education.map((item) => ({
        ...item,
        level: item.level as EducationHistoryRequest['level'],
        category: item.category as EducationHistoryRequest['category'],
      })),
      family_and_emergency: form.family_and_emergency.map((item) => ({
        ...item,
        gender: item.gender as FamilyEmergencyRequest['gender'],
        category: item.category as FamilyEmergencyRequest['category'],
      })),
      candidate_languages: form.candidate_languages.map((item) => ({
        ...item,
        speaking: item.speaking as CandidateLanguageRequest['speaking'],
        reading: item.reading as CandidateLanguageRequest['reading'],
        listening: item.listening as CandidateLanguageRequest['listening'],
        writing: item.writing as CandidateLanguageRequest['writing'],
      })),
      employee_payroll_profile: {
        ...form.employee_payroll_profile,
      },
      employee_documents: {
        ...form.employee_documents,
      },
    }
  }

  function handlePhotographChange(event: Event) {
    const input = event.target as HTMLInputElement | null
    const nextFile = input?.files?.[0] ?? null

    if (!nextFile) {
      selectedPhotographFile.value = null
      void syncPhotographPreview()
      return
    }

    if (nextFile.size > maxPhotographSizeInBytes) {
      selectedPhotographFile.value = null
      if (input) {
        input.value = ''
      }
      appToast.error('Photograph must be 5 MB or smaller.')
      void syncPhotographPreview()
      return
    }

    selectedPhotographFile.value = nextFile
    photographPreviewUrl.value = URL.createObjectURL(nextFile)
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

  function buildCandidateNameSegment() {
    const fullName =
      String(currentCandidateRecord.value?.full_name ?? form.full_name ?? '').trim() || 'employee'
    return sanitizeStorageSegment(fullName) || 'employee'
  }

  function buildEmployeeDocumentFileName(documentType: EmployeeDocumentFieldKey, fileName: string) {
    const extension = String(fileName.split('.').pop() ?? 'pdf').toLowerCase()
    const documentTypeSegment =
      sanitizeStorageSegment(String(documentType).replace(/_/g, '-')) || 'document'
    const candidateNameSegment = buildCandidateNameSegment()
    const uploadKeySuffix = createUploadKeySuffix()
    return `${documentTypeSegment}-${candidateNameSegment}-${uploadKeySuffix}.${extension}`
  }

  async function uploadPhotographIfNeeded() {
    if (!selectedPhotographFile.value) {
      return form.photograph
    }

    uploadingPhotograph.value = true

    try {
      const file = selectedPhotographFile.value
      const fileExtension = String(file.name.split('.').pop() ?? 'jpg').toLowerCase()
      const uploadKeySuffix = createUploadKeySuffix()
      const ownerId =
        sanitizeStorageSegment(String(form.candidate_id ?? user.value?.id ?? 'candidate')) ||
        'candidate'
      const fileName =
        sanitizeStorageSegment(
          `${ownerId}-${uploadKeySuffix}-${file.name.replace(/\.[^/.]+$/, '')}`,
        ) || `${ownerId}-${uploadKeySuffix}`
      const filePath = `candidate-forms/${ownerId}/${fileName}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from(candidatePhotographBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      selectedPhotographFile.value = null
      form.photograph = filePath
      await syncPhotographPreview()

      return filePath
    } finally {
      uploadingPhotograph.value = false
    }
  }

  async function submitContractDocuments() {
    if (!canManageContractDocuments.value) {
      appToast.error(
        isEmployeeCandidateForm.value && !isEmployeeContractFormStageActive.value
          ? text('candidateForms.form.employeeDocuments.errors.contractStageNotReady')
          : text('candidateForms.form.employeeDocuments.errors.permissionDenied'),
      )
      return
    }

    if (!hasSelectedContractDocumentFiles.value && !hasAllRequiredContractDocumentFiles.value) {
      appToast.error(text('candidateForms.form.employeeDocuments.errors.noFilesSelected'))
      return
    }

    const candidateFormId = String(currentCandidateRecord.value?.id ?? '').trim()
    if (!candidateFormId) {
      appToast.error(text('candidateForms.form.employeeDocuments.errors.candidateFormUnavailable'))
      return
    }

    const ownerId =
      sanitizeStorageSegment(
        String(
          currentCandidateRecord.value?.candidate_service_candidate_id ??
          currentCandidateRecord.value?.candidate_id ??
          currentCandidateRecord.value?.id ??
          'employee',
        ),
      ) || 'employee'

    uploadingEmployeeDocuments.value = true

    try {
      const documentsPayload: Partial<Record<EmployeeDocumentFieldKey, string[]>> = {}

      await Promise.all(editableContractDocumentTypes.map(async (documentType) => {
        const files = selectedEmployeeDocumentFiles[documentType] ?? []
        if (!files.length) {
          return
        }

        const uploadedPaths = await Promise.all(files.map(async (file) => {
          const filePath = `employee-forms/${ownerId}/${documentType}/${buildEmployeeDocumentFileName(documentType, file.name)}`

          const { error: uploadError } = await supabase.storage
            .from(employeeDocumentBucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type || undefined,
            })

          if (uploadError) {
            throw new Error(uploadError.message)
          }

          return filePath
        }))

        documentsPayload[documentType] = uploadedPaths
      }))

      const payload = await callBackendApi<{ candidate_form?: CandidateForm | null }>(
        `/api/candidate-forms/${encodeURIComponent(candidateFormId)}/employee-documents`,
        {
          method: 'POST',
          body: JSON.stringify({
            documents: documentsPayload,
          }),
        },
      )

      if (payload.candidate_form) {
        detailCandidateRecord.value = payload.candidate_form
        populateForm(payload.candidate_form)
      } else {
        await fetchCandidateDetail()
        if (detailCandidateRecord.value) {
          populateForm(detailCandidateRecord.value)
        }
      }

      for (const documentType of editableContractDocumentTypes) {
        selectedEmployeeDocumentFiles[documentType] = []
      }

      appToast.success(text('candidateForms.form.employeeDocuments.success.submitted'))
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : text('candidateForms.form.employeeDocuments.errors.uploadFailed')
      appToast.error(message)
    } finally {
      uploadingEmployeeDocuments.value = false
    }
  }

  async function syncPhotographPreview() {
    if (selectedPhotographFile.value) {
      return
    }

    const photographPath = String(form.photograph ?? '').trim()
    if (!photographPath) {
      photographPreviewUrl.value = ''
      return
    }

    if (/^https?:\/\//i.test(photographPath)) {
      photographPreviewUrl.value = photographPath
      return
    }

    try {
      if (isCandidateServiceMirror.value) {
        const payload = await callBackendApi<{ signed_url?: string }>(
          '/api/candidate-forms/photograph/sign-url',
          {
            method: 'POST',
            body: JSON.stringify({
              bucket: candidatePhotographBucket,
              candidate_form_id: currentCandidateRecord.value?.id ?? '',
              path: photographPath,
              storage_source: 'candidate_service',
            }),
          },
        )
        photographPreviewUrl.value = payload.signed_url ?? ''
        return
      }

      const { data, error } = await supabase.storage
        .from(candidatePhotographBucket)
        .createSignedUrl(photographPath, 60 * 60)

      if (error) {
        photographPreviewUrl.value = ''
        return
      }

      photographPreviewUrl.value = data.signedUrl
    } catch {
      photographPreviewUrl.value = ''
    }
  }

  async function handleSubmit() {
    try {
      if (isReadOnlyMode.value) {
        if (isCandidateServiceMirror.value) {
          appToast.error(text('candidateForms.form.errors.candidatePortalReadOnly'))
        }
        return
      }

      if (!form.employee_request_form_id) {
        throw new Error(text('candidateForms.form.errors.positionAppliedRequired'))
      }

      const photograph = await uploadPhotographIfNeeded()

      if (isEdit.value && id.value) {
        await update(id.value, buildPayload(photograph))
        appToast.updated(isEmployeeCandidateForm.value ? 'Employee' : 'Candidate')
      } else {
        await create(buildPayload(photograph))
        appToast.created(isEmployeeCandidateForm.value ? 'Employee' : 'Candidate')
      }
      router.push('/candidate-forms')
    } catch (err) {
      const message = err instanceof Error ? err.message : text('candidateForms.updateFailed')
      appToast.error(message)
    }
  }

  watch(
    () => [
      candidates.value,
      id.value,
      isExistingCandidateRoute.value,
      detailCandidateRecord.value,
      detailCandidateLoading.value,
      hasAttemptedDetailFetch.value,
    ],
    loadData,
    {
      immediate: true,
    },
  )
  watch(
    () => [id.value, isExistingCandidateRoute.value],
    () => {
      void fetchCandidateDetail()
    },
    { immediate: true },
  )
  watch(
    () => [id.value, isDetail.value, isEmployeeCandidateForm.value],
    () => {
      activeDetailTab.value = 'employee'
    },
    { immediate: true },
  )
  watch(
    () => [
      existingCandidateForm.value?.employee_request_form_id,
      user.value?.personal_data,
      user.value?.email,
      user.value?.phone,
      user.value?.full_name,
    ],
    () => {
      applyCandidateProfileBinding()
    },
    { immediate: true },
  )
  watch(
    () => form.photograph,
    () => {
      void syncPhotographPreview()
    },
    { immediate: true },
  )
  watch(
    () => [
      isExistingCandidateRoute.value,
      isCandidateRole.value,
      candidateLoading.value,
      existingCandidateForm.value?.id,
    ],
    async () => {
      if (
        isExistingCandidateRoute.value ||
        !isCandidateRole.value ||
        candidateLoading.value ||
        !existingCandidateForm.value
      ) {
        return
      }

      await router.replace(`/candidate-forms/${existingCandidateForm.value.id}/edit`)
    },
    { immediate: true },
  )

  onMounted(() => {
    if (jobs.value.length === 0) refreshJobs()
    if (candidates.value.length === 0) refreshCandidates()
  })

  const canExportExcel = computed(() =>
    hasAnyPermission(['candidate_form:export_excel', 'employee_form:export_excel']),
  )

  async function handleExportExcel() {
    if (!canExportExcel.value) {
      appToast.error(text('candidateForms.list.toasts.exportPermissionDenied'))
      return
    }

    const candidate = currentCandidateRecord.value
    if (!candidate) {
      appToast.error(text('candidateForms.list.errors.exportExcelFailed'))
      return
    }

    excelActionLoading.value = true
    try {
      await exportCandidateFormExcel(candidate)
      appToast.success(text('candidateForms.list.toasts.exportedExcel'))
    } catch (err) {
      const message = err instanceof Error ? err.message : text('candidateForms.list.errors.exportExcelFailed')
      appToast.error(message)
    } finally {
      excelActionLoading.value = false
    }
  }

  return {
    actionNoteDescription,
    actionNoteTitle,
    addEducationItem,
    addFamilyItemForCategory,
    addLanguageItem,
    addReferenceItem,
    addSkillItem,
    addWorkHistoryItem,
    bpjsEmploymentStatusSelectOptions,
    bpjsHealthDeclineReasonSelectOptions,
    bpjsHealthEnrollmentPreferenceSelectOptions,
    canShowCompleteButton,
    candidateError,
    candidateLoading,
    candidateSaving,
    candidateStatusBadge,
    candidateStatusLabel: (status: string | null | undefined) => candidateStatusLabel(text, status),
    candidateDocumentEntries,
    employeeContractDocumentEntries,
    currentCandidateRecord,
    employeeDocumentEntries,
    employeeRequestFormError,
    familyCategorySelectOptions,
    form,
    formEyebrow,
    formTitle,
    formalEducationRows,
    genderSelectOptions,
    getReadableEmployeeDocumentFileName,
    getEmployeeDocumentOpenKey,
    groupedFamilySections,
    handleComplete,
    handleEmployeeDocumentChange,
    handleOpenEmployeeDocumentFile,
    handlePhotographChange,
    handleSubmit,
    canSubmitContractDocuments,
    submitContractDocuments,
    canShowEmployeeHistoryTab,
    canManageContractDocuments,
    isEdit,
    isEmployeeCandidateForm,
    isPositionAppliedForReadOnly,
    isReadOnlyMode,
    isUploadingAnyFile,
    uploadingEmployeeDocuments,
    languageProficiencySelectOptions,
    maritalStatusSelectOptions,
    nonFormalEducationRows,
    openingEmployeeDocumentKeys,
    photographPreviewUrl,
    positionAppliedSelectOptions,
    removeEducationItem,
    removeFamilyItem,
    removeReferenceItem,
    removeSkillItem,
    removeWorkHistoryItem,
    residenceOwnershipSelectOptions,
    router,
    removeSelectedEmployeeDocumentFile,
    removeUploadedEmployeeDocumentFile,
    removingEmployeeDocumentKeys,
    sanitizeNestedNumberField,
    selectedPhotographFile,
    setActiveDetailTab,
    showingCandidateHistory,
    showingContractDocuments,
    showingEmployeeData,
    text,
    transportationOwnershipSelectOptions,
    yearSelectOptions,
    bloodTypeSelectOptions,
    canExportExcel,
    handleExportExcel,
    excelActionLoading,
  }
}
