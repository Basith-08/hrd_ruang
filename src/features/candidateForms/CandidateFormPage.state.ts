import {
  employeeDocumentFieldKeys,
  type EducationLevel,
} from '@/domain/entities/CandidateForm'
import type {
  CandidateFormRequest,
  CandidateLanguageRequest,
  CandidateReferenceRequest,
  CandidateSkillRequest,
  EducationHistoryRequest,
  EmployeePayrollProfileRequest,
  FamilyEmergencyRequest,
  PersonalStatementRequest,
  WorkHistoryRequest,
} from '@/domain/requests/CandidateFormRequest'

export function createFamilyItemState(): FamilyEmergencyRequest {
  return {
    name: '',
    relationship: '',
    gender: '',
    place_and_date_of_birth: '',
    education: '',
    description: '',
    occupation: '',
    remarks: '',
    category: '',
  }
}

export function createEducationItemState(
  overrides: Partial<EducationHistoryRequest> = {},
): EducationHistoryRequest {
  return {
    level: '',
    institution: '',
    city: '',
    major: '',
    from_year: null,
    to_year: null,
    category: '',
    description: '',
    ...overrides,
  }
}

export function createWorkHistoryItemState(): WorkHistoryRequest {
  return {
    company: '',
    position: '',
    from_year: null,
    to_year: null,
    reason_to_quitting: '',
    last_salary: null,
    benefit: '',
    description: '',
    company_address: '',
    company_phone: '',
    direct_superior_title: '',
    organization_structure: '',
  }
}

export function createLanguageItemState(): CandidateLanguageRequest {
  return {
    language_name: '',
    speaking: '',
    reading: '',
    listening: '',
    writing: '',
  }
}

export function createSkillItemState(): CandidateSkillRequest {
  return {
    skill_name: '',
    description: '',
    skill_order: null,
  }
}

export function createReferenceItemState(): CandidateReferenceRequest {
  return {
    name: '',
    phone_number: '',
    relationship: '',
    position: '',
    reference_order: null,
  }
}

export function createPersonalStatementState(): PersonalStatementRequest {
  return {
    contract: false,
    contract_period: '',
    reference_check_reason: '',
    business_trip: false,
    expected_salary: null,
    previous_application: false,
    previous_application_details: '',
    reference_check_allowed: true,
    family_or_friend_in_company: false,
    serious_illness: false,
    serious_illness_details: '',
    serious_accident_boolean: false,
    psychological_test: false,
    psychological_test_location: '',
    psychological_test_purpose: '',
    company_legal_issue: false,
    company_legal_issue_details: '',
    family_or_friend_details: '',
    serious_accident_details: '',
    civil_or_criminal_case: false,
    civil_or_criminal_case_details: '',
  }
}

export function createEmployeePayrollProfileState(): EmployeePayrollProfileRequest {
  return {
    bank_name: '',
    bank_account_number: '',
    account_holder_name: '',
    branch_name: '',
    tax_identification_number: '',
    bpjs_health_enrollment_preference: '',
    bpjs_health_decline_reason: '',
    bpjs_health_decline_reason_other: '',
    bpjs_employment_status: '',
  }
}

export function ensureMinimumItemsState<T>(
  items: T[],
  minimumCount: number,
  createFallback: () => T,
) {
  const nextItems = [...items]

  while (nextItems.length < minimumCount) {
    nextItems.push(createFallback())
  }

  return nextItems
}

export function createCandidateFormState(): CandidateFormRequest {
  return createCandidateFormStateFromLevels([])
}

export function createCandidateFormStateFromLevels(
  formalEducationLevels: ReadonlyArray<{ level: EducationLevel }>,
): CandidateFormRequest {
  return {
    role: 'candidate',
    employee_request_form_id: '',
    candidate_id: null,
    photograph: '',
    date_application: '',
    notice_period: '',
    full_name: '',
    hire_location: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    marital_status: '',
    religion: '',
    gender: '',
    ethnic: '',
    blood_type: '',
    id_card_address: '',
    residential_address: '',
    personal_email: '',
    instagram: '',
    linkedin: '',
    phone_number: '',
    id_type: '',
    id_no: '',
    available_start_date: '',
    join_date: '',
    transportation_type: '',
    transportation_ownership: '',
    residence_ownership: '',
    family_and_emergency: [createFamilyItemState()],
    education: [
      ...formalEducationLevels.map((item) =>
        createEducationItemState({
          category: 'Formal Education',
          level: item.level,
        }),
      ),
      createEducationItemState({
        category: 'Training / Non-Formal',
      }),
    ],
    work_history: [createWorkHistoryItemState()],
    candidate_languages: ensureMinimumItemsState([], 3, createLanguageItemState),
    candidate_skills: ensureMinimumItemsState([], 3, createSkillItemState),
    candidate_references: [createReferenceItemState()],
    employee_payroll_profile: createEmployeePayrollProfileState(),
    employee_documents: employeeDocumentFieldKeys.reduce((documents, documentType) => {
      documents[documentType] = []
      return documents
    }, {} as CandidateFormRequest['employee_documents']),
    personal_statement: createPersonalStatementState(),
  }
}
