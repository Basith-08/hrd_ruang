import type {
  BloodType,
  BpjsEmploymentStatus,
  BpjsHealthDeclineReason,
  BpjsHealthEnrollmentPreference,
  EducationCategory,
  EducationLevel,
  EmployeeDocumentFieldKey,
  FamilyCategory,
  Gender,
  LanguageProficiency,
  MaritalStatus,
  PortalRole,
  ResidenceOwnership,
  TransportationOwnership,
} from '@/domain/entities/CandidateForm'

export interface CandidateDocumentsRequest {
  cv: string[]
  diploma_certificate: string[]
  academic_transcript: string[]
  id_card: string[]
  driving_license: string[]
  passport: string[]
  family_card: string[]
  npwp: string[]
}

export type EmployeeDocumentsRequest = Record<EmployeeDocumentFieldKey, string[]>

export interface EmployeePayrollProfileRequest {
  bank_name: string
  bank_account_number: string
  account_holder_name: string
  branch_name: string
  tax_identification_number: string
  bpjs_health_enrollment_preference: BpjsHealthEnrollmentPreference | '' | string
  bpjs_health_decline_reason: BpjsHealthDeclineReason | '' | string
  bpjs_health_decline_reason_other: string
  bpjs_employment_status: BpjsEmploymentStatus | '' | string
}

export interface FamilyEmergencyRequest {
  id?: string
  name: string
  relationship: string
  gender: Gender | ''
  place_and_date_of_birth: string
  education: string
  description: string
  occupation: string
  remarks: string
  category: FamilyCategory | ''
}

export interface EducationHistoryRequest {
  id?: string
  level: EducationLevel | ''
  institution: string
  city: string
  major: string
  from_year: number | null
  to_year: number | null
  category: EducationCategory | ''
  description: string
}

export interface WorkHistoryRequest {
  id?: string
  company: string
  position: string
  from_year: number | null
  to_year: number | null
  reason_to_quitting: string
  last_salary: number | null
  benefit: string
  description: string
  company_address: string
  company_phone: string
  direct_superior_title: string
  organization_structure: string
}

export interface CandidateLanguageRequest {
  id?: string
  language_name: string
  speaking: LanguageProficiency | ''
  reading: LanguageProficiency | ''
  listening: LanguageProficiency | ''
  writing: LanguageProficiency | ''
}

export interface CandidateSkillRequest {
  id?: string
  skill_name: string
  description: string
  skill_order?: number | null
}

export interface CandidateReferenceRequest {
  id?: string
  name: string
  phone_number: string
  relationship: string
  position: string
  reference_order?: number | null
}

export interface PersonalStatementRequest {
  contract: boolean
  contract_period: string
  reference_check_reason: string
  business_trip: boolean
  expected_salary: number | null
  previous_application: boolean
  previous_application_details: string
  reference_check_allowed: boolean
  family_or_friend_in_company: boolean
  serious_illness: boolean
  serious_illness_details: string
  serious_accident_boolean: boolean
  psychological_test: boolean
  psychological_test_location: string
  psychological_test_purpose: string
  company_legal_issue: boolean
  company_legal_issue_details: string
  family_or_friend_details: string
  serious_accident_details: string
  civil_or_criminal_case: boolean
  civil_or_criminal_case_details: string
}

export interface CandidateFormRequest {
  role?: PortalRole | null
  employee_request_form_id: string
  candidate_id?: string | null
  photograph: string
  date_application: string
  notice_period: string
  full_name: string
  first_name?: string
  middle_name?: string
  last_name?: string
  hire_location: string
  date_of_birth: string
  place_of_birth: string
  nationality: string
  marital_status: MaritalStatus | ''
  religion: string
  gender: Gender | ''
  ethnic: string
  blood_type: BloodType | ''
  id_card_address: string
  residential_address: string
  personal_email: string
  instagram: string
  linkedin: string
  phone_number: string
  home_phone?: string
  id_type: string
  id_no: string
  available_start_date: string
  join_date: string
  transportation_type: string
  transportation_ownership: TransportationOwnership | '' | string
  residence_ownership: ResidenceOwnership | '' | string
  family_and_emergency: FamilyEmergencyRequest[]
  education: EducationHistoryRequest[]
  work_history: WorkHistoryRequest[]
  candidate_languages: CandidateLanguageRequest[]
  candidate_skills: CandidateSkillRequest[]
  candidate_references: CandidateReferenceRequest[]
  personal_statement: PersonalStatementRequest
  employee_payroll_profile: EmployeePayrollProfileRequest
  employee_documents: EmployeeDocumentsRequest
}
