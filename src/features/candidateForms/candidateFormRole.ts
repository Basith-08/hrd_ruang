import type {
  CandidateForm,
  EmployeeDocumentFieldKey,
  PortalRole,
} from '@/domain/entities/CandidateForm'

const employeeOnlyDocumentKeys: EmployeeDocumentFieldKey[] = [
  'integrity_pact',
  'email_usage_policy',
  'tax_id',
  'bpjs_health_card',
  'bpjs_health_statement',
  'bpjs_employment_card',
  'bank_account_book',
  'other',
]

function hasNonEmptyValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  if (typeof value === 'boolean') return value
  return false
}

export function resolveCandidateFormRole(candidate: CandidateForm | null | undefined): PortalRole {
  const explicitRole = String(candidate?.role ?? '')
    .trim()
    .toLowerCase()

  if (explicitRole === 'employee') return 'employee'
  if (explicitRole === 'candidate') return 'candidate'

  const payrollProfile = candidate?.employee_payroll_profile
  if (
    payrollProfile
    && Object.values(payrollProfile).some((value) => hasNonEmptyValue(value))
  ) {
    return 'employee'
  }

  const employeeDocuments = candidate?.employee_documents
  if (
    employeeDocuments
    && employeeOnlyDocumentKeys.some((key) => (employeeDocuments[key] ?? []).length > 0)
  ) {
    return 'employee'
  }

  return 'candidate'
}

export function candidateRoleLabel(candidate: CandidateForm | null | undefined) {
  return resolveCandidateFormRole(candidate) === 'employee' ? 'employee' : 'candidate'
}

export function candidateRoleBadge(candidate: CandidateForm | null | undefined) {
  return resolveCandidateFormRole(candidate) === 'employee'
    ? 'app-badge-role app-badge-role-employee'
    : 'app-badge-role app-badge-role-candidate'
}
