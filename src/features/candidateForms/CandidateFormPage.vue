<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:gap-8 sm:px-0">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <AppActionButton
        :label="text('candidateForms.form.actions.back')"
        variant="icon"
        @click="router.back()"
      >
        ←
      </AppActionButton>
      <div class="min-w-0">
        <p class="app-page-eyebrow text-xs sm:text-sm">
          {{ formEyebrow }}
        </p>
        <h1 class="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {{ formTitle }}
        </h1>
        <div v-if="currentCandidateRecord" class="mt-2">
          <span :class="candidateStatusBadge(currentCandidateRecord.completion_status)">
            {{ candidateStatusLabel(currentCandidateRecord.completion_status) }}
          </span>
        </div>
      </div>
    </div>

    <section
      v-if="canShowEmployeeHistoryTab"
      class="app-section-panel p-2"
    >
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <AppActionButton
          :label="text('candidateForms.form.tabs.legalAndFinancial')"
          :variant="showingEmployeeData ? 'primary' : 'secondary'"
          @click="setActiveDetailTab('employee')"
        />
        <AppActionButton
          :label="text('candidateForms.form.tabs.contractDocuments')"
          :variant="showingContractDocuments ? 'primary' : 'secondary'"
          @click="setActiveDetailTab('contract_documents')"
        />
        <AppActionButton
          :label="text('candidateForms.form.tabs.candidateData')"
          :variant="showingCandidateHistory ? 'primary' : 'secondary'"
          @click="setActiveDetailTab('candidate_history')"
        />
      </div>
    </section>

    <AppAlert :message="candidateError || employeeRequestFormError" />

  <AppLoadingOverlay
    v-if="showingContractDocuments && uploadingEmployeeDocuments"
    :message="text('common.loading')"
  />

    <section class="app-section-panel p-4 sm:p-6">
      <div v-if="!candidateLoading" class="space-y-8">
          <CandidateFormCandidateSections
            v-if="!isEmployeeCandidateForm || showingCandidateHistory"
            :form="form"
            :text="text"
            :photograph-preview-url="photographPreviewUrl"
            :position-applied-select-options="positionAppliedSelectOptions"
            :gender-select-options="genderSelectOptions"
            :marital-status-select-options="maritalStatusSelectOptions"
            :blood-type-select-options="bloodTypeSelectOptions"
            :family-category-select-options="familyCategorySelectOptions"
            :language-proficiency-select-options="languageProficiencySelectOptions"
            :transportation-ownership-select-options="transportationOwnershipSelectOptions"
            :residence-ownership-select-options="residenceOwnershipSelectOptions"
            :year-select-options="yearSelectOptions"
            :grouped-family-sections="groupedFamilySections"
            :formal-education-rows="formalEducationRows"
            :non-formal-education-rows="nonFormalEducationRows"
            :employee-document-entries="candidateDocumentEntries"
            :sanitize-nested-number-field="sanitizeNestedNumberField"
            :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
            :on-open-employee-document-file="handleOpenEmployeeDocumentFile"
            :opening-document-keys="openingEmployeeDocumentKeys"
            :get-document-open-key="getEmployeeDocumentOpenKey"
            :opening-document-label="text('candidateForms.form.sections.preparingDocument')"
          />

          <CandidateFormEmployeeSections
            v-else-if="showingEmployeeData"
            :form="form"
            :text="text"
            :bpjs-health-enrollment-preference-select-options="bpjsHealthEnrollmentPreferenceSelectOptions"
            :bpjs-health-decline-reason-select-options="bpjsHealthDeclineReasonSelectOptions"
            :bpjs-employment-status-select-options="bpjsEmploymentStatusSelectOptions"
            :employee-document-entries="employeeDocumentEntries"
            :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
            :on-open-employee-document-file="handleOpenEmployeeDocumentFile"
            :opening-document-keys="openingEmployeeDocumentKeys"
            :get-document-open-key="getEmployeeDocumentOpenKey"
            :opening-document-label="text('candidateForms.form.sections.preparingDocument')"
            :on-select-employee-document-files="handleEmployeeDocumentChange"
            :on-remove-selected-employee-document-file="removeSelectedEmployeeDocumentFile"
            :is-uploading-contract-documents="uploadingEmployeeDocuments"
          />

          <CandidateFormEmployeeSections
            v-else-if="showingContractDocuments"
            :form="form"
            :text="text"
            :employee-document-entries="employeeContractDocumentEntries"
            :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
            :on-open-employee-document-file="handleOpenEmployeeDocumentFile"
            :opening-document-keys="openingEmployeeDocumentKeys"
            :get-document-open-key="getEmployeeDocumentOpenKey"
            :opening-document-label="text('candidateForms.form.sections.preparingDocument')"
            :on-select-employee-document-files="handleEmployeeDocumentChange"
            :on-remove-selected-employee-document-file="removeSelectedEmployeeDocumentFile"
            :on-remove-uploaded-employee-document-file="removeUploadedEmployeeDocumentFile"
            :removing-document-keys="removingEmployeeDocumentKeys"
            :is-uploading-contract-documents="uploadingEmployeeDocuments"
            :show-payroll-section="false"
            :document-section-title="text('candidateForms.form.sections.contractDocuments')"
            :document-section-description="text('candidateForms.form.sections.contractDocumentsDescription')"
            :show-per-entry-upload-action="false"
            :show-submit-all-documents-action="canManageContractDocuments"
            :on-submit-all-documents="submitContractDocuments"
            :submit-all-documents-label="text('candidateForms.form.employeeDocuments.actions.submitAll')"
            :submit-all-documents-busy-label="text('candidateForms.form.employeeDocuments.actions.submittingAll')"
            :is-submit-all-documents-disabled="!canSubmitContractDocuments"
          />

        <div class="flex flex-col gap-4 border-t app-table-divider pt-6 sm:flex-row sm:justify-end">
          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AppActionButton
              class="w-full sm:w-auto"
              :label="text('candidateForms.form.actions.back')"
              @click="router.back()"
            />
          </div>
        </div>
      </div>
      <div v-else class="app-empty-state border-0 px-0">
        {{ text('candidateForms.form.messages.loadingData') }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import CandidateFormCandidateSections from '@/features/candidateForms/components/CandidateFormCandidateSections.vue'
import CandidateFormEmployeeSections from '@/features/candidateForms/components/CandidateFormEmployeeSections.vue'
import { useCandidateFormPage } from '@/features/candidateForms/useCandidateFormPage'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'

const {
  bloodTypeSelectOptions,
  bpjsEmploymentStatusSelectOptions,
  bpjsHealthDeclineReasonSelectOptions,
  bpjsHealthEnrollmentPreferenceSelectOptions,
  candidateError,
  candidateLoading,
  candidateStatusBadge,
  candidateStatusLabel,
  candidateDocumentEntries,
  canManageContractDocuments,
  canShowEmployeeHistoryTab,
  canSubmitContractDocuments,
  currentCandidateRecord,
  employeeContractDocumentEntries,
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
  handleEmployeeDocumentChange,
  handleOpenEmployeeDocumentFile,
  isEmployeeCandidateForm,
  languageProficiencySelectOptions,
  maritalStatusSelectOptions,
  nonFormalEducationRows,
  photographPreviewUrl,
  openingEmployeeDocumentKeys,
  positionAppliedSelectOptions,
  removeSelectedEmployeeDocumentFile,
  removeUploadedEmployeeDocumentFile,
  removingEmployeeDocumentKeys,
  residenceOwnershipSelectOptions,
  router,
  sanitizeNestedNumberField,
  setActiveDetailTab,
  showingCandidateHistory,
  showingContractDocuments,
  showingEmployeeData,
  submitContractDocuments,
  text,
  transportationOwnershipSelectOptions,
  uploadingEmployeeDocuments,
  yearSelectOptions,
} = useCandidateFormPage()
</script>

<style scoped>
:global(.candidate-form-field) {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--app-color-border-strong);
  background: var(--app-color-surface-muted);
  padding: 0.75rem 1rem;
  color: var(--app-color-text);
  outline: none;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

:global(.candidate-form-field:focus) {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface);
  box-shadow: 0 0 0 2px var(--app-color-accent-ring);
}

:global(.candidate-form-checkbox-card) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface-muted);
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-color-text);
}

:global(.candidate-form-document-grid) {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:global(.candidate-form-document-card) {
  border-radius: 0.75rem;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface-muted);
  padding: 1rem;
}

:global(.candidate-form-document-card__header) {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;
}

:global(.candidate-form-document-count) {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 1.5rem;
  border-radius: 999px;
  background: var(--app-color-accent-soft);
  color: var(--app-color-accent-strong);
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

:global(.candidate-form-document-chip-list) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  list-style: none;
  padding: 0;
}

:global(.candidate-form-document-chip) {
  display: inline-flex;
  max-width: 100%;
  border-radius: 999px;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
  padding: 0.38rem 0.72rem;
  word-break: break-word;
}

:global(.candidate-form-document-chip--empty) {
  background: var(--app-color-danger-soft);
  border-color: var(--app-color-danger-border);
  color: var(--app-color-danger-strong);
  font-weight: 500;
}

@media (max-width: 768px) {
  :global(.candidate-form-document-grid) {
    grid-template-columns: 1fr;
  }
}
</style>
