export function normalizeText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).trim()
  }

  return ''
}

export function formatDateIndonesian(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) {
    return ''
  }

  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) {
    return normalizedValue
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

export function sanitizeFileName(value: string | null | undefined) {
  const normalizedValue = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalizedValue || 'export'
}

function basicHumanizeFieldKey(fieldKey: string | null | undefined) {
  return normalizeText(fieldKey)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const exportFieldLabelMap: Record<string, string> = {
  agreement_date: 'Agreement Date',
  approval_user: 'Approval User',
  candidate_address: 'Candidate Address',
  candidate_contract_period: 'Candidate Contract Period',
  candidate_identity_card_number: 'Candidate Identity Card Number',
  candidate_name: 'Candidate Name',
  candidate_wage: 'Candidate Wage',
  contract_date: 'Contract Date',
  contract_end_date: 'Contract End Date',
  contract_number: 'Contract Number',
  contract_start_date: 'Contract Start Date',
  cost_center_pt: 'PT Name',
  cost_center_pt_address: 'PT Address',
  date_of_birth: 'Date of Birth',
  department: 'Department',
  employee_code: 'Employee Code',
  employment_status: 'Employment Status',
  identity_card_number: 'Identity Card Number',
  job_level: 'Job Level',
  main_position: 'Main Position',
  place_of_birth: 'Place of Birth',
  position_status: 'Position Status',
  probation_contract_period: 'Probation/Contract Period',
  user_approval: 'User Approval',
}

export function humanizeFieldKey(fieldKey: string | null | undefined) {
  const normalizedFieldKey = normalizeText(fieldKey)
  if (!normalizedFieldKey) {
    return ''
  }

  return exportFieldLabelMap[normalizedFieldKey] || basicHumanizeFieldKey(normalizedFieldKey)
}

export function resolveExportFieldLabel(fieldKey: string | null | undefined, currentLabel?: string | null) {
  const normalizedLabel = normalizeText(currentLabel)
  const normalizedFieldKey = normalizeText(fieldKey)

  if (!normalizedFieldKey) {
    return normalizedLabel
  }

  if (!normalizedLabel) {
    return humanizeFieldKey(normalizedFieldKey)
  }

  if (normalizedLabel === basicHumanizeFieldKey(normalizedFieldKey)) {
    return humanizeFieldKey(normalizedFieldKey)
  }

  return normalizedLabel
}
