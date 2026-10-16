import { createHttpError } from "~~/server/lib/errors.js"
import { getCandidateSupabaseAdmin, isCandidateDatabaseConfigured } from "~~/server/services/candidateSupabaseAdmin.js"
import { encodeCandidateServiceUserId } from "~~/server/services/candidateProjectionService.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"

const candidateServiceFormSelect = `
  *,
  family_and_emergency(*),
  education(*),
  work_history(*),
  personal_statement(*),
  employee_payroll_profile(*),
  employee_documents(*),
  candidate_languages(*),
  candidate_skills(*),
  candidate_references(*)
`

const candidateServiceFormListSelect = `
  id,
  application_id,
  candidate_account_id,
  employee_request_form_id,
  candidate_id,
  date_candidate_form,
  full_name,
  personal_email,
  phone_number,
  created_at,
  updated_at,
  photograph,
  completion_status,
  employee_payroll_profile(*),
  employee_documents(*)
`

const candidateServiceFormSummarySelect = `
  id,
  application_id,
  candidate_account_id,
  employee_request_form_id,
  created_at,
  updated_at,
  completion_status,
  employee_payroll_profile(*),
  employee_documents(*)
`

const candidateStatusSignalSelect = `
  application_id,
  employee_request_form_id,
  created_at,
  updated_at,
  completion_status,
  employee_payroll_profile(
    bank_name,
    bank_account_number,
    account_holder_name,
    branch_name,
    tax_identification_number,
    bpjs_health_enrollment_preference,
    bpjs_health_decline_reason,
    bpjs_health_decline_reason_other,
    bpjs_employment_status
  ),
  employee_documents(document_type, file_path)
`

const EMPLOYEE_DOCUMENT_TYPES = [
  "cv",
  "integrity_pact",
  "email_usage_policy",
  "identity_card",
  "family_card",
  "latest_diploma",
  "academic_transcript",
  "certificate_of_employment",
  "tax_id",
  "bpjs_health_card",
  "bpjs_health_statement",
  "bpjs_employment_card",
  "bank_account_book",
  "format_office",
  "skb",
  "other",
]
const CANDIDATE_DOCUMENT_TYPES = [
  "cv",
  "identity_card",
  "family_card",
  "latest_diploma",
  "academic_transcript",
  "certificate_of_employment",
]
const EMPLOYEE_ONLY_DOCUMENT_TYPES = EMPLOYEE_DOCUMENT_TYPES.filter(
  (documentType) => !CANDIDATE_DOCUMENT_TYPES.includes(documentType),
)
const EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES = ["format_office", "skb"]
const REQUIRED_EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES = ["format_office"]
const EMPLOYEE_DOCUMENT_LABELS = {
  cv: "CV",
  integrity_pact: "Integrity Pact",
  email_usage_policy: "Email Usage Policy",
  identity_card: "Identity Card (KTP/SIM)",
  family_card: "Family Card (KK)",
  latest_diploma: "Latest Degree Certificate",
  academic_transcript: "Academic Transcript",
  certificate_of_employment: "Certificate of Employment (CoE)",
  tax_id: "Tax Identification Number",
  bpjs_health_card: "BPJS Health Card",
  bpjs_health_statement: "BPJS Health Statement",
  bpjs_employment_card: "BPJS Employment Card",
  bank_account_book: "Bank Account Book",
  format_office: "Draft Employment Contract",
  skb: "SKB",
  other: "Lainnya",
  erf_document: "ERF Document",
}

export function getEmployeeDocumentBucket() {
  const runtimeConfig = typeof useRuntimeConfig === "function" ? useRuntimeConfig() : { public: {} }
  return (
    String(runtimeConfig.public?.employeeDocumentBucket ?? "").trim() ||
    String(runtimeConfig.public?.candidateDocumentBucket ?? "").trim() ||
    "candidate-documents"
  )
}

export function getErfDocumentBucket() {
  const runtimeConfig = typeof useRuntimeConfig === "function" ? useRuntimeConfig() : { public: {} }
  return String(runtimeConfig.public?.erfDocumentBucket ?? "").trim() || "erf"
}

async function listWorkspaceEmployeeDocumentFiles(ownerId, documentType) {
  const normalizedOwnerId = normalizeText(ownerId)
  const normalizedDocumentType = normalizeText(documentType)
  if (!normalizedOwnerId || !normalizedDocumentType) {
    return []
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const storage = supabaseAdmin?.storage
    if (!storage || typeof storage.from !== "function") {
      return []
    }

    const prefix = `employee-forms/${normalizedOwnerId}/${normalizedDocumentType}`
    const { data, error } = await storage.from(getEmployeeDocumentBucket()).list(prefix, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    })

    if (error) {
      console.error("Failed to list workspace employee documents:", error.message)
      return []
    }

    return (Array.isArray(data) ? data : [])
      .map((item) => normalizeText(item?.name))
      .filter((name) => name.length > 0 && !name.endsWith(".emptyFolderPlaceholder"))
      .map((name) => `${prefix}/${name}`)
  } catch (error) {
    console.error("Workspace employee document fallback is unavailable:", error)
    return []
  }
}

async function fillWorkspaceContractDocumentFallbacks(candidateForm) {
  if (!candidateForm || typeof candidateForm !== "object") {
    return candidateForm
  }

  const ownerId = normalizeText(
    candidateForm.candidate_service_candidate_id ??
    candidateForm.candidate_account_id ??
    candidateForm.candidate_id,
  )

  if (!ownerId) {
    return candidateForm
  }

  const currentEmployeeDocuments = normalizeEmployeeDocuments(candidateForm.employee_documents)
  let nextEmployeeDocuments = currentEmployeeDocuments
  let hasFallback = false

  for (const documentType of [...EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES, "other"]) {
    if (Array.isArray(currentEmployeeDocuments[documentType]) && currentEmployeeDocuments[documentType].length > 0) {
      continue
    }

    const fallbackFiles = await listWorkspaceEmployeeDocumentFiles(ownerId, documentType)
    if (!fallbackFiles.length) {
      continue
    }

    nextEmployeeDocuments = {
      ...nextEmployeeDocuments,
      [documentType]: fallbackFiles,
    }
    hasFallback = true
  }

  if (!hasFallback) {
    return candidateForm
  }

  return {
    ...candidateForm,
    employee_documents: nextEmployeeDocuments,
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function hasText(value) {
  return normalizeText(value).length > 0
}

function normalizePortalRole(value, fallback = "candidate") {
  const normalizedRole = normalizeText(value).toLowerCase()
  if (!normalizedRole) {
    return fallback
  }

  return ["candidate", "employee"].includes(normalizedRole) ? normalizedRole : fallback
}

function isCandidateFormSubmitted(form) {
  return normalizeText(form?.completion_status).toLowerCase() === "completed"
}

function readFirstNonEmptyString(source, keys) {
  if (!source || typeof source !== "object") {
    return null
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function buildFullName(fullName, ...parts) {
  return normalizeText(fullName) || parts.map(normalizeText).filter(Boolean).join(" ") || null
}

function normalizeJobSnapshot(jobSnapshot) {
  return jobSnapshot && typeof jobSnapshot === "object" ? jobSnapshot : {}
}

function readSnapshotText(snapshot, key) {
  const value = snapshot?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function compareTimestampDescending(left, right) {
  return String(right ?? "").localeCompare(String(left ?? ""))
}

function toTimestamp(value) {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) {
    return null
  }

  const timestamp = Date.parse(normalizedValue)
  return Number.isFinite(timestamp) ? timestamp : null
}

async function fetchEmployeeRequestFormMetadata(supabase, employeeRequestFormIds) {
  if (!employeeRequestFormIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("employee_request_form")
    .select(
      `
        id,
        site,
        main_position,
        department_id,
        master_designation_id,
        document_erf,
        pt:master_pt(name),
        department_ref:master_department(name),
        master_designation_ref:master_designation(name)
      `,
    )
    .in("id", employeeRequestFormIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map(
    (data ?? []).map((item) => [
      String(item.id ?? "").trim(),
      {
        site: item.site ?? null,
        department_id: item.department_id ?? null,
        master_designation_id: item.master_designation_id ?? null,
        pt_name: item.pt?.name ?? null,
        department_name: item.department_ref?.name ?? null,
        designation_name: item.master_designation_ref?.name ?? null,
        main_position: item.main_position ?? null,
        document_erf: Array.isArray(item.document_erf)
          ? item.document_erf.filter((path) => normalizeText(path))
          : [],
      },
    ]),
  )
}

function normalizeEducationLevel(value) {
  switch (value) {
    case "Elementary":
    case "SD":
    case "SD / Sederajat":
      return "SD / Sederajat"
    case "Junior High":
    case "SMP":
    case "SMP / MTs / Sederajat":
      return "SMP / MTs / Sederajat"
    case "Senior High":
    case "SMA":
    case "SMA / SMK / MA / Sederajat":
      return "SMA / SMK / MA / Sederajat"
    case "Diploma":
    case "Diploma I (D1)":
      return "Diploma I (D1)"
    case "Diploma II (D2)":
      return "Diploma II (D2)"
    case "Diploma III (D3)":
      return "Diploma III (D3)"
    case "Diploma IV (D4)":
      return "Diploma IV (D4)"
    case "Bachelor":
    case "S1":
    case "Sarjana (S1)":
      return "Sarjana (S1)"
    case "Master":
    case "S2":
    case "Magister (S2)":
      return "Magister (S2)"
    case "Doctorate":
    case "S3":
    case "Doktor (S3)":
      return "Doktor (S3)"
    default:
      return null
  }
}

function normalizeLanguageProficiency(value) {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "good":
      return "Good"
    case "fair":
      return "Fair"
    case "poor":
      return "Poor"
    default:
      return null
  }
}

function createEmptyEmployeeDocuments() {
  return EMPLOYEE_DOCUMENT_TYPES.reduce((documents, documentType) => {
    documents[documentType] = []
    return documents
  }, {})
}

function hasUploadedDraftContractDocuments(form) {
  const employeeDocuments = normalizeEmployeeDocuments(form?.employee_documents)

  return REQUIRED_EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES.every(
    (documentType) =>
      Array.isArray(employeeDocuments[documentType]) &&
      employeeDocuments[documentType].some((filePath) => hasText(filePath)),
  )
}

function resolveEffectiveCandidateFormCompletionStatus(form, application, account) {
  const storedCompletionStatus = normalizeText(form?.completion_status).toLowerCase() || "in_progress"

  if (normalizePortalRole(account?.portal_role) !== "employee") {
    return storedCompletionStatus === "completed" ? "completed" : "in_progress"
  }

  if (!form || storedCompletionStatus !== "completed") {
    return "in_progress"
  }

  const applicationSubmittedTimestamp = toTimestamp(application?.submitted_at)
  if (applicationSubmittedTimestamp === null) {
    return "in_progress"
  }

  const roleActivatedAt = toTimestamp(account?.activated_at ?? account?.created_at)
  if (
    roleActivatedAt !== null &&
    applicationSubmittedTimestamp < roleActivatedAt
  ) {
    return "in_progress"
  }

  return "completed"
}

function normalizeEmployeeDocuments(value) {
  const documents = createEmptyEmployeeDocuments()

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const documentType of EMPLOYEE_DOCUMENT_TYPES) {
      documents[documentType] = Array.isArray(value[documentType])
        ? value[documentType].map(normalizeText).filter(Boolean)
        : []
    }

    return documents
  }

  for (const item of Array.isArray(value) ? value : []) {
    const documentType = normalizeText(item?.document_type)
    const filePath = normalizeText(item?.file_path)

    if (!EMPLOYEE_DOCUMENT_TYPES.includes(documentType) || !filePath) {
      continue
    }

    documents[documentType].push(filePath)
  }

  return documents
}

function getVisibleEmployeeDocumentTypes(role) {
  return normalizeText(role).toLowerCase() === "employee"
    ? EMPLOYEE_DOCUMENT_TYPES
    : CANDIDATE_DOCUMENT_TYPES
}

function getEmployeeDocumentStorageSource(documentType) {
  return [...EMPLOYEE_DRAFT_CONTRACT_DOCUMENT_TYPES, "other"].includes(documentType)
    ? "dashboard"
    : "candidate_service"
}

function countEmployeeDocumentFiles(documents, role) {
  return getVisibleEmployeeDocumentTypes(role).reduce(
    (count, documentType) => count + (Array.isArray(documents?.[documentType]) ? documents[documentType].length : 0),
    0,
  )
}

function hasNonEmptyValue(value) {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return !Number.isNaN(value)
  }

  if (typeof value === "boolean") {
    return value
  }

  return false
}

function inferEmployeeRole(explicitRole, employeePayrollProfile, employeeDocuments) {
  const normalizedRole = normalizeText(explicitRole).toLowerCase()
  if (normalizedRole === "employee") {
    return "employee"
  }

  if (normalizedRole === "candidate") {
    return "candidate"
  }

  if (
    employeePayrollProfile &&
    typeof employeePayrollProfile === "object" &&
    Object.values(employeePayrollProfile).some((value) => hasNonEmptyValue(value))
  ) {
    return "employee"
  }

  if (
    employeeDocuments &&
    EMPLOYEE_ONLY_DOCUMENT_TYPES.some(
      (documentType) => Array.isArray(employeeDocuments?.[documentType]) && employeeDocuments[documentType].length > 0,
    )
  ) {
    return "employee"
  }

  return "candidate"
}

function normalizeCandidateForm(data) {
  const employeePayrollProfile = Array.isArray(data?.employee_payroll_profile)
    ? (data.employee_payroll_profile[0] ?? null)
    : (data?.employee_payroll_profile ?? null)
  const employeeDocuments = normalizeEmployeeDocuments(data?.employee_documents)
  const resolvedRole = inferEmployeeRole(data?.role, employeePayrollProfile, employeeDocuments)

  return {
    ...(data ?? {}),
    role: resolvedRole,
    completion_status: data?.completion_status ?? "in_progress",
    date_application: data?.date_candidate_form ?? data?.date_application ?? null,
    photograph: data?.photograph ?? null,
    full_name: buildFullName(
      data?.full_name,
      data?.first_name,
      data?.middle_name,
      data?.last_name,
    ),
    phone_number: data?.phone_number ?? data?.home_phone ?? null,
    available_start_date: data?.available_start_date ?? null,
    join_date: data?.join_date ?? null,
    transportation_type: data?.transportation_type ?? null,
    transportation_ownership: data?.transportation_ownership ?? null,
    residence_ownership: data?.residence_ownership ?? null,
    family_and_emergency: Array.isArray(data?.family_and_emergency) ? data.family_and_emergency : [],
    education: Array.isArray(data?.education)
      ? data.education.map((item) => ({
          ...item,
          level: normalizeEducationLevel(item?.level),
        }))
      : [],
    work_history: Array.isArray(data?.work_history) ? data.work_history : [],
    candidate_languages: Array.isArray(data?.candidate_languages)
      ? data.candidate_languages.map((item) => ({
          ...item,
          speaking: normalizeLanguageProficiency(item?.speaking),
          reading: normalizeLanguageProficiency(item?.reading),
          listening: normalizeLanguageProficiency(item?.listening),
          writing: normalizeLanguageProficiency(item?.writing),
        }))
      : [],
    candidate_skills: Array.isArray(data?.candidate_skills)
      ? [...data.candidate_skills].sort(
          (left, right) => Number(left?.skill_order ?? 0) - Number(right?.skill_order ?? 0),
        )
      : [],
    candidate_references: Array.isArray(data?.candidate_references)
      ? [...data.candidate_references].sort(
          (left, right) =>
            Number(left?.reference_order ?? 0) - Number(right?.reference_order ?? 0),
        )
      : [],
    employee_payroll_profile: employeePayrollProfile,
    employee_documents: employeeDocuments,
    personal_statement: Array.isArray(data?.personal_statement)
      ? (data.personal_statement[0] ?? null)
      : (data?.personal_statement ?? null),
  }
}

async function fetchApplicationMap(supabase, applicationIds) {
  if (!applicationIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .in("id", applicationIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((item) => [String(item.id ?? "").trim(), item]))
}

async function fetchAccountMap(supabase, accountIds) {
  if (!accountIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .select("id, identity_user_id, email, full_name, phone, status, portal_role, created_at, activated_at")
    .in("id", accountIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((item) => [String(item.id ?? "").trim(), item]))
}

async function fetchAccountsByIdentityUserIds(supabase, identityUserIds) {
  if (!identityUserIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("candidate_accounts")
    .select("id, identity_user_id, email, full_name, phone, status, portal_role, personal_data, created_by_internal_user_id, last_login_at, created_at, updated_at, activated_at")
    .in("identity_user_id", identityUserIds)

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

async function fetchApplicationsByAccountIds(supabase, accountIds) {
  if (!accountIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .in("candidate_account_id", accountIds)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

async function fetchApplicationsByEmployeeRequestFormIds(supabase, employeeRequestFormIds) {
  if (!employeeRequestFormIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .in("erf_id", employeeRequestFormIds)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

async function fetchCandidateFormMapByApplicationIds(
  supabase,
  applicationIds,
  select = candidateServiceFormSelect,
) {
  if (!applicationIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("candidate_form")
    .select(select)
    .in("application_id", applicationIds)

  if (error) {
    throw new Error(error.message)
  }

  const sortedForms = [...(data ?? [])].sort((left, right) =>
    compareTimestampDescending(
      left?.updated_at ?? left?.created_at,
      right?.updated_at ?? right?.created_at,
    ),
  )

  const formMap = new Map()
  for (const item of sortedForms) {
    const applicationId = String(item.application_id ?? "").trim()
    if (!applicationId || formMap.has(applicationId)) {
      continue
    }

    formMap.set(applicationId, item)
  }

  return formMap
}

async function fetchCandidateApplications(supabase) {
  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

async function fetchDirectCandidateForms() {
  const supabase = getCandidateSupabaseAdmin()
  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateServiceFormSelect)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

async function fetchCandidateFormByApplicationId(supabase, applicationId) {
  const normalizedApplicationId = normalizeText(applicationId)
  if (!normalizedApplicationId) {
    return null
  }

  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateServiceFormSelect)
    .eq("application_id", normalizedApplicationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

async function fetchCandidateFormByCandidateAccountId(supabase, candidateAccountId) {
  const normalizedCandidateAccountId = normalizeText(candidateAccountId)
  if (!normalizedCandidateAccountId) {
    return null
  }

  const { data, error } = await supabase
    .from("candidate_form")
    .select(candidateServiceFormSelect)
    .eq("candidate_account_id", normalizedCandidateAccountId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

async function fetchApplicationByCandidateAccountId(supabase, candidateAccountId) {
  const normalizedCandidateAccountId = normalizeText(candidateAccountId)
  if (!normalizedCandidateAccountId) {
    return null
  }

  const { data, error } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .eq("candidate_account_id", normalizedCandidateAccountId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

function groupApplicationsByAccountId(applications) {
  const groups = new Map()

  for (const application of applications ?? []) {
    const accountId = String(application?.candidate_account_id ?? "").trim()
    if (!accountId) {
      continue
    }

    const current = groups.get(accountId) ?? []
    current.push(application)
    groups.set(accountId, current)
  }

  for (const accountApplications of groups.values()) {
    accountApplications.sort((left, right) =>
      compareTimestampDescending(
        left?.updated_at ?? left?.submitted_at ?? left?.created_at,
        right?.updated_at ?? right?.submitted_at ?? right?.created_at,
      ),
    )
  }

  return groups
}

function pickPrimaryApplication(applications) {
  return Array.isArray(applications) && applications.length > 0
    ? applications[0]
    : null
}

function buildManagedCandidateUser(account, primaryApplication, primaryForm, employeeRequestForm) {
  const personalData =
    account?.personal_data && typeof account.personal_data === "object"
      ? account.personal_data
      : null
  const jobSnapshot = normalizeJobSnapshot(primaryApplication?.job_snapshot)
  const employeeCode = readFirstNonEmptyString(personalData, [
    "employee_code",
    "employee_number",
    "employee_no",
    "no_karyawan",
    "no_pegawai",
    "nik",
  ])
  const completionStatus = resolveEffectiveCandidateFormCompletionStatus(
    primaryForm,
    primaryApplication,
    account,
  )

  return {
    id: encodeCandidateServiceUserId(account.id),
    account_source: "candidate_service",
    email: account.email ?? "",
    username: null,
    full_name: account.full_name ?? primaryForm?.full_name ?? null,
    phone: account.phone ?? primaryForm?.phone_number ?? null,
    employee_request_form_id:
      primaryForm?.employee_request_form_id ??
      primaryApplication?.erf_id ??
      null,
    department_id:
      String(jobSnapshot.department_id ?? "").trim() ||
      (employeeRequestForm?.department_id ?? null),
    master_designation_id:
      String(jobSnapshot.designation_id ?? "").trim() ||
      (employeeRequestForm?.master_designation_id ?? null),
    personal_data: personalData,
    first_name: account.full_name ?? primaryForm?.full_name ?? null,
    middle_name: null,
    last_name: null,
    main_position:
      readSnapshotText(jobSnapshot, "main_position") ??
      employeeRequestForm?.main_position ??
      null,
    hire_location: primaryForm?.hire_location ?? null,
    date_of_birth: primaryForm?.date_of_birth ?? null,
    place_of_birth: primaryForm?.place_of_birth ?? null,
    nationality: primaryForm?.nationality ?? null,
    marital_status: primaryForm?.marital_status ?? null,
    religion: primaryForm?.religion ?? null,
    gender: primaryForm?.gender ?? null,
    ethnic: primaryForm?.ethnic ?? null,
    blood_type: primaryForm?.blood_type ?? null,
    no_id: primaryForm?.id_no ?? null,
    employee_code: employeeCode,
    department:
      readSnapshotText(jobSnapshot, "department_name") ??
      employeeRequestForm?.department_name ??
      null,
    designation:
      readSnapshotText(jobSnapshot, "designation_name") ??
      employeeRequestForm?.designation_name ??
      null,
    employment_type: null,
    employment_start_date: null,
    emergency_contact_name: null,
    emergency_contact_phone: account.phone ?? primaryForm?.phone_number ?? null,
    custom_grup_1_id: null,
    custom_grup_2_id: null,
    custom_grup_3_id: null,
    custom_grup_4_id: null,
    custom_grup_5_id: null,
    custom_grup_6_id: null,
    is_active: normalizeText(account.status).toLowerCase() === "active",
    role: normalizeText(account.portal_role) || "candidate",
    role_id: null,
    created_at: account.created_at ?? null,
    activated_at: account.activated_at ?? account.created_at ?? null,
    updated_at: account.updated_at ?? null,
    last_login_at: account.last_login_at ?? null,
    candidate_form_id: primaryForm?.id ?? null,
    candidate_form_completion_status: primaryForm ? completionStatus : null,
    candidate_form_created_at: primaryForm?.created_at ?? null,
    candidate_form_updated_at: primaryForm?.updated_at ?? null,
    candidate_form_is_submitted: primaryForm
      ? isCandidateFormSubmitted(primaryForm)
      : false,
    candidate_form_has_contract_documents: primaryForm
      ? hasUploadedDraftContractDocuments(primaryForm)
      : false,
  }
}

async function buildManagedCandidateUsers(accounts, dashboardSupabase) {
  if (!accounts.length) {
    return []
  }

  const candidateSupabase = getCandidateSupabaseAdmin()
  const accountIds = accounts.map((item) => String(item.id ?? "").trim()).filter(Boolean)
  const applications = await fetchApplicationsByAccountIds(candidateSupabase, accountIds)
  const applicationsByAccountId = groupApplicationsByAccountId(applications)
  const candidateFormMap = await fetchCandidateFormMapByApplicationIds(
    candidateSupabase,
    applications.map((item) => String(item.id ?? "").trim()).filter(Boolean),
  )
  const employeeRequestFormIds = [
    ...new Set(
      applications
        .map((item) => String(item.erf_id ?? "").trim())
        .filter(Boolean),
    ),
  ]
  const employeeRequestFormMap = await fetchEmployeeRequestFormMetadata(
    dashboardSupabase,
    employeeRequestFormIds,
  )

  return accounts.map((account) => {
    const accountApplications = applicationsByAccountId.get(String(account.id ?? "").trim()) ?? []
    const primaryApplication = pickPrimaryApplication(accountApplications)
    const primaryForm = primaryApplication
      ? candidateFormMap.get(String(primaryApplication.id ?? "").trim()) ?? null
      : null
    const employeeRequestForm =
      employeeRequestFormMap.get(
        String(primaryForm?.employee_request_form_id ?? primaryApplication?.erf_id ?? "").trim(),
      ) ?? null

    return buildManagedCandidateUser(
      account,
      primaryApplication,
      primaryForm,
      employeeRequestForm,
    )
  })
}

function isAccessible(accessScope, application, account) {
  if (accessScope.isAdmin) {
    return true
  }

  if (accessScope.isCandidate && accessScope.userId) {
    return String(account?.identity_user_id ?? "").trim() === accessScope.userId
  }

  if (accessScope.isManager) {
    return accessScope.employeeRequestFormIds.includes(String(application?.erf_id ?? "").trim())
  }

  return true
}

function mapDirectCandidateForm(form, application, account, employeeRequestForm) {
  const normalizedForm = normalizeCandidateForm(form)
  const jobSnapshot = normalizeJobSnapshot(application?.job_snapshot)
  const personalData =
    account?.personal_data && typeof account.personal_data === "object"
      ? account.personal_data
      : null
  const fullName = buildFullName(
    normalizedForm.full_name,
    normalizedForm.first_name,
    normalizedForm.middle_name,
    normalizedForm.last_name,
  )
  const completionStatus = resolveEffectiveCandidateFormCompletionStatus(
    normalizedForm,
    application,
    account,
  )

  return normalizeCandidateForm({
    ...normalizedForm,
    id: form.id,
    candidate_source: "candidate_service",
    candidate_service_form_id: form.id,
    candidate_service_application_id: form.application_id ?? null,
    candidate_service_candidate_id: form.candidate_account_id ?? null,
    candidate_service_identity_user_id: account?.identity_user_id ?? form.candidate_id ?? null,
    role: normalizeText(form.role) || normalizePortalRole(account?.portal_role) || "candidate",
    employee_request_form_id: form.employee_request_form_id ?? application?.erf_id ?? null,
    candidate_id: account?.identity_user_id ?? form.candidate_id ?? null,
    completion_status: completionStatus,
    employee_code: readFirstNonEmptyString(personalData, [
      "employee_code",
      "employee_number",
      "employee_no",
      "no_karyawan",
      "no_pegawai",
      "nik",
    ]),
    full_name: fullName ?? account?.full_name ?? null,
    personal_email: form.personal_email ?? account?.email ?? null,
    phone_number: form.phone_number ?? account?.phone ?? null,
    employee_payroll_profile: normalizedForm.employee_payroll_profile ?? null,
    employee_documents: normalizedForm.employee_documents ?? createEmptyEmployeeDocuments(),
    employee_request_form: {
      id: form.employee_request_form_id ?? application?.erf_id ?? null,
      pt_name:
        readSnapshotText(jobSnapshot, "pt_name") ??
        employeeRequestForm?.pt_name ??
        null,
      department:
        readSnapshotText(jobSnapshot, "department_name") ??
        employeeRequestForm?.department_name ??
        null,
      main_position:
        readSnapshotText(jobSnapshot, "main_position") ??
        employeeRequestForm?.main_position ??
        null,
      site:
        readSnapshotText(jobSnapshot, "site") ??
        employeeRequestForm?.site ??
        null,
      document_erf: employeeRequestForm?.document_erf ?? [],
    },
  })
}

function mapCandidateFormListItem(form, application, account, employeeRequestForm) {
  const jobSnapshot = normalizeJobSnapshot(application?.job_snapshot)
  const employeeRequestFormId = form?.employee_request_form_id ?? application?.erf_id ?? null
  const personalData =
    account?.personal_data && typeof account.personal_data === "object"
      ? account.personal_data
      : null

  return {
    id: form?.id ?? application?.id ?? "",
    application_id: form?.application_id ?? application?.id ?? null,
    candidate_account_id:
      form?.candidate_account_id ??
      application?.candidate_account_id ??
      account?.id ??
      null,
    candidate_source: "candidate_service",
    candidate_service_form_id: form?.id ?? null,
    candidate_service_application_id: form?.application_id ?? application?.id ?? null,
    candidate_service_candidate_id:
      form?.candidate_account_id ??
      application?.candidate_account_id ??
      account?.id ??
      null,
    candidate_service_identity_user_id: account?.identity_user_id ?? form?.candidate_id ?? null,
    role: normalizeText(account?.portal_role) || "candidate",
    employee_request_form_id: employeeRequestFormId,
    candidate_id: account?.identity_user_id ?? form?.candidate_id ?? null,
    employee_code: readFirstNonEmptyString(personalData, [
      "employee_code",
      "employee_number",
      "employee_no",
      "no_karyawan",
      "no_pegawai",
      "nik",
    ]),
    completion_status: resolveEffectiveCandidateFormCompletionStatus(form, application, account),
    date_application: form?.date_candidate_form ?? application?.submitted_at ?? null,
    photograph: form?.photograph ?? null,
    full_name:
      buildFullName(form?.full_name) ||
      normalizeText(account?.full_name) ||
      null,
    personal_email: form?.personal_email ?? account?.email ?? null,
    phone_number: form?.phone_number ?? account?.phone ?? null,
    created_at: form?.created_at ?? application?.created_at ?? null,
    updated_at: form?.updated_at ?? application?.updated_at ?? null,
    employee_request_form: {
      id: employeeRequestFormId,
      pt_name:
        readSnapshotText(jobSnapshot, "pt_name") ??
        employeeRequestForm?.pt_name ??
        null,
      department:
        readSnapshotText(jobSnapshot, "department_name") ??
        employeeRequestForm?.department_name ??
        null,
      main_position:
        readSnapshotText(jobSnapshot, "main_position") ??
        employeeRequestForm?.main_position ??
        null,
      site:
        readSnapshotText(jobSnapshot, "site") ??
        employeeRequestForm?.site ??
        null,
    },
  }
}

function mapCandidateApplicationFallback(application, account, employeeRequestForm) {
  const jobSnapshot = normalizeJobSnapshot(application?.job_snapshot)
  const personalData =
    account?.personal_data && typeof account.personal_data === "object"
      ? account.personal_data
      : null

  return normalizeCandidateForm({
    id: application.id,
    candidate_source: "candidate_service",
    candidate_service_form_id: null,
    candidate_service_application_id: application.id ?? null,
    candidate_service_candidate_id: application.candidate_account_id ?? null,
    candidate_service_identity_user_id: account?.identity_user_id ?? null,
    role: account?.portal_role ?? "candidate",
    employee_request_form_id: application.erf_id ?? null,
    candidate_id: account?.identity_user_id ?? null,
    employee_code: readFirstNonEmptyString(personalData, [
      "employee_code",
      "employee_number",
      "employee_no",
      "no_karyawan",
      "no_pegawai",
      "nik",
    ]),
    completion_status: "in_progress",
    full_name: account?.full_name ?? null,
    personal_email: account?.email ?? null,
    phone_number: account?.phone ?? null,
    created_at: application.created_at ?? null,
    updated_at: application.updated_at ?? null,
    family_and_emergency: [],
    education: [],
    work_history: [],
    candidate_languages: [],
    candidate_skills: [],
    candidate_references: [],
    personal_statement: null,
    employee_payroll_profile: null,
    employee_documents: createEmptyEmployeeDocuments(),
    employee_request_form: {
      id: application.erf_id ?? null,
      pt_name:
        readSnapshotText(jobSnapshot, "pt_name") ??
        employeeRequestForm?.pt_name ??
        null,
      department:
        readSnapshotText(jobSnapshot, "department_name") ??
        employeeRequestForm?.department_name ??
        null,
      main_position:
        readSnapshotText(jobSnapshot, "main_position") ??
        employeeRequestForm?.main_position ??
        null,
      site:
        readSnapshotText(jobSnapshot, "site") ??
        employeeRequestForm?.site ??
        null,
      document_erf: employeeRequestForm?.document_erf ?? [],
    },
  })
}

export async function listCandidateFormsFromCandidateDatabase(accessScope) {
  const supabase = getCandidateSupabaseAdmin()
  const applications = await fetchCandidateApplications(supabase)
  if (!applications.length) {
    return []
  }

  const applicationIds = applications.map((item) => String(item.id ?? "").trim()).filter(Boolean)
  const accountIds = [...new Set(applications.map((item) => String(item.candidate_account_id ?? "").trim()).filter(Boolean))]
  const employeeRequestFormIds = [
    ...new Set(applications.map((item) => String(item.erf_id ?? "").trim()).filter(Boolean)),
  ]
  const [candidateFormMap, accountMap, employeeRequestFormMap] = await Promise.all([
    fetchCandidateFormMapByApplicationIds(
      supabase,
      applicationIds,
      candidateServiceFormListSelect,
    ),
    fetchAccountMap(supabase, accountIds),
    fetchEmployeeRequestFormMetadata(getSupabaseAdmin(), employeeRequestFormIds),
  ])

  return applications
    .map((application) => {
      const account = accountMap.get(String(application.candidate_account_id ?? "").trim()) ?? null

      if (!isAccessible(accessScope, application, account)) {
        return null
      }

      const candidateForm = candidateFormMap.get(String(application.id ?? "").trim()) ?? null
      const employeeRequestForm =
        employeeRequestFormMap.get(
          String(candidateForm?.employee_request_form_id ?? application.erf_id ?? "").trim(),
        ) ?? null

      return mapCandidateFormListItem(candidateForm, application, account, employeeRequestForm)
    })
    .filter(Boolean)
}

export async function countCandidateFormsFromCandidateDatabase(accessScope) {
  const supabase = getCandidateSupabaseAdmin()
  const applications = await fetchCandidateApplications(supabase)
  if (!applications.length) {
    return 0
  }

  const accountIds = [
    ...new Set(applications.map((item) => String(item.candidate_account_id ?? "").trim()).filter(Boolean)),
  ]
  const accountMap = await fetchAccountMap(supabase, accountIds)

  let count = 0

  for (const application of applications) {
    const account = accountMap.get(String(application.candidate_account_id ?? "").trim()) ?? null

    if (isAccessible(accessScope, application, account)) {
      count += 1
    }
  }

  return count
}

export async function getCandidateFormFromCandidateDatabase(candidateFormId, accessScope) {
  const supabase = getCandidateSupabaseAdmin()
  const { data: form, error: formError } = await supabase
    .from("candidate_form")
    .select(candidateServiceFormSelect)
    .eq("id", candidateFormId)
    .maybeSingle()

  if (formError) {
    throw new Error(formError.message)
  }

  if (form) {
    const [applicationMap, accountMap, employeeRequestFormMap] = await Promise.all([
      fetchApplicationMap(supabase, [String(form.application_id ?? "").trim()].filter(Boolean)),
      fetchAccountMap(supabase, [String(form.candidate_account_id ?? "").trim()].filter(Boolean)),
      fetchEmployeeRequestFormMetadata(
        getSupabaseAdmin(),
        [String(form.employee_request_form_id ?? "").trim()].filter(Boolean),
      ),
    ])

    const application = applicationMap.get(String(form.application_id ?? "").trim()) ?? null
    const account = accountMap.get(String(form.candidate_account_id ?? "").trim()) ?? null

    if (!isAccessible(accessScope, application, account)) {
      return null
    }

    return fillWorkspaceContractDocumentFallbacks(mapDirectCandidateForm(
      form,
      application,
      account,
      employeeRequestFormMap.get(String(form.employee_request_form_id ?? "").trim()) ?? null,
    ))
  }

  const candidateFormByAccountId = await fetchCandidateFormByCandidateAccountId(
    supabase,
    candidateFormId,
  )

  if (candidateFormByAccountId) {
    const [applicationMap, accountMap, employeeRequestFormMap] = await Promise.all([
      fetchApplicationMap(
        supabase,
        [String(candidateFormByAccountId.application_id ?? "").trim()].filter(Boolean),
      ),
      fetchAccountMap(
        supabase,
        [String(candidateFormByAccountId.candidate_account_id ?? "").trim()].filter(Boolean),
      ),
      fetchEmployeeRequestFormMetadata(
        getSupabaseAdmin(),
        [String(candidateFormByAccountId.employee_request_form_id ?? "").trim()].filter(Boolean),
      ),
    ])

    const application =
      applicationMap.get(String(candidateFormByAccountId.application_id ?? "").trim()) ?? null
    const account =
      accountMap.get(String(candidateFormByAccountId.candidate_account_id ?? "").trim()) ?? null

    if (!isAccessible(accessScope, application, account)) {
      return null
    }

    return fillWorkspaceContractDocumentFallbacks(mapDirectCandidateForm(
      candidateFormByAccountId,
      application,
      account,
      employeeRequestFormMap.get(
        String(candidateFormByAccountId.employee_request_form_id ?? "").trim(),
      ) ?? null,
    ))
  }

  let { data: application, error: applicationError } = await supabase
    .from("candidate_applications")
    .select("id, candidate_account_id, erf_id, status, job_snapshot, submitted_at, created_at, updated_at")
    .eq("id", candidateFormId)
    .maybeSingle()

  if (applicationError) {
    throw new Error(applicationError.message)
  }

  if (!application) {
    application = await fetchApplicationByCandidateAccountId(supabase, candidateFormId)
  }

  if (!application) {
    return null
  }

  const [accountMap, employeeRequestFormMap, candidateFormByApplicationId] = await Promise.all([
    fetchAccountMap(supabase, [String(application.candidate_account_id ?? "").trim()].filter(Boolean)),
    fetchEmployeeRequestFormMetadata(
      getSupabaseAdmin(),
      [String(application.erf_id ?? "").trim()].filter(Boolean),
    ),
    fetchCandidateFormByApplicationId(supabase, application.id),
  ])

  const account = accountMap.get(String(application.candidate_account_id ?? "").trim()) ?? null

  if (!isAccessible(accessScope, application, account)) {
    return null
  }

  if (candidateFormByApplicationId) {
    return fillWorkspaceContractDocumentFallbacks(mapDirectCandidateForm(
      candidateFormByApplicationId,
      application,
      account,
      employeeRequestFormMap.get(String(application.erf_id ?? "").trim()) ?? null,
    ))
  }

  return mapCandidateApplicationFallback(
    application,
    account,
    employeeRequestFormMap.get(String(application.erf_id ?? "").trim()) ?? null,
  )
}

export async function listManagedCandidateUsersFromCandidateDatabase(accessScope, dashboardSupabase) {
  const supabase = getCandidateSupabaseAdmin()
  let query = supabase
    .from("candidate_accounts")
    .select("id, identity_user_id, email, full_name, phone, status, portal_role, personal_data, created_by, updated_by, created_by_internal_user_id, last_login_at, created_at, updated_at, activated_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (accessScope?.isStaff && !accessScope?.canReadAllCandidates && accessScope?.userId) {
    query = query.or(
      `created_by.eq.${accessScope.userId},created_by_internal_user_id.eq.${accessScope.userId}`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return buildManagedCandidateUsers(data ?? [], dashboardSupabase)
}

export async function listManagedCandidateUsersByEmployeeRequestFormIds(
  accessScope,
  employeeRequestFormIds,
) {
  const normalizedEmployeeRequestFormIds = [
    ...new Set((Array.isArray(employeeRequestFormIds) ? employeeRequestFormIds : [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)),
  ]

  if (!normalizedEmployeeRequestFormIds.length) {
    return []
  }

  const supabase = getCandidateSupabaseAdmin()
  const applications = await fetchApplicationsByEmployeeRequestFormIds(
    supabase,
    normalizedEmployeeRequestFormIds,
  )

  if (!applications.length) {
    return []
  }

  const accountIds = [
    ...new Set(applications.map((item) => String(item.candidate_account_id ?? "").trim()).filter(Boolean)),
  ]

  let accountQuery = supabase
    .from("candidate_accounts")
    .select("id, identity_user_id, email, full_name, phone, status, portal_role, created_at, activated_at, created_by, created_by_internal_user_id")
    .in("id", accountIds)
    .eq("status", "active")

  if (accessScope?.isStaff && accessScope?.userId) {
    accountQuery = accountQuery.or(
      `created_by.eq.${accessScope.userId},created_by_internal_user_id.eq.${accessScope.userId}`,
    )
  }

  const { data: accounts, error: accountError } = await accountQuery

  if (accountError) {
    throw new Error(accountError.message)
  }

  const accountMap = new Map(
    (accounts ?? []).map((account) => [String(account.id ?? "").trim(), account]),
  )
  const visibleApplications = applications.filter((application) =>
    accountMap.has(String(application.candidate_account_id ?? "").trim()),
  )

  if (!visibleApplications.length) {
    return []
  }

  const candidateFormMap = await fetchCandidateFormMapByApplicationIds(
    supabase,
    visibleApplications.map((item) => String(item.id ?? "").trim()).filter(Boolean),
    candidateServiceFormSummarySelect,
  )

  return visibleApplications.map((application) => {
    const account = accountMap.get(String(application.candidate_account_id ?? "").trim()) ?? null
    const candidateForm = candidateFormMap.get(String(application.id ?? "").trim()) ?? null

    return {
      id: String(account?.id ?? candidateForm?.candidate_account_id ?? application.candidate_account_id ?? "").trim(),
      candidate_service_application_id:
        String(application.id ?? "").trim() || null,
      candidate_service_candidate_id:
        String(account?.id ?? candidateForm?.candidate_account_id ?? application.candidate_account_id ?? "").trim() || null,
      employee_request_form_id:
        String(candidateForm?.employee_request_form_id ?? application.erf_id ?? "").trim() || null,
      role:
        String(account?.portal_role ?? "candidate").trim() || "candidate",
      full_name:
        String(candidateForm?.full_name ?? account?.full_name ?? "").trim() || null,
      email:
        String(candidateForm?.personal_email ?? account?.email ?? "").trim() || null,
      candidate_form_completion_status:
        candidateForm
          ? resolveEffectiveCandidateFormCompletionStatus(candidateForm, application, account)
          : null,
      candidate_form_created_at:
        String(candidateForm?.created_at ?? "").trim() || null,
      candidate_form_updated_at:
        String(candidateForm?.updated_at ?? "").trim() || null,
      candidate_form_is_submitted:
        candidateForm
          ? isCandidateFormSubmitted(candidateForm)
          : false,
      candidate_form_has_contract_documents:
        candidateForm
          ? hasUploadedDraftContractDocuments(candidateForm)
          : false,
    }
  })
}

export async function listCandidateStatusSignalsByEmployeeRequestFormIds(
  accessScope,
  employeeRequestFormIds,
) {
  const normalizedEmployeeRequestFormIds = [
    ...new Set((Array.isArray(employeeRequestFormIds) ? employeeRequestFormIds : [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)),
  ]

  if (!normalizedEmployeeRequestFormIds.length) {
    return []
  }

  const supabase = getCandidateSupabaseAdmin()
  const applications = await fetchApplicationsByEmployeeRequestFormIds(
    supabase,
    normalizedEmployeeRequestFormIds,
  )

  if (!applications.length) {
    return []
  }

  const accountIds = [
    ...new Set(applications.map((item) => String(item.candidate_account_id ?? "").trim()).filter(Boolean)),
  ]

  let accountQuery = supabase
    .from("candidate_accounts")
    .select("id, status, portal_role, created_by, created_by_internal_user_id")
    .in("id", accountIds)
    .eq("status", "active")

  if (accessScope?.isStaff && accessScope?.userId) {
    accountQuery = accountQuery.or(
      `created_by.eq.${accessScope.userId},created_by_internal_user_id.eq.${accessScope.userId}`,
    )
  }

  const { data: accounts, error: accountError } = await accountQuery

  if (accountError) {
    throw new Error(accountError.message)
  }

  const accountMap = new Map(
    (accounts ?? []).map((account) => [String(account.id ?? "").trim(), account]),
  )
  const visibleApplications = applications.filter((application) =>
    accountMap.has(String(application.candidate_account_id ?? "").trim()),
  )

  if (!visibleApplications.length) {
    return []
  }

  const candidateFormMap = await fetchCandidateFormMapByApplicationIds(
    supabase,
    visibleApplications.map((item) => String(item.id ?? "").trim()).filter(Boolean),
    candidateStatusSignalSelect,
  )

  return visibleApplications.map((application) => {
    const account = accountMap.get(String(application.candidate_account_id ?? "").trim()) ?? null
    const candidateForm = candidateFormMap.get(String(application.id ?? "").trim()) ?? null

    return {
      employee_request_form_id:
        String(candidateForm?.employee_request_form_id ?? application.erf_id ?? "").trim() || null,
      role:
        String(account?.portal_role ?? "candidate").trim() || "candidate",
      candidate_form_completion_status:
        candidateForm
          ? resolveEffectiveCandidateFormCompletionStatus(candidateForm, application, account)
          : null,
      candidate_form_created_at:
        String(candidateForm?.created_at ?? "").trim() || null,
      candidate_form_updated_at:
        String(candidateForm?.updated_at ?? "").trim() || null,
      candidate_form_is_submitted:
        candidateForm
          ? isCandidateFormSubmitted(candidateForm)
          : false,
      candidate_form_has_contract_documents:
        candidateForm
          ? hasUploadedDraftContractDocuments(candidateForm)
          : false,
    }
  })
}

export async function getManagedCandidateUserFromCandidateDatabase(candidateId, dashboardSupabase) {
  const normalizedCandidateId = normalizeText(candidateId)
  if (!normalizedCandidateId) {
    return null
  }

  const supabase = getCandidateSupabaseAdmin()
  const { data, error } = await supabase
    .from("candidate_accounts")
    .select("id, identity_user_id, email, full_name, phone, status, portal_role, personal_data, created_by, updated_by, created_by_internal_user_id, last_login_at, created_at, updated_at, activated_at")
    .eq("id", normalizedCandidateId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const [managedUser] = await buildManagedCandidateUsers([data], dashboardSupabase)
  return managedUser ?? null
}

export async function assertStaffCanManageCandidateAccount(candidateId, accessScope) {
  if (!accessScope?.isStaff || !accessScope?.userId) {
    return
  }

  const supabase = getCandidateSupabaseAdmin()
  const { data, error } = await supabase
    .from("candidate_accounts")
    .select("id, created_by, created_by_internal_user_id")
    .eq("id", candidateId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Candidate account was not found.")
  }

  const creatorId =
    String(data.created_by ?? "").trim() || String(data.created_by_internal_user_id ?? "").trim()

  if (creatorId !== accessScope.userId) {
    throw createHttpError(403, "You can only manage candidate accounts that you created.")
  }
}

export async function listCandidateBindingsByIdentityUserIdsFromCandidateDatabase(identityUserIds) {
  const normalizedIdentityUserIds = (identityUserIds ?? [])
    .map((value) => normalizeText(value))
    .filter(Boolean)

  if (!normalizedIdentityUserIds.length) {
    return new Map()
  }

  const supabase = getCandidateSupabaseAdmin()
  const accounts = await fetchAccountsByIdentityUserIds(supabase, normalizedIdentityUserIds)
  if (!accounts.length) {
    return new Map()
  }

  const applications = await fetchApplicationsByAccountIds(
    supabase,
    accounts.map((item) => String(item.id ?? "").trim()).filter(Boolean),
  )
  const applicationsByAccountId = groupApplicationsByAccountId(applications)
  const candidateFormMap = await fetchCandidateFormMapByApplicationIds(
    supabase,
    applications.map((item) => String(item.id ?? "").trim()).filter(Boolean),
  )
  const accountIdByIdentityUserId = new Map(
    accounts.map((item) => [String(item.identity_user_id ?? "").trim(), String(item.id ?? "").trim()]),
  )
  const bindings = new Map()

  for (const identityUserId of normalizedIdentityUserIds) {
    const accountId = accountIdByIdentityUserId.get(identityUserId)
    const primaryApplication = pickPrimaryApplication(applicationsByAccountId.get(accountId) ?? [])
    const primaryForm = primaryApplication
      ? candidateFormMap.get(String(primaryApplication.id ?? "").trim()) ?? null
      : null
    const completionStatus = primaryForm
      ? resolveEffectiveCandidateFormCompletionStatus(primaryForm, primaryApplication, null)
      : null

    bindings.set(identityUserId, {
      employee_request_form_id: primaryForm?.employee_request_form_id ?? primaryApplication?.erf_id ?? null,
      candidate_form_id: primaryForm?.id ?? null,
      candidate_form_completion_status: completionStatus,
      candidate_form_created_at: primaryForm?.created_at ?? null,
      candidate_form_updated_at: primaryForm?.updated_at ?? null,
      candidate_form_is_submitted: primaryForm
        ? isCandidateFormSubmitted(primaryForm)
        : false,
      candidate_form_has_contract_documents: primaryForm
        ? hasUploadedDraftContractDocuments(primaryForm)
        : false,
    })
  }

  return bindings
}

export async function loadCandidateUserHistoryFromCandidateDatabase(accessScope) {
  const supabase = getCandidateSupabaseAdmin()
  let query = supabase
    .from("candidate_accounts")
    .select("id, email, full_name, status, portal_role, created_by, updated_by, created_by_internal_user_id, created_at, activated_at, updated_at")
    .neq("status", "active")
    .order("created_at", { ascending: false })

  if (accessScope?.isStaff && !accessScope?.canReadAllCandidates && accessScope?.userId) {
    query = query.or(
      `created_by.eq.${accessScope.userId},created_by_internal_user_id.eq.${accessScope.userId}`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const applications = await fetchApplicationsByAccountIds(
    supabase,
    (data ?? []).map((item) => String(item.id ?? "").trim()).filter(Boolean),
  )
  const applicationsByAccountId = groupApplicationsByAccountId(applications)

  return (data ?? []).map((account) => {
    const primaryApplication = pickPrimaryApplication(
      applicationsByAccountId.get(String(account.id ?? "").trim()) ?? [],
    )
    const jobSnapshot = normalizeJobSnapshot(primaryApplication?.job_snapshot)

    return {
      id: encodeCandidateServiceUserId(account.id),
      account_source: "candidate_service",
      email: account.email ?? null,
      username: null,
      full_name: account.full_name ?? null,
      role: normalizeText(account.portal_role) || "candidate",
      main_position: readSnapshotText(jobSnapshot, "main_position"),
      created_at: account.created_at ?? null,
      activated_at: account.activated_at ?? account.created_at ?? null,
      is_active: false,
    }
  })
}

export async function getEmployeeRequestFormCandidateUsageFromCandidateDatabase(employeeRequestFormId) {
  const normalizedEmployeeRequestFormId = normalizeText(employeeRequestFormId)
  if (!normalizedEmployeeRequestFormId) {
    return {
      candidateApplicationCount: 0,
      candidateFormCount: 0,
    }
  }

  const supabase = getCandidateSupabaseAdmin()
  const [
    { count: candidateApplicationCount, error: candidateApplicationError },
    { count: candidateFormCount, error: candidateFormError },
  ] = await Promise.all([
    supabase
      .from("candidate_applications")
      .select("id", { count: "exact", head: true })
      .eq("erf_id", normalizedEmployeeRequestFormId),
    supabase
      .from("candidate_form")
      .select("id", { count: "exact", head: true })
      .eq("employee_request_form_id", normalizedEmployeeRequestFormId),
  ])

  if (candidateApplicationError) {
    throw new Error(candidateApplicationError.message)
  }

  if (candidateFormError) {
    throw new Error(candidateFormError.message)
  }

  return {
    candidateApplicationCount: Number(candidateApplicationCount ?? 0),
    candidateFormCount: Number(candidateFormCount ?? 0),
  }
}

export async function hasCandidateDataForEmployeeRequestForm(employeeRequestFormId) {
  const usage = await getEmployeeRequestFormCandidateUsageFromCandidateDatabase(employeeRequestFormId)

  return usage.candidateApplicationCount > 0 || usage.candidateFormCount > 0
}

export async function listCandidateDocumentExplorerItemsFromCandidateDatabase(
  accessScope,
  dashboardSupabase,
) {
  const forms = await fetchDirectCandidateForms()
  if (!forms.length) {
    return []
  }

  const supabase = getCandidateSupabaseAdmin()
  const applicationIds = [...new Set(forms.map((item) => String(item.application_id ?? "").trim()).filter(Boolean))]
  const accountIds = [...new Set(forms.map((item) => String(item.candidate_account_id ?? "").trim()).filter(Boolean))]
  const employeeRequestFormIds = [...new Set(forms.map((item) => String(item.employee_request_form_id ?? "").trim()).filter(Boolean))]
  const [applicationMap, accountMap, employeeRequestFormMap] = await Promise.all([
    fetchApplicationMap(supabase, applicationIds),
    fetchAccountMap(supabase, accountIds),
    fetchEmployeeRequestFormMetadata(dashboardSupabase, employeeRequestFormIds),
  ])

  return forms
    .map((form) => {
      const application = applicationMap.get(String(form.application_id ?? "").trim()) ?? null
      const account = accountMap.get(String(form.candidate_account_id ?? "").trim()) ?? null
      const employeeRequestForm =
        employeeRequestFormMap.get(String(form.employee_request_form_id ?? application?.erf_id ?? "").trim()) ??
        null

      if (!isAccessible(accessScope, application, account)) {
        return null
      }

      const jobSnapshot = normalizeJobSnapshot(application?.job_snapshot)
      const candidateName =
        buildFullName(form.full_name, form.first_name, form.middle_name, form.last_name) ||
        normalizeText(account?.full_name) ||
        "Unnamed Candidate"
      const employeeDocuments = normalizeEmployeeDocuments(form.employee_documents)
      const photograph = normalizeText(form.photograph) || null
      const role = normalizeText(form.role) || account?.portal_role || "candidate"
      const documents = getVisibleEmployeeDocumentTypes(role).map((documentType) => ({
        key: documentType,
        label: EMPLOYEE_DOCUMENT_LABELS[documentType] ?? documentType,
        bucket: getEmployeeDocumentBucket(),
        files: employeeDocuments[documentType] ?? [],
        storage_source: getEmployeeDocumentStorageSource(documentType),
      }))

      const erfDocumentFiles = employeeRequestForm?.document_erf ?? []
      if (erfDocumentFiles.length > 0) {
        documents.push({
          key: "erf_document",
          label: EMPLOYEE_DOCUMENT_LABELS.erf_document,
          bucket: getErfDocumentBucket(),
          files: erfDocumentFiles,
          storage_source: "dashboard",
        })
      }

      if (
        !photograph &&
        countEmployeeDocumentFiles(employeeDocuments, role) === 0 &&
        erfDocumentFiles.length === 0
      ) {
        return null
      }

      return {
        id: String(form.id ?? ""),
        storage_source: "candidate_service",
        role,
        candidate_id: account?.identity_user_id ?? form.candidate_id ?? null,
        candidate_name: candidateName,
        candidate_email: account?.email ?? null,
        personal_email: form.personal_email ?? null,
        phone_number: form.phone_number ?? account?.phone ?? null,
        photograph,
        pt_name: readSnapshotText(jobSnapshot, "pt_name") ?? employeeRequestForm?.pt_name ?? null,
        department_name:
          readSnapshotText(jobSnapshot, "department_name") ??
          employeeRequestForm?.department_name ??
          null,
        designation_name:
          readSnapshotText(jobSnapshot, "designation_name") ??
          employeeRequestForm?.designation_name ??
          null,
        main_position:
          readSnapshotText(jobSnapshot, "main_position") ??
          employeeRequestForm?.main_position ??
          null,
        created_at: form.created_at ?? null,
        updated_at: form.updated_at ?? null,
        documents,
      }
    })
    .filter(Boolean)
}

export { isCandidateDatabaseConfigured }
