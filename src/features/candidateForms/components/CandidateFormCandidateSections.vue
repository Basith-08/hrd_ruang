<template>
  <CandidateFormSimpleSection
    :title="text('candidateForms.form.sections.applicationData')"
    :form="form"
    :fields="applicationFields"
    :is-read-only="true"
  />

  <div class="app-divider h-px"></div>

  <CandidateFormSimpleSection
    :title="text('candidateForms.form.sections.personalData')"
    :form="form"
    :fields="personalFields"
    :is-read-only="true"
  >
    <label class="space-y-2 md:col-span-2">
      <span class="app-copy-strong text-sm">
        {{ text('candidateForms.form.fields.photograph') }}
      </span>
      <img
        v-if="photographPreviewUrl"
        :src="photographPreviewUrl"
        alt="Candidate photograph preview"
        class="app-photo-frame h-32 w-32 sm:h-40 sm:w-40"
      />
      <p v-else class="app-copy-body">
        {{ text('candidateForms.form.messages.noDataYet', { label: text('candidateForms.form.fields.photograph').toLowerCase() }) }}.
      </p>
    </label>
  </CandidateFormSimpleSection>

  <div class="app-divider h-px"></div>

  <CandidateFormSimpleSection
    :title="text('candidateForms.form.sections.contactIdentity')"
    :form="form"
    :fields="contactFields"
    :is-read-only="true"
  />

  <div class="app-divider h-px"></div>

  <section class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-xl font-semibold">{{ text('candidateForms.form.sections.familyEmergency') }}</h3>
    </div>
    <div class="space-y-4">
      <div
        v-for="section in groupedFamilySections"
        :key="section.key"
        class="app-card-frame"
      >
        <div
          class="app-card-frame-header sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="app-card-title">{{ section.label }}</p>
          </div>
        </div>

        <div v-if="section.items.length === 0" class="app-copy-body px-4 py-4">
          {{ text('candidateForms.form.messages.noDataYet', { label: section.shortLabel.toLowerCase() }) }}.
        </div>

        <div
          v-for="entry in section.items"
          :key="`family-${section.key}-${entry.formIndex}`"
          class="app-card-frame-body grid gap-4 border-t app-table-divider p-4 first:border-t-0 md:grid-cols-2"
        >
          <CandidateFormObjectFields
            class="md:col-span-2"
            :item="entry.item"
            :fields="familyFields"
            :is-read-only="true"
          />

          <div class="md:col-span-2">
            <CandidateFormObjectFields
              class="max-w-sm"
              :item="entry.item"
              :fields="familyMetaFields"
              grid-class="grid gap-4"
              :is-read-only="true"
            />
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="app-divider h-px"></div>

  <section class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-xl font-semibold">{{ text('candidateForms.form.sections.educationTraining') }}</h3>
    </div>
    <div class="space-y-4">
      <div class="app-card-frame">
        <div class="app-card-frame-header">
          <p class="app-card-title">{{ text('candidateForms.form.sections.formalEducation') }}</p>
        </div>
        <div class="app-card-frame-body space-y-0">
          <div
            v-for="row in formalEducationFieldRows"
            :key="row.level"
            class="border-t app-table-divider p-4 first:border-t-0"
          >
            <CandidateFormObjectFields
              :item="row.item"
              :fields="row.fields"
              :grid-class="formalEducationGridClass"
              :is-read-only="true"
            />
          </div>
        </div>
      </div>

      <CandidateFormRepeatableFieldsCard
        :title="text('candidateForms.form.sections.trainingNonFormal')"
        description="Pelatihan, kursus, sertifikasi, atau pendidikan non-formal."
        :items="nonFormalEducationItems"
        :empty-text="nonFormalEducationEmptyText"
        :is-read-only="true"
        :sanitize-nested-number-field="sanitizeNestedNumberField"
      />
    </div>
  </section>

  <div class="app-divider h-px"></div>

  <section class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-xl font-semibold">{{ text('candidateForms.form.sections.skillAbilities') }}</h3>
    </div>
    <div class="space-y-4">
      <CandidateFormRepeatableFieldsCard
        :title="text('candidateForms.form.sections.foreignLanguage')"
        description="Isi dengan tingkat kemampuan seperti form pelamar: Good, Fair, atau Poor."
        :items="languageItems"
        :empty-text="languageEmptyText"
        :is-read-only="true"
        default-row-class="border-t app-table-divider p-4 first:border-t-0"
        :default-fields-grid-class="languageGridClass"
        :sanitize-nested-number-field="sanitizeNestedNumberField"
      />

      <CandidateFormRepeatableFieldsCard
        :title="text('candidateForms.form.sections.otherRelevantSkills')"
        :items="skillItems"
        :empty-text="skillEmptyText"
        :is-read-only="true"
        :sanitize-nested-number-field="sanitizeNestedNumberField"
      />
    </div>
  </section>

  <div class="app-divider h-px"></div>

  <section class="space-y-4">
    <CandidateFormRepeatableFieldsCard
      :title="text('candidateForms.form.sections.employmentHistory')"
      description="Jelaskan setiap jabatan yang anda pegang secara rinci, mulai dari jabatan sekarang atau terakhir."
      helper-text="Please describe your work experience in detail, beginning with your current or most recent job."
      :items="workHistoryItems"
      :empty-text="workHistoryEmptyText"
      :is-read-only="true"
      default-row-class="app-readonly-row-card md:grid-cols-2"
      default-fields-grid-class="grid gap-4 md:grid-cols-2"
      :sanitize-nested-number-field="sanitizeNestedNumberField"
    />
  </section>

  <div class="app-divider h-px"></div>

  <section class="space-y-4">
    <CandidateFormRepeatableFieldsCard
      :title="text('candidateForms.form.sections.referenceData')"
      :items="referenceItems"
      :empty-text="referenceEmptyText"
      :is-read-only="true"
      default-row-class="app-readonly-row-card md:grid-cols-2"
      default-fields-grid-class="grid gap-4 md:grid-cols-2"
      :sanitize-nested-number-field="sanitizeNestedNumberField"
    />
  </section>

  <div class="app-divider h-px"></div>

  <CandidateFormSimpleSection
    :title="text('candidateForms.form.sections.mobilityResidence')"
    :form="form"
    :fields="mobilityFields"
    :is-read-only="true"
  />

  <section class="space-y-4">
    <h3 class="app-section-title-compact text-xl">{{ text('candidateForms.form.sections.personalStatement') }}</h3>
    <div class="grid gap-4 md:grid-cols-2">
      <template v-for="field in personalStatementFields" :key="field.key">
        <label class="candidate-form-checkbox-card">
          <input :checked="Boolean(form.personal_statement[field.booleanKey])" type="checkbox" class="h-4 w-4" disabled />
          <span>{{ field.booleanLabel }}</span>
        </label>
        <CandidateFormObjectFields
          v-if="field.detailKey && field.detailLabel"
          :class="field.detailColSpan === 2 ? 'md:col-span-2' : ''"
          :item="form.personal_statement"
          :fields="[buildPersonalStatementDetailField(field)]"
          grid-class="grid gap-4"
          :is-read-only="true"
          :sanitize-nested-number-field="sanitizeNestedNumberField"
        />
      </template>
    </div>
  </section>

  <div v-if="showEmployeeDocuments" class="app-divider h-px"></div>

  <CandidateFormDocumentSection
    v-if="showEmployeeDocuments"
    title="Candidate Documents"
    :description="text('candidateForms.form.sections.candidateDocumentsDescription')"
    :text="text"
    :entries="employeeDocumentEntries"
    :get-readable-employee-document-file-name="getReadableEmployeeDocumentFileName"
    :on-open-file="onOpenEmployeeDocumentFile"
    :opening-document-keys="openingDocumentKeys"
    :get-document-open-key="getDocumentOpenKey"
    :opening-document-label="openingDocumentLabel"
  />
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { EmployeeDocumentFieldKey } from '@/domain/entities/CandidateForm'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import CandidateFormDocumentSection from '@/features/candidateForms/components/CandidateFormDocumentSection.vue'
import CandidateFormObjectFields from '@/features/candidateForms/components/CandidateFormObjectFields.vue'
import CandidateFormRepeatableFieldsCard from '@/features/candidateForms/components/CandidateFormRepeatableFieldsCard.vue'
import CandidateFormSimpleSection from '@/features/candidateForms/components/CandidateFormSimpleSection.vue'
import type {
  CandidateFormEmployeeDocumentEntry,
  CandidateFormFormalEducationRow,
  CandidateFormGroupedFamilySection,
  CandidateFormIndexedEducationRow,
  CandidateFormObjectFieldConfig,
  CandidateFormPersonalStatementFieldConfig,
  CandidateFormRepeatableFieldRow,
  CandidateFormSelectOption,
  CandidateFormSimpleFieldConfig,
} from '@/features/candidateForms/types/CandidateFormPage.type'

const props = defineProps({
  form: {
    type: Object as PropType<CandidateFormRequest>,
    required: true,
  },
  text: {
    type: Function as PropType<(key: string, params?: Record<string, string>) => string>,
    required: true,
  },
  photographPreviewUrl: {
    type: String,
    default: '',
  },
  positionAppliedSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  genderSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  maritalStatusSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  bloodTypeSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  familyCategorySelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  languageProficiencySelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  transportationOwnershipSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  residenceOwnershipSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  yearSelectOptions: {
    type: Array as PropType<CandidateFormSelectOption[]>,
    default: () => [],
  },
  groupedFamilySections: {
    type: Array as PropType<CandidateFormGroupedFamilySection[]>,
    default: () => [],
  },
  formalEducationRows: {
    type: Array as PropType<CandidateFormFormalEducationRow[]>,
    default: () => [],
  },
  nonFormalEducationRows: {
    type: Array as PropType<CandidateFormIndexedEducationRow[]>,
    default: () => [],
  },
  employeeDocumentEntries: {
    type: Array as PropType<CandidateFormEmployeeDocumentEntry[]>,
    default: () => [],
  },
  showEmployeeDocuments: {
    type: Boolean,
    default: true,
  },
  sanitizeNestedNumberField: {
    type: Function as PropType<(target: object, key: string) => void>,
    required: true,
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
})

const formalEducationGridClass = 'grid gap-4 md:grid-cols-[120px_1fr_160px_160px]'
const languageGridClass = 'grid gap-4 lg:grid-cols-[1.4fr_repeat(4,minmax(120px,1fr))]'
const nonFormalEducationEmptyText = 'No training or non-formal education data yet.'
const languageEmptyText = 'No language data yet.'
const skillEmptyText = 'No skill data yet.'
const workHistoryEmptyText = 'No employment history data yet.'
const referenceEmptyText = 'No reference data yet.'

function createRepeatableFieldRow<TItem extends object>(
  key: string,
  item: TItem,
  fields: CandidateFormObjectFieldConfig[],
  options: Omit<CandidateFormRepeatableFieldRow<TItem>, 'key' | 'item' | 'fields'> = {},
): CandidateFormRepeatableFieldRow<TItem> {
  return {
    key,
    item,
    fields,
    ...options,
  }
}

const applicationFields = computed<CandidateFormSimpleFieldConfig[]>(() => [
  {
    key: 'employee_request_form_id',
    model: 'employee_request_form_id',
    label: props.text('candidateForms.form.fields.positionAppliedFor'),
    type: 'select',
    options: props.positionAppliedSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchPosition'),
    disabled: true,
    colSpan: 2,
    emptyLabel: props.text('candidateForms.form.actions.select'),
    helperText: props.text('candidateForms.form.messages.readOnly'),
  },
  {
    key: 'date_application',
    model: 'date_application',
    label: props.text('candidateForms.form.fields.applicationDate'),
    type: 'date',
  },
  {
    key: 'notice_period',
    model: 'notice_period',
    label: props.text('candidateForms.form.fields.noticePeriod'),
    placeholder: props.text('candidateForms.form.placeholders.noticePeriodExample'),
  },
  {
    key: 'available_start_date',
    model: 'available_start_date',
    label: props.text('candidateForms.form.fields.availableStartDate'),
    type: 'date',
  },
  {
    key: 'hire_location',
    model: 'hire_location',
    label: props.text('candidateForms.form.fields.hireLocation'),
  },
])

const personalFields = computed<CandidateFormSimpleFieldConfig[]>(() => [
  {
    key: 'full_name',
    model: 'full_name',
    label: props.text('candidateForms.form.fields.fullNameRequired'),
    required: true,
    colSpan: 2,
  },
  {
    key: 'gender',
    model: 'gender',
    label: props.text('candidateForms.form.fields.gender'),
    type: 'select',
    options: props.genderSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchGender'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectGender'),
  },
  {
    key: 'place_of_birth',
    model: 'place_of_birth',
    label: props.text('candidateForms.form.fields.placeOfBirth'),
  },
  {
    key: 'date_of_birth',
    model: 'date_of_birth',
    label: props.text('candidateForms.form.fields.dateOfBirth'),
    type: 'date',
  },
  {
    key: 'nationality',
    model: 'nationality',
    label: props.text('candidateForms.form.fields.nationality'),
  },
  {
    key: 'religion',
    model: 'religion',
    label: props.text('candidateForms.form.fields.religion'),
  },
  {
    key: 'marital_status',
    model: 'marital_status',
    label: props.text('candidateForms.form.fields.maritalStatus'),
    type: 'select',
    options: props.maritalStatusSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchMaritalStatus'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectStatus'),
  },
  {
    key: 'blood_type',
    model: 'blood_type',
    label: props.text('candidateForms.form.fields.bloodType'),
    type: 'select',
    options: props.bloodTypeSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchBloodType'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectBloodType'),
  },
  {
    key: 'ethnic',
    model: 'ethnic',
    label: props.text('candidateForms.form.fields.ethnic'),
  },
])

const contactFields = computed<CandidateFormSimpleFieldConfig[]>(() => [
  {
    key: 'id_card_address',
    model: 'id_card_address',
    label: props.text('candidateForms.form.fields.idCardAddress'),
    type: 'textarea',
    colSpan: 2,
  },
  {
    key: 'residential_address',
    model: 'residential_address',
    label: props.text('candidateForms.form.fields.residentialAddress'),
    type: 'textarea',
    colSpan: 2,
  },
  {
    key: 'personal_email',
    model: 'personal_email',
    label: props.text('candidateForms.form.fields.personalEmail'),
    type: 'email',
  },
  {
    key: 'phone_number',
    model: 'phone_number',
    label: props.text('candidateForms.form.fields.cellularPhone'),
  },
  {
    key: 'instagram',
    model: 'instagram',
    label: 'Instagram',
  },
  {
    key: 'linkedin',
    model: 'linkedin',
    label: 'LinkedIn',
  },
  {
    key: 'id_type',
    model: 'id_type',
    label: props.text('candidateForms.form.fields.idType'),
  },
  {
    key: 'id_no',
    model: 'id_no',
    label: props.text('candidateForms.form.fields.idNumber'),
  },
])

const familyFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'relationship',
    model: 'relationship',
    label: props.text('candidateForms.form.labels.relationship'),
  },
  {
    key: 'name',
    model: 'name',
    label: props.text('candidateForms.form.labels.name'),
  },
  {
    key: 'gender',
    model: 'gender',
    label: props.text('candidateForms.form.labels.gender'),
    type: 'select',
    options: props.genderSelectOptions,
    placeholder: 'Search gender...',
    emptyLabel: 'Select gender',
  },
  {
    key: 'occupation',
    model: 'occupation',
    label: props.text('candidateForms.form.labels.occupation'),
  },
  {
    key: 'place_and_date_of_birth',
    model: 'place_and_date_of_birth',
    label: props.text('candidateForms.form.labels.placeAndDateOfBirth'),
    colSpan: 2,
  },
  {
    key: 'education',
    model: 'education',
    label: props.text('candidateForms.form.labels.education'),
  },
  {
    key: 'remarks',
    model: 'remarks',
    label: props.text('candidateForms.form.labels.remarks'),
  },
  {
    key: 'description',
    model: 'description',
    label: props.text('candidateForms.form.labels.description'),
    type: 'textarea',
    colSpan: 2,
  },
])

const familyMetaFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'category',
    model: 'category',
    label: props.text('candidateForms.form.labels.category'),
    type: 'select',
    options: props.familyCategorySelectOptions,
    placeholder: 'Search category...',
    emptyLabel: 'Select category',
  },
])

const formalEducationFieldRows = computed(() =>
  props.formalEducationRows.map((row) => ({
    ...row,
    fields: [
      {
        key: `${row.level}-label`,
        label: props.text('candidateForms.form.labels.level'),
        value: row.label,
        disabled: true,
        inputClassName: 'app-field-static',
      },
      {
        key: `${row.level}-institution`,
        model: 'institution',
        label: props.text('candidateForms.form.labels.institution'),
      },
      {
        key: `${row.level}-from_year`,
        model: 'from_year',
        label: props.text('candidateForms.form.labels.fromYear'),
        type: 'select',
        options: props.yearSelectOptions,
        placeholder: 'Search year...',
        emptyLabel: 'Select year',
        emptyValue: null,
      },
      {
        key: `${row.level}-to_year`,
        model: 'to_year',
        label: props.text('candidateForms.form.labels.toYear'),
        type: 'select',
        options: props.yearSelectOptions,
        placeholder: 'Search year...',
        emptyLabel: 'Select year',
        emptyValue: null,
      },
      {
        key: `${row.level}-description`,
        model: 'description',
        label: props.text('candidateForms.form.labels.descriptionRemarks'),
        type: 'textarea',
        colSpan: 4,
      },
    ] as CandidateFormObjectFieldConfig[],
  })),
)

const nonFormalEducationFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'major',
    model: 'major',
    label: props.text('candidateForms.form.labels.courseOfStudy'),
    colSpan: 2,
  },
  {
    key: 'institution',
    model: 'institution',
    label: props.text('candidateForms.form.labels.institution'),
  },
  {
    key: 'city',
    model: 'city',
    label: props.text('candidateForms.form.labels.city'),
  },
  {
    key: 'from_year',
    model: 'from_year',
    label: props.text('candidateForms.form.labels.fromYear'),
    type: 'select',
    options: props.yearSelectOptions,
    placeholder: 'Search year...',
    emptyLabel: 'Select year',
    emptyValue: null,
  },
  {
    key: 'to_year',
    model: 'to_year',
    label: props.text('candidateForms.form.labels.toYear'),
    type: 'select',
    options: props.yearSelectOptions,
    placeholder: 'Search year...',
    emptyLabel: 'Select year',
    emptyValue: null,
  },
  {
    key: 'description',
    model: 'description',
    label: props.text('candidateForms.form.labels.descriptionRemarks'),
    type: 'textarea',
    colSpan: 2,
  },
])

const nonFormalEducationItems = computed<CandidateFormRepeatableFieldRow[]>(() =>
  props.nonFormalEducationRows.map((entry) =>
    createRepeatableFieldRow(
      `education-nonformal-${entry.formIndex}`,
      entry.item,
      nonFormalEducationFields.value,
      {
        fieldsWrapperClass: 'md:col-span-2',
      },
    ),
  ),
)

const languageFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'language_name',
    model: 'language_name',
    label: props.text('candidateForms.form.labels.language'),
  },
  {
    key: 'speaking',
    model: 'speaking',
    label: props.text('candidateForms.form.labels.speaking'),
    type: 'select',
    options: props.languageProficiencySelectOptions,
    placeholder: 'Search proficiency...',
    emptyLabel: 'Select',
  },
  {
    key: 'reading',
    model: 'reading',
    label: props.text('candidateForms.form.labels.reading'),
    type: 'select',
    options: props.languageProficiencySelectOptions,
    placeholder: 'Search proficiency...',
    emptyLabel: 'Select',
  },
  {
    key: 'listening',
    model: 'listening',
    label: props.text('candidateForms.form.labels.listening'),
    type: 'select',
    options: props.languageProficiencySelectOptions,
    placeholder: 'Search proficiency...',
    emptyLabel: 'Select',
  },
  {
    key: 'writing',
    model: 'writing',
    label: props.text('candidateForms.form.labels.writing'),
    type: 'select',
    options: props.languageProficiencySelectOptions,
    placeholder: 'Search proficiency...',
    emptyLabel: 'Select',
  },
])

const languageItems = computed<CandidateFormRepeatableFieldRow[]>(() =>
  props.form.candidate_languages.map((item, index) =>
    createRepeatableFieldRow(`language-${index}`, item, languageFields.value),
  ),
)

const skillFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'description',
    model: 'description',
    label: props.text('candidateForms.form.labels.skillDescription'),
    type: 'textarea',
    placeholder: 'Describe the relevant skill',
  },
  {
    key: 'skill_name',
    model: 'skill_name',
    label: props.text('candidateForms.form.labels.shortSkillName'),
  },
])

const skillItems = computed<CandidateFormRepeatableFieldRow[]>(() =>
  props.form.candidate_skills.map((item, index) =>
    createRepeatableFieldRow(`skill-${index}`, item, skillFields.value, {
      fieldsWrapperClass: 'md:col-span-2',
    }),
  ),
)

const workHistoryFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'company',
    model: 'company',
    label: props.text('candidateForms.form.labels.company'),
  },
  {
    key: 'position',
    model: 'position',
    label: props.text('candidateForms.form.labels.position'),
  },
  {
    key: 'company_address',
    model: 'company_address',
    label: props.text('candidateForms.form.labels.companyAddress'),
    type: 'textarea',
    colSpan: 2,
  },
  {
    key: 'company_phone',
    model: 'company_phone',
    label: props.text('candidateForms.form.labels.companyPhone'),
  },
  {
    key: 'direct_superior_title',
    model: 'direct_superior_title',
    label: props.text('candidateForms.form.labels.directSuperiorTitle'),
  },
  {
    key: 'from_year',
    model: 'from_year',
    label: props.text('candidateForms.form.labels.fromYear'),
    type: 'select',
    options: props.yearSelectOptions,
    placeholder: 'Search year...',
    emptyLabel: 'Select year',
    emptyValue: null,
  },
  {
    key: 'to_year',
    model: 'to_year',
    label: props.text('candidateForms.form.labels.toYear'),
    type: 'select',
    options: props.yearSelectOptions,
    placeholder: 'Search year...',
    emptyLabel: 'Select year',
    emptyValue: null,
  },
  {
    key: 'last_salary',
    model: 'last_salary',
    label: props.text('candidateForms.form.labels.lastSalary'),
    type: 'number',
    min: 0,
  },
  {
    key: 'benefit',
    model: 'benefit',
    label: props.text('candidateForms.form.labels.benefitFacilities'),
  },
  {
    key: 'reason_to_quitting',
    model: 'reason_to_quitting',
    label: props.text('candidateForms.form.labels.reasonForLeaving'),
    colSpan: 2,
  },
  {
    key: 'organization_structure',
    model: 'organization_structure',
    label: props.text('candidateForms.form.labels.organizationStructure'),
    type: 'textarea',
    colSpan: 2,
  },
  {
    key: 'description',
    model: 'description',
    label: props.text('candidateForms.form.labels.description'),
    type: 'textarea',
    colSpan: 2,
  },
])

const workHistoryItems = computed<CandidateFormRepeatableFieldRow[]>(() =>
  props.form.work_history.map((item, index) =>
    createRepeatableFieldRow(`work-${index}`, item, workHistoryFields.value, {
      fieldsWrapperClass: 'md:col-span-2',
    }),
  ),
)

const referenceFields = computed<CandidateFormObjectFieldConfig[]>(() => [
  {
    key: 'name',
    model: 'name',
    label: props.text('candidateForms.form.labels.referenceName'),
  },
  {
    key: 'phone_number',
    model: 'phone_number',
    label: props.text('candidateForms.form.labels.phoneNumber'),
  },
  {
    key: 'relationship',
    model: 'relationship',
    label: props.text('candidateForms.form.labels.relationship'),
  },
  {
    key: 'position',
    model: 'position',
    label: props.text('candidateForms.form.labels.position'),
  },
])

const referenceItems = computed<CandidateFormRepeatableFieldRow[]>(() =>
  props.form.candidate_references.map((item, index) =>
    createRepeatableFieldRow(`reference-${index}`, item, referenceFields.value, {
      fieldsWrapperClass: 'md:col-span-2',
    }),
  ),
)

const mobilityFields = computed<CandidateFormSimpleFieldConfig[]>(() => [
  {
    key: 'transportation_type',
    model: 'transportation_type',
    label: props.text('candidateForms.form.labels.transportationType'),
  },
  {
    key: 'transportation_ownership',
    model: 'transportation_ownership',
    label: props.text('candidateForms.form.labels.transportationOwnership'),
    type: 'select',
    options: props.transportationOwnershipSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchOwnership'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectOwnership'),
  },
  {
    key: 'residence_ownership',
    model: 'residence_ownership',
    label: props.text('candidateForms.form.labels.residenceOwnership'),
    type: 'select',
    options: props.residenceOwnershipSelectOptions,
    placeholder: props.text('candidateForms.form.placeholders.searchResidence'),
    emptyLabel: props.text('candidateForms.form.placeholders.selectResidence'),
    colSpan: 2,
  },
])

const personalStatementFields = computed<CandidateFormPersonalStatementFieldConfig[]>(() => [
  {
    key: 'contract',
    booleanKey: 'contract',
    booleanLabel: props.text('candidateForms.form.labels.currentlyBoundByContract'),
    detailKey: 'contract_period',
    detailLabel: props.text('candidateForms.form.labels.contractPeriod'),
  },
  {
    key: 'business_trip',
    booleanKey: 'business_trip',
    booleanLabel: props.text('candidateForms.form.labels.willingForBusinessTrips'),
    detailKey: 'expected_salary',
    detailLabel: props.text('candidateForms.form.labels.expectedSalary'),
    detailType: 'text',
  },
  {
    key: 'reference_check_allowed',
    booleanKey: 'reference_check_allowed',
    booleanLabel: props.text('candidateForms.form.labels.allowReferenceCheck'),
    detailKey: 'reference_check_reason',
    detailLabel: props.text('candidateForms.form.labels.reasonIfNotAllowed'),
    detailType: 'textarea',
  },
  {
    key: 'family_or_friend_in_company',
    booleanKey: 'family_or_friend_in_company',
    booleanLabel: props.text('candidateForms.form.labels.haveFamilyOrFriends'),
    detailKey: 'family_or_friend_details',
    detailLabel: props.text('candidateForms.form.labels.familyFriendDetails'),
    detailType: 'textarea',
  },
  {
    key: 'serious_illness',
    booleanKey: 'serious_illness',
    booleanLabel: props.text('candidateForms.form.labels.seriousIllness'),
    detailKey: 'serious_illness_details',
    detailLabel: props.text('candidateForms.form.labels.seriousIllnessDetails'),
    detailType: 'textarea',
  },
  {
    key: 'serious_accident_boolean',
    booleanKey: 'serious_accident_boolean',
    booleanLabel: props.text('candidateForms.form.labels.seriousAccident'),
    detailKey: 'serious_accident_details',
    detailLabel: props.text('candidateForms.form.labels.seriousAccidentDetails'),
    detailType: 'textarea',
  },
  {
    key: 'psychological_test',
    booleanKey: 'psychological_test',
    booleanLabel: props.text('candidateForms.form.labels.psychologicalTest'),
    detailKey: 'psychological_test_location',
    detailLabel: props.text('candidateForms.form.labels.psychologicalTestLocation'),
  },
  {
    key: 'psychological_test_purpose',
    booleanKey: 'psychological_test',
    booleanLabel: props.text('candidateForms.form.labels.psychologicalTest'),
    detailKey: 'psychological_test_purpose',
    detailLabel: props.text('candidateForms.form.labels.psychologicalTestPurpose'),
    detailType: 'textarea',
    detailColSpan: 2,
  },
  {
    key: 'company_legal_issue',
    booleanKey: 'company_legal_issue',
    booleanLabel: props.text('candidateForms.form.labels.companyLegalIssue'),
    detailKey: 'company_legal_issue_details',
    detailLabel: props.text('candidateForms.form.labels.companyLegalIssueDetails'),
    detailType: 'textarea',
  },
  {
    key: 'civil_or_criminal_case',
    booleanKey: 'civil_or_criminal_case',
    booleanLabel: props.text('candidateForms.form.labels.civilOrCriminalCase'),
    detailKey: 'civil_or_criminal_case_details',
    detailLabel: props.text('candidateForms.form.labels.civilOrCriminalCaseDetails'),
    detailType: 'textarea',
  },
  {
    key: 'previous_application',
    booleanKey: 'previous_application',
    booleanLabel: props.text('candidateForms.form.labels.previousApplication'),
    detailKey: 'previous_application_details',
    detailLabel: props.text('candidateForms.form.labels.previousApplicationDetails'),
    detailType: 'textarea',
  },
])

function buildPersonalStatementDetailField(
  field: CandidateFormPersonalStatementFieldConfig,
): CandidateFormObjectFieldConfig {
  if (!field.detailKey || !field.detailLabel) {
    return {
      key: `${field.key}-detail`,
      label: '',
      readonly: true,
      value: '',
    }
  }

  return {
    key: `${field.key}-${field.detailKey}`,
    model: field.detailKey,
    label: field.detailLabel,
    type: field.detailKey === 'expected_salary' ? 'number' : field.detailType,
    min: field.detailKey === 'expected_salary' ? 0 : undefined,
  }
}
</script>
