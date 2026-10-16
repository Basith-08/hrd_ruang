import { createHttpError } from '~~/server/lib/errors.js'
import {
  getCandidateFormForDashboard,
  listCandidateFormsForDashboard,
} from '~~/server/services/candidateFormReadService.js'
import type {
  ExportCandidateRecord,
  ExportTemplateFieldRecord,
  PreparedExportField,
} from '~~/types/export-template'
import {
  formatDateIndonesian,
  normalizeText,
  resolveExportFieldLabel,
  sanitizeFileName,
} from './export-utils'

type CandidateFormLike = {
  id?: string | null
  candidate_account_id?: string | null
  candidate_id?: string | null
  employee_request_form_id?: string | null
  full_name?: string | null
  residential_address?: string | null
  id_card_address?: string | null
  place_of_birth?: string | null
  date_of_birth?: string | null
  id_no?: string | null
  join_date?: string | null
  available_start_date?: string | null
  employee_request_form?: {
    main_position?: string | null
  } | null
}

type EmployeeRequestFormMetadata = {
  id?: string
  site: string
  employment_status: string
  direct_manager: string
  periode_probation: string
  bu_id: string
  business_unit: string
  department_id: string
  master_designation_id: string
  pt_name: string
  pt_address: string
  department_name: string
  designation_name: string
  main_position: string
}

type EmployeeContractFormMetadata = {
  id?: string
  contract_number: string
  employee_code: string
  contract_start_date: string
  contract_end_date: string
  approval_user_id: string
  approval_user_name: string
  approval_user_email: string
  approval_user_main_position: string
  approval_user_designation: string
}

type ExportCandidateSourceScope = Record<string, unknown>

type PreparedExportCandidate = {
  candidate: ExportCandidateRecord
  sourceScope: ExportCandidateSourceScope
}

export async function loadEmployeeRequestFormMetadataMap(
  supabase: any,
  employeeRequestFormIds: string[],
) {
  const normalizedIds = [
    ...new Set(employeeRequestFormIds.map((item) => normalizeText(item)).filter(Boolean)),
  ]
  if (!normalizedIds.length) {
    return new Map<string, EmployeeRequestFormMetadata>()
  }

  const { data, error } = await supabase
    .from('employee_request_form')
    .select(
      `
      id,
      site,
      main_position,
      employment_status,
      direct_manager,
      periode_probation,
      bu_id,
      department_id,
      master_designation_id,
      pt:master_pt(name, address),
      department_ref:master_department(name),
      master_designation_ref:master_designation(name)
    `,
    )
    .in('id', normalizedIds)

  if (error) {
    throw new Error(error.message)
  }

  const businessUnitIds = [
    ...new Set(
      (Array.isArray(data) ? data : [])
        .map((item: any) => normalizeText(item?.bu_id))
        .filter(Boolean),
    ),
  ]

  const businessUnitNameById = new Map<string, string>()
  if (businessUnitIds.length > 0) {
    const { data: businessUnits, error: businessUnitError } = await supabase
      .from('master_bu')
      .select('id, name')
      .in('id', businessUnitIds)

    if (businessUnitError) {
      throw new Error(businessUnitError.message)
    }

    for (const businessUnit of businessUnits ?? []) {
      const businessUnitId = normalizeText((businessUnit as any)?.id)
      const businessUnitName = normalizeText((businessUnit as any)?.name)
      if (businessUnitId && businessUnitName) {
        businessUnitNameById.set(businessUnitId, businessUnitName)
      }
    }
  }

  return new Map<string, EmployeeRequestFormMetadata>(
    (Array.isArray(data) ? data : []).map((item: any) => [
      normalizeText(item?.id),
      {
        id: normalizeText(item?.id),
        site: normalizeText(item?.site),
        employment_status: normalizeText(item?.employment_status),
        direct_manager: normalizeText(item?.direct_manager),
        periode_probation: normalizeText(item?.periode_probation),
        bu_id: normalizeText(item?.bu_id),
        business_unit: businessUnitNameById.get(normalizeText(item?.bu_id)) || '',
        department_id: normalizeText(item?.department_id),
        master_designation_id: normalizeText(item?.master_designation_id),
        pt_name: normalizeText(item?.pt?.name),
        pt_address: normalizeText(item?.pt?.address),
        department_name: normalizeText(item?.department_ref?.name),
        designation_name: normalizeText(item?.master_designation_ref?.name),
        main_position: normalizeText(item?.main_position),
      },
    ]),
  )
}

async function loadEmployeeContractFormMetadataMap(
  supabase: any,
  candidateForms: CandidateFormLike[],
) {
  const employeeRequestFormIds = [
    ...new Set(
      candidateForms.map((item) => normalizeText(item?.employee_request_form_id)).filter(Boolean),
    ),
  ]
  const candidateAccountIds = [
    ...new Set(
      candidateForms
        .flatMap((item) => [
          normalizeText(item?.candidate_account_id),
          normalizeText(item?.candidate_id),
        ])
        .filter(Boolean),
    ),
  ]

  if (!employeeRequestFormIds.length || !candidateAccountIds.length) {
    return new Map<string, EmployeeContractFormMetadata>()
  }

  const { data, error } = await supabase
    .from('employee_contract_form')
    .select(
      `
      id,
      employee_request_form_id,
      candidate_id,
      contract_number,
      employee_code,
      contract_start_date,
      contract_end_date,
      approval_user_id,
      approval_user:approval_user_id (
        id,
        full_name,
        email,
        main_position,
        master_designation_ref:master_designation(name)
      )
    `,
    )
    .in('employee_request_form_id', employeeRequestFormIds)
    .in('candidate_id', candidateAccountIds)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const metadataMap = new Map<string, EmployeeContractFormMetadata>()
  for (const item of Array.isArray(data) ? data : []) {
    const mapKey = [
      normalizeText((item as any)?.employee_request_form_id),
      normalizeText((item as any)?.candidate_id),
    ].join(':')

    if (!mapKey || metadataMap.has(mapKey)) {
      continue
    }

    metadataMap.set(mapKey, {
      id: normalizeText((item as any)?.id),
      contract_number: normalizeText((item as any)?.contract_number),
      employee_code: normalizeText((item as any)?.employee_code),
      contract_start_date: formatDateIndonesian((item as any)?.contract_start_date),
      contract_end_date: formatDateIndonesian((item as any)?.contract_end_date),
      approval_user_id: normalizeText((item as any)?.approval_user_id),
      approval_user_name: normalizeText((item as any)?.approval_user?.full_name),
      approval_user_email: normalizeText((item as any)?.approval_user?.email),
      approval_user_main_position: normalizeText((item as any)?.approval_user?.main_position),
      approval_user_designation: normalizeText(
        (item as any)?.approval_user?.master_designation_ref?.name,
      ),
    })
  }

  return metadataMap
}

async function buildExportCandidatesFromForms(supabase: any, candidateForms: CandidateFormLike[]) {
  const employeeRequestFormMetadataMap = await loadEmployeeRequestFormMetadataMap(
    supabase,
    candidateForms.map((item) => normalizeText(item?.employee_request_form_id)),
  )

  return candidateForms
    .map((candidateForm) =>
      buildExportCandidateRecord(
        candidateForm,
        employeeRequestFormMetadataMap.get(
          normalizeText(candidateForm?.employee_request_form_id),
        ) ?? null,
      ),
    )
    .filter((candidate) => candidate.id)
}

export async function listExportCandidates(context: any) {
  const candidateForms = await listCandidateFormsForDashboard(context)
  return buildExportCandidatesFromForms(context.supabase, candidateForms as CandidateFormLike[])
}

export async function getExportCandidateById(context: any, candidateId: string) {
  const normalizedCandidateId = normalizeText(candidateId)
  if (!normalizedCandidateId) {
    throw createHttpError(400, 'Candidate id is required.')
  }

  const candidateForm = await getCandidateFormForDashboard(context, normalizedCandidateId)
  if (!candidateForm) {
    throw createHttpError(404, 'Candidate was not found.')
  }

  const candidates = await buildExportCandidatesFromForms(context.supabase, [
    candidateForm as CandidateFormLike,
  ])
  const candidate = candidates[0] ?? null

  if (!candidate) {
    throw createHttpError(404, 'Candidate was not found.')
  }

  return candidate
}

function buildEmployeeRequestFormSource(
  candidateForm: CandidateFormLike,
  employeeRequestFormMetadata?: EmployeeRequestFormMetadata | null,
) {
  return {
    id:
      normalizeText(employeeRequestFormMetadata?.id) ||
      normalizeText(candidateForm?.employee_request_form_id),
    main_position:
      normalizeText(employeeRequestFormMetadata?.main_position) ||
      normalizeText(candidateForm?.employee_request_form?.main_position),
    site: normalizeText(employeeRequestFormMetadata?.site),
    employment_status: normalizeText(employeeRequestFormMetadata?.employment_status),
    direct_manager: normalizeText(employeeRequestFormMetadata?.direct_manager),
    periode_probation: normalizeText(employeeRequestFormMetadata?.periode_probation),
    bu_id: normalizeText(employeeRequestFormMetadata?.bu_id),
    business_unit: normalizeText(employeeRequestFormMetadata?.business_unit),
    department_id: normalizeText(employeeRequestFormMetadata?.department_id),
    master_designation_id: normalizeText(employeeRequestFormMetadata?.master_designation_id),
    pt_name: normalizeText(employeeRequestFormMetadata?.pt_name),
    pt_address: normalizeText(employeeRequestFormMetadata?.pt_address),
    department_name: normalizeText(employeeRequestFormMetadata?.department_name),
    designation_name: normalizeText(employeeRequestFormMetadata?.designation_name),
  }
}

function buildEmployeeContractFormSource(
  employeeContractFormMetadata?: EmployeeContractFormMetadata | null,
) {
  return {
    id: normalizeText(employeeContractFormMetadata?.id),
    contract_number: normalizeText(employeeContractFormMetadata?.contract_number),
    employee_code: normalizeText(employeeContractFormMetadata?.employee_code),
    contract_start_date: normalizeText(employeeContractFormMetadata?.contract_start_date),
    contract_end_date: normalizeText(employeeContractFormMetadata?.contract_end_date),
    approval_user_id: normalizeText(employeeContractFormMetadata?.approval_user_id),
    approval_user_name: normalizeText(employeeContractFormMetadata?.approval_user_name),
    approval_user_email: normalizeText(employeeContractFormMetadata?.approval_user_email),
    approval_user_main_position: normalizeText(
      employeeContractFormMetadata?.approval_user_main_position,
    ),
    approval_user_designation: normalizeText(
      employeeContractFormMetadata?.approval_user_designation,
    ),
  }
}

function buildExportCandidateSourceScope(
  candidate: ExportCandidateRecord,
  candidateForm: CandidateFormLike,
  employeeRequestFormMetadata?: EmployeeRequestFormMetadata | null,
  employeeContractFormMetadata?: EmployeeContractFormMetadata | null,
): ExportCandidateSourceScope {
  return {
    ...candidate,
    candidate,
    candidate_form: candidateForm,
    employee_request_form: buildEmployeeRequestFormSource(
      candidateForm,
      employeeRequestFormMetadata,
    ),
    employee_contract_form: buildEmployeeContractFormSource(employeeContractFormMetadata),
  }
}

export async function getPreparedExportCandidateById(
  context: any,
  candidateId: string,
): Promise<PreparedExportCandidate> {
  const normalizedCandidateId = normalizeText(candidateId)
  if (!normalizedCandidateId) {
    throw createHttpError(400, 'Candidate id is required.')
  }

  const candidateForm = await getCandidateFormForDashboard(context, normalizedCandidateId)
  if (!candidateForm) {
    throw createHttpError(404, 'Candidate was not found.')
  }

  const employeeRequestFormMetadataMap = await loadEmployeeRequestFormMetadataMap(
    context.supabase,
    [normalizeText(candidateForm?.employee_request_form_id)].filter(Boolean),
  )
  const employeeContractFormMetadataMap = await loadEmployeeContractFormMetadataMap(
    context.supabase,
    [candidateForm as CandidateFormLike],
  )
  const employeeRequestFormMetadata =
    employeeRequestFormMetadataMap.get(normalizeText(candidateForm?.employee_request_form_id)) ??
    null
  const employeeContractFormMetadata =
    employeeContractFormMetadataMap.get(
      [
        normalizeText(candidateForm?.employee_request_form_id),
        normalizeText((candidateForm as CandidateFormLike)?.candidate_account_id) ||
          normalizeText((candidateForm as CandidateFormLike)?.candidate_id),
      ].join(':'),
    ) ?? null
  const candidate = buildExportCandidateRecord(
    candidateForm as CandidateFormLike,
    employeeRequestFormMetadata,
  )

  if (!candidate.id) {
    throw createHttpError(404, 'Candidate was not found.')
  }

  return {
    candidate,
    sourceScope: buildExportCandidateSourceScope(
      candidate,
      candidateForm as CandidateFormLike,
      employeeRequestFormMetadata,
      employeeContractFormMetadata,
    ),
  }
}

export function buildExportCandidateRecord(
  candidateForm: CandidateFormLike,
  employeeRequestFormMetadata?: EmployeeRequestFormMetadata | null,
): ExportCandidateRecord {
  return {
    id: normalizeText(candidateForm?.id),
    candidate_name: normalizeText(candidateForm?.full_name),
    candidate_address:
      normalizeText(candidateForm?.residential_address) ||
      normalizeText(candidateForm?.id_card_address),
    place_of_birth: normalizeText(candidateForm?.place_of_birth),
    date_of_birth: formatDateIndonesian(candidateForm?.date_of_birth),
    identity_card_number: normalizeText(candidateForm?.id_no),
    agreement_date:
      formatDateIndonesian(candidateForm?.join_date) ||
      formatDateIndonesian(candidateForm?.available_start_date),
    main_position:
      normalizeText(employeeRequestFormMetadata?.main_position) ||
      normalizeText(candidateForm?.employee_request_form?.main_position),
    job_level: normalizeText(employeeRequestFormMetadata?.designation_name),
    department: normalizeText(employeeRequestFormMetadata?.department_name),
    cost_center_pt: normalizeText(employeeRequestFormMetadata?.pt_name),
    cost_center_pt_address: normalizeText(employeeRequestFormMetadata?.pt_address),
  }
}

function readValueByPath(source: unknown, sourcePath: string) {
  const normalizedSourcePath = normalizeText(sourcePath)
  if (!normalizedSourcePath) {
    return {
      exists: false,
      value: '',
    }
  }

  const segments = normalizedSourcePath
    .split('.')
    .map((segment) => normalizeText(segment))
    .filter(Boolean)

  let current: unknown = source
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return {
          exists: false,
          value: '',
        }
      }

      current = current[index]
      continue
    }

    if (!current || typeof current !== 'object' || !(segment in current)) {
      return {
        exists: false,
        value: '',
      }
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return {
    exists: true,
    value: current,
  }
}

function resolveCandidateValue(
  candidate: ExportCandidateRecord,
  fieldKey: string,
  sourcePath?: string | null,
  sourceScope?: ExportCandidateSourceScope,
) {
  const normalizedSourcePath = normalizeText(sourcePath)
  if (normalizedSourcePath && sourceScope) {
    const resolvedFromPath = readValueByPath(sourceScope, normalizedSourcePath)
    if (resolvedFromPath.exists) {
      return {
        exists: true,
        value: String(resolvedFromPath.value ?? ''),
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(candidate, fieldKey)) {
    return {
      exists: true,
      value: String(candidate[fieldKey as keyof ExportCandidateRecord] ?? ''),
    }
  }

  return {
    exists: false,
    value: '',
  }
}

export function buildPreparedExportFields(
  fields: ExportTemplateFieldRecord[],
  candidate: ExportCandidateRecord,
  sourceScope?: ExportCandidateSourceScope,
): PreparedExportField[] {
  return fields.map((field) => {
    const resolved = resolveCandidateValue(
      candidate,
      field.field_key,
      field.source_path,
      sourceScope,
    )
    const value = normalizeText(resolved.value) || normalizeText(field.default_value)
    const status = resolved.exists ? (value ? 'auto_filled' : 'manual_required') : 'manual'

    return {
      field_key: field.field_key,
      field_label: resolveExportFieldLabel(field.field_key, field.field_label),
      value,
      status,
      is_editable: field.is_editable,
      is_required: field.is_required,
      field_type: field.field_type,
      source_path: field.source_path,
    }
  })
}

export function validateGeneratePayload(
  fields: ExportTemplateFieldRecord[],
  payload: Record<string, unknown>,
) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createHttpError(400, 'Payload is required.')
  }

  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalizeText(value)]),
  )

  const missingRequiredFields = fields
    .filter((field) => field.is_required)
    .filter((field) => !normalizeText(normalizedPayload[field.field_key]))
    .map((field) => resolveExportFieldLabel(field.field_key, field.field_label))

  if (missingRequiredFields.length > 0) {
    throw createHttpError(400, `Required field(s) are empty: ${missingRequiredFields.join(', ')}`)
  }

  return normalizedPayload
}

export function buildGeneratedExportFileName(candidateName: string) {
  const today = new Date()
  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('')

  return `export-${sanitizeFileName(candidateName)}-${dateKey}.docx`
}
