<template>
  <div v-if="showPayrollSection" class="app-divider h-px"></div>

  <section v-if="showPayrollSection" class="space-y-4">
    <div class="space-y-1">
      <h3 class="app-section-title-compact text-xl">{{ text('candidateForms.form.sections.payrollStatutoryData') }}</h3>
      <p class="app-copy-body">Data payroll dan statutory karyawan</p>
      <p class="app-helper-text italic">Employee payroll and statutory data</p>
    </div>

    <CandidateFormObjectFields
      :item="form.employee_payroll_profile"
      :fields="payrollPrimaryFields"
      :is-read-only="true"
    />

    <CandidateFormObjectFields
      v-if="showBpjsHealthDeclineReason"
      :item="form.employee_payroll_profile"
      :fields="bpjsHealthDeclineReasonFields"
      :is-read-only="true"
      grid-class="grid gap-4 md:grid-cols-2"
    />

    <CandidateFormObjectFields
      v-if="showBpjsHealthDeclineReasonOther"
      :item="form.employee_payroll_profile"
      :fields="bpjsHealthDeclineReasonOtherFields"
      :is-read-only="true"
      grid-class="grid gap-4 md:grid-cols-2"
    />
  </section>

  <div v-if="showPayrollSection" class="app-divider h-px"></div>

  <CandidateFormDocumentSection
    :title="documentSectionTitle || text('candidateForms.form.sections.employeeDocuments')"
    :description="documentSectionDescription"
    :text="text"
    :entries="employeeDocumentEntries"
    :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
    :on-open-file="onOpenEmployeeDocumentFile"
    :opening-document-keys="openingDocumentKeys"
    :get-document-open-key="getDocumentOpenKey"
    :opening-document-label="openingDocumentLabel"
    :on-select-files="onSelectEmployeeDocumentFiles"
    :on-remove-selected-file="onRemoveSelectedEmployeeDocumentFile"
    :on-remove-uploaded-file="onRemoveUploadedEmployeeDocumentFile"
    :removing-document-keys="removingDocumentKeys"
    :on-upload-files="onUploadEmployeeDocumentFiles"
    :upload-helper-text="text('candidateForms.form.employeeDocuments.uploadHelper')"
    :is-busy="isUploadingContractDocuments"
    :show-per-entry-upload-action="showPerEntryUploadAction"
    :show-submit-entries-action="showSubmitAllDocumentsAction"
    :on-submit-entries="onSubmitAllDocuments"
    :submit-entries-label="submitAllDocumentsLabel"
    :submit-entries-busy-label="submitAllDocumentsBusyLabel"
    :is-submit-entries-disabled="isSubmitAllDocumentsDisabled"
  />
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import CandidateFormDocumentSection from '@/features/candidateForms/components/CandidateFormDocumentSection.vue'
import CandidateFormObjectFields from '@/features/candidateForms/components/CandidateFormObjectFields.vue'
import type {
  CandidateFormEmployeeDocumentEntry,
  CandidateFormObjectFieldConfig,
  CandidateFormSelectOption,
} from '@/features/candidateForms/types/CandidateFormPage.type'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import type { EmployeeDocumentFieldKey } from '@/domain/entities/CandidateForm'

const props = defineProps({
  form: {
    type: Object as PropType<CandidateFormRequest>,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string) => string>,
    required: true,
  },
  bpjsHealthEnrollmentPreferenceSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  bpjsHealthDeclineReasonSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  bpjsEmploymentStatusSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  employeeDocumentEntries: {
    type: Array as PropType<CandidateFormEmployeeDocumentEntry[]>,
    default: () => [],
  },
  getReadableEmployeeDocumentFileName: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => string>,
    required: true,
  },
  onOpenEmployeeDocumentFile: {
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
    default: '',
  },
  onSelectEmployeeDocumentFiles: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, event: Event) => void>,
    default: undefined,
  },
  onRemoveSelectedEmployeeDocumentFile: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, index: number) => void>,
    default: undefined,
  },
  onRemoveUploadedEmployeeDocumentFile: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey, path: string) => void>,
    default: undefined,
  },
  removingDocumentKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  onUploadEmployeeDocumentFiles: {
    type: Function as PropType<(documentType: EmployeeDocumentFieldKey) => void>,
    default: undefined,
  },
  isUploadingContractDocuments: {
    type: Boolean,
    default: false,
  },
  showPayrollSection: {
    type: Boolean,
    default: true,
  },
  documentSectionTitle: {
    type: String,
    default: '',
  },
  documentSectionDescription: {
    type: String,
    default: '',
  },
  showPerEntryUploadAction: {
    type: Boolean,
    default: true,
  },
  showSubmitAllDocumentsAction: {
    type: Boolean,
    default: false,
  },
  onSubmitAllDocuments: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  submitAllDocumentsLabel: {
    type: String,
    default: '',
  },
  submitAllDocumentsBusyLabel: {
    type: String,
    default: '',
  },
  isSubmitAllDocumentsDisabled: {
    type: Boolean,
    default: false,
  },
})

const payrollPrimaryFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'bank_name',
    model: 'bank_name',
    label: props.text('candidateForms.form.labels.registeredBankName'),
    disabled: true,
  },
  {
    key: 'bank_account_number',
    model: 'bank_account_number',
    label: props.text('candidateForms.form.labels.bankAccountNumber'),
    disabled: true,
  },
  {
    key: 'account_holder_name',
    model: 'account_holder_name',
    label: props.text('candidateForms.form.labels.accountHolderName'),
    disabled: true,
  },
  {
    key: 'branch_name',
    model: 'branch_name',
    label: props.text('candidateForms.form.labels.branchName'),
    disabled: true,
  },
  {
    key: 'tax_identification_number',
    model: 'tax_identification_number',
    label: props.text('candidateForms.form.labels.taxIdentificationNumber'),
    disabled: true,
  },
  {
    key: 'bpjs_health_enrollment_preference',
    model: 'bpjs_health_enrollment_preference',
    label: props.text('candidateForms.form.labels.bpjsHealthPreference'),
    type: 'select',
    options: props.bpjsHealthEnrollmentPreferenceSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchBpjsHealthPreference'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectBpjsHealthPreference'),
    disabled: true,
  },
  {
    key: 'bpjs_employment_status',
    model: 'bpjs_employment_status',
    label: props.text('candidateForms.form.labels.bpjsEmploymentStatus'),
    type: 'select',
    options: props.bpjsEmploymentStatusSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchBpjsEmploymentStatus'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectStatus'),
    disabled: true,
  },
])

const bpjsHealthDeclineReasonFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'bpjs_health_decline_reason',
    model: 'bpjs_health_decline_reason',
    label: props.text('candidateForms.form.labels.bpjsHealthDeclineReason'),
    type: 'select',
    options: props.bpjsHealthDeclineReasonSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchBpjsHealthDeclineReason'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectBpjsHealthDeclineReason'),
    disabled: true,
  },
])

const bpjsHealthDeclineReasonOtherFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'bpjs_health_decline_reason_other',
    model: 'bpjs_health_decline_reason_other',
    label: props.text('candidateForms.form.labels.otherBpjsHealthReason'),
    disabled: true,
  },
])

const showBpjsHealthDeclineReason = computed(
  () => props.form.employee_payroll_profile.bpjs_health_enrollment_preference === 'decline_enrollment',
)

const showBpjsHealthDeclineReasonOther = computed(
  () => props.form.employee_payroll_profile.bpjs_health_decline_reason === 'other',
)
</script>
