export const genderOptions = ['Male', 'Female'] as const
export const maritalStatusOptions = ['Single', 'Married', 'Divorced'] as const
export const bloodTypeOptions = ['A', 'B', 'AB', 'O'] as const
export const educationLevelOptions = [
  'SD / Sederajat',
  'SMP / MTs / Sederajat',
  'SMA / SMK / MA / Sederajat',
  'Diploma I (D1)',
  'Diploma II (D2)',
  'Diploma III (D3)',
  'Diploma IV (D4)',
  'Sarjana (S1)',
  'Magister (S2)',
  'Doktor (S3)',
] as const
export const languageProficiencyOptions = ['Good', 'Fair', 'Poor'] as const
export const familyCategoryOptions = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Emergency Contact',
  'Other',
] as const
export const educationCategoryOptions = ['Formal Education', 'Training / Non-Formal'] as const
export const transportationOwnershipOptions = ['Personal', 'Office', 'Other'] as const
export const residenceOwnershipOptions = ['Personal', 'Rent', 'Boarding', 'Parents', 'Other'] as const
export const portalRoleOptions = ['candidate', 'employee'] as const
export const bpjsHealthEnrollmentPreferenceOptions = [
  'willing_to_enroll',
  'decline_enrollment',
] as const
export const bpjsHealthDeclineReasonOptions = [
  'pbi',
  'self_registered',
  'local_government',
  'other',
] as const
export const bpjsEmploymentStatusOptions = [
  'cash_out_first',
  'enroll_new',
  'continue_existing',
] as const
export const employeeDocumentFieldKeys = [
  'cv',
  'integrity_pact',
  'email_usage_policy',
  'identity_card',
  'family_card',
  'latest_diploma',
  'academic_transcript',
  'certificate_of_employment',
  'tax_id',
  'bpjs_health_card',
  'bpjs_health_statement',
  'bpjs_employment_card',
  'bank_account_book',
  'format_office',
  'skb',
  'other',
] as const

export const employeeVisibleDocumentFieldKeys = [
  'integrity_pact',
  'email_usage_policy',
  'tax_id',
  'bpjs_health_card',
  'bpjs_health_statement',
  'bpjs_employment_card',
  'bank_account_book',
  'format_office',
  'skb',
  'other',
] as const

export const candidateEmployeeDocumentFieldKeys = [
  'cv',
  'identity_card',
  'family_card',
  'latest_diploma',
  'academic_transcript',
  'certificate_of_employment',
] as const

// Legacy document explorer support. Candidate form no longer edits these directly.
export const candidateDocumentFieldKeys = [
  'cv',
  'diploma_certificate',
  'academic_transcript',
  'id_card',
  'driving_license',
  'passport',
  'family_card',
  'npwp',
] as const

export type Gender = (typeof genderOptions)[number]
export type MaritalStatus = (typeof maritalStatusOptions)[number]
export type BloodType = (typeof bloodTypeOptions)[number]
export type EducationLevel = (typeof educationLevelOptions)[number]
export type LanguageProficiency = (typeof languageProficiencyOptions)[number]
export type FamilyCategory = (typeof familyCategoryOptions)[number]
export type EducationCategory = (typeof educationCategoryOptions)[number]
export type TransportationOwnership = (typeof transportationOwnershipOptions)[number]
export type ResidenceOwnership = (typeof residenceOwnershipOptions)[number]
export type CandidateDocumentFieldKey = (typeof candidateDocumentFieldKeys)[number]
export type PortalRole = (typeof portalRoleOptions)[number]
export type EmployeeDocumentFieldKey = (typeof employeeDocumentFieldKeys)[number]
export type BpjsHealthEnrollmentPreference =
  (typeof bpjsHealthEnrollmentPreferenceOptions)[number]
export type BpjsHealthDeclineReason = (typeof bpjsHealthDeclineReasonOptions)[number]
export type BpjsEmploymentStatus = (typeof bpjsEmploymentStatusOptions)[number]

export const candidateDocumentFieldLabels: Record<CandidateDocumentFieldKey, string> = {
  cv: 'CV',
  diploma_certificate: 'Diploma Certificate',
  academic_transcript: 'Academic Transcript',
  id_card: 'ID Card',
  driving_license: 'Driving License',
  passport: 'Passport',
  family_card: 'Family Card',
  npwp: 'NPWP',
}

export const employeeDocumentFieldLabels: Record<EmployeeDocumentFieldKey, string> = {
  cv: 'CV',
  integrity_pact: 'Integrity Pact',
  email_usage_policy: 'Email Usage Policy',
  identity_card: 'Identity Card',
  family_card: 'Family Card',
  latest_diploma: 'Latest Degree Certificate',
  academic_transcript: 'Academic Transcript',
  certificate_of_employment: 'Certificate of Employment (CoE)',
  tax_id: 'Tax Identification Number',
  bpjs_health_card: 'BPJS Health Card',
  bpjs_health_statement: 'BPJS Health Statement',
  bpjs_employment_card: 'BPJS Employment Card',
  bank_account_book: 'Bank Account Book',
  format_office: 'Draft Employment Contract',
  skb: 'SKB',
  other: 'Lainnya',
}

export interface FamilyEmergency {
  id: string
  candidate_form_id: string
  name: string | null
  relationship: string | null
  gender: Gender | null
  place_and_date_of_birth: string | null
  education: string | null
  description: string | null
  occupation: string | null
  remarks: string | null
  category: FamilyCategory | string | null
}

export interface EducationHistory {
  id: string
  candidate_form_id: string
  level: EducationLevel | null
  institution: string | null
  city: string | null
  major: string | null
  from_year: number | null
  to_year: number | null
  category: EducationCategory | string | null
  description: string | null
}

export interface WorkHistory {
  id: string
  candidate_form_id: string
  company: string | null
  position: string | null
  from_year: number | null
  to_year: number | null
  reason_to_quitting: string | null
  last_salary: number | null
  benefit: string | null
  description: string | null
  company_address: string | null
  company_phone: string | null
  direct_superior_title: string | null
  organization_structure: string | null
}

export interface CandidateLanguage {
  id: string
  candidate_form_id: string
  language_name: string
  speaking: LanguageProficiency | null
  reading: LanguageProficiency | null
  listening: LanguageProficiency | null
  writing: LanguageProficiency | null
  created_at: string | null
  updated_at: string | null
}

export interface CandidateSkill {
  id: string
  candidate_form_id: string
  skill_name: string
  description: string | null
  skill_order: number | null
  created_at: string | null
  updated_at: string | null
}

export interface CandidateReference {
  id: string
  candidate_form_id: string
  name: string
  phone_number: string | null
  relationship: string | null
  position: string | null
  reference_order: number | null
  created_at: string | null
  updated_at: string | null
}

export interface PersonalStatement {
  id: string
  candidate_form_id: string
  contract: boolean | null
  contract_period: string | null
  reference_check_reason: string | null
  business_trip: boolean | null
  expected_salary: number | null
  previous_application: boolean | null
  previous_application_details: string | null
  reference_check_allowed: boolean | null
  family_or_friend_in_company: boolean | null
  serious_illness: boolean | null
  serious_illness_details: string | null
  serious_accident_boolean: boolean | null
  psychological_test: boolean | null
  psychological_test_location: string | null
  psychological_test_purpose: string | null
  company_legal_issue: boolean | null
  company_legal_issue_details: string | null
  family_or_friend_details: string | null
  serious_accident_details: string | null
  civil_or_criminal_case: boolean | null
  civil_or_criminal_case_details: string | null
}

export interface EmployeePayrollProfile {
  id?: string
  candidate_form_id: string
  bank_name: string | null
  bank_account_number: string | null
  account_holder_name: string | null
  branch_name: string | null
  tax_identification_number: string | null
  bpjs_health_enrollment_preference: BpjsHealthEnrollmentPreference | null
  bpjs_health_decline_reason: BpjsHealthDeclineReason | null
  bpjs_health_decline_reason_other: string | null
  bpjs_employment_status: BpjsEmploymentStatus | null
  created_at?: string | null
  updated_at?: string | null
}

export type EmployeeDocuments = Record<EmployeeDocumentFieldKey, string[]>

export type CandidateFormCompletionStatus = 'in_progress' | 'completed'

export interface CandidateForm {
  id: string
  role?: PortalRole | null
  candidate_source?: 'local' | 'candidate_service' | null
  candidate_service_form_id?: string | null
  candidate_service_application_id?: string | null
  candidate_service_candidate_id?: string | null
  candidate_service_identity_user_id?: string | null
  employee_code?: string | null
  employee_request_form_id: string | null
  candidate_id: string | null
  completion_status?: CandidateFormCompletionStatus | null
  photograph: string | null
  date_application: string | null
  notice_period: string | null
  full_name?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  hire_location: string | null
  date_of_birth: string | null
  place_of_birth: string | null
  nationality: string | null
  marital_status: MaritalStatus | null
  religion: string | null
  gender: Gender | null
  ethnic: string | null
  blood_type: BloodType | null
  id_card_address: string | null
  residential_address: string | null
  personal_email: string | null
  instagram: string | null
  linkedin: string | null
  phone_number: string | null
  home_phone?: string | null
  id_type: string | null
  id_no: string | null
  available_start_date: string | null
  join_date: string | null
  transportation_type: string | null
  transportation_ownership: TransportationOwnership | string | null
  residence_ownership: ResidenceOwnership | string | null
  created_at: string | null
  updated_at: string | null
  employee_request_form?: {
    id: string
    pt_name?: string | null
    department?: string | null
    main_position: string | null
    site: string | null
  } | null
  family_and_emergency: FamilyEmergency[]
  education: EducationHistory[]
  work_history: WorkHistory[]
  candidate_languages: CandidateLanguage[]
  candidate_skills: CandidateSkill[]
  candidate_references: CandidateReference[]
  personal_statement: PersonalStatement | null
  employee_payroll_profile?: EmployeePayrollProfile | null
  employee_documents?: EmployeeDocuments
}
