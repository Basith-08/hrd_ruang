import { createHttpError } from "~~/server/lib/errors.js"
import { getJakartaTimestamp } from "~~/server/lib/time.js"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { isAdminRole, isStaffRole } from "~~/server/lib/utils.js"
import { getCandidateSupabaseAdmin } from "~~/server/services/candidateSupabaseAdmin.js"
import { listManagedCandidateUsersByEmployeeRequestFormIds } from "~~/server/services/candidateDatabaseReadService.js"
import {
  switchCandidateServiceAccountToEmployee,
  updateCandidateServiceAccount,
} from "~~/server/services/candidateServiceClient.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeDateKey(value) {
  const normalizedValue = normalizeText(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : ""
}

function normalizeNullableText(value) {
  return normalizeText(value) || null
}

function normalizeNullableDate(value) {
  return normalizeDateKey(value) || null
}

function buildAccessScope(context) {
  return {
    isStaff: isStaffRole(context.roleName),
    canReadAllContractForms: Boolean(context.permissions?.includes("employee_contract_form:read_all")),
    roleName: context.roleName,
    userId: context.userId,
  }
}

function mapEmployeeContractForm(record) {
  const employeeRequestForm = record?.employee_request_form
  const approvalUser = record?.approval_user

  return {
    id: normalizeText(record?.id),
    employee_request_form_id: normalizeText(record?.employee_request_form_id),
    candidate_id: normalizeText(record?.candidate_id),
    candidate_name: normalizeText(record?.candidate_name) || null,
    candidate_email: normalizeText(record?.candidate_email) || null,
    contract_number: normalizeText(record?.contract_number) || null,
    employee_code: normalizeText(record?.employee_code) || null,
    contract_start_date: normalizeDateKey(record?.contract_start_date) || null,
    contract_end_date: normalizeDateKey(record?.contract_end_date) || null,
    approval_user_id: normalizeText(record?.approval_user_id) || null,
    created_at: normalizeText(record?.created_at) || null,
    updated_at: normalizeText(record?.updated_at) || null,
    employee_request_form: employeeRequestForm && typeof employeeRequestForm === "object"
      ? {
          id: normalizeText(employeeRequestForm.id),
          department: normalizeText(employeeRequestForm.department_ref?.name) || null,
          main_position: normalizeText(employeeRequestForm.main_position) || null,
          position: normalizeText(
            employeeRequestForm.master_designation_ref?.name,
          ) || null,
          employment_status: normalizeText(employeeRequestForm.employment_status) || null,
        }
      : null,
    approval_user: approvalUser && typeof approvalUser === "object"
      ? {
          id: normalizeText(approvalUser.id),
          full_name: normalizeText(approvalUser.full_name) || null,
          email: normalizeText(approvalUser.email) || null,
          designation: normalizeText(
            approvalUser.master_designation_ref?.name,
          ) || null,
          main_position: normalizeText(approvalUser.main_position) || null,
        }
      : null,
  }
}

async function getEmployeeRequestFormMetadata(context, employeeRequestFormId) {
  const normalizedId = normalizeText(employeeRequestFormId)
  if (!normalizedId) {
    throw createHttpError(400, "Employee request form is required.")
  }

  const { data, error } = await context.supabase
    .from("employee_request_form")
    .select(`
      id,
      main_position,
      employment_status,
      department_ref:master_department(name),
      master_designation_ref:master_designation(name)
    `)
    .eq("id", normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Employee request form was not found.")
  }

  return data
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

async function getApprovalUser(context, approvalUserId) {
  const normalizedId = normalizeText(approvalUserId)
  if (!normalizedId) {
    throw createHttpError(400, "Approval user is required.")
  }

  const { data, error } = await context.supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Approval user was not found.")
  }

  return data
}

async function getLatestApprovalChainForEmployeeRequestForm(employeeRequestFormId) {
  const normalizedId = normalizeText(employeeRequestFormId)
  if (!normalizedId) {
    throw createHttpError(400, "Employee request form is required.")
  }

  const { data, error } = await getSupabaseAdmin()
    .from("approval_chains")
    .select(`
      id,
      employee_request_form_id,
      created_at,
      updated_at,
      steps:approval_steps(
        approver_email,
        approver_name,
        step_order
      )
    `)
    .eq("employee_request_form_id", normalizedId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

async function resolveEmployeeCandidate(context, employeeRequestFormId, candidateId) {
  const normalizedEmployeeRequestFormId = normalizeText(employeeRequestFormId)
  const normalizedCandidateId = normalizeText(candidateId)

  if (!normalizedCandidateId) {
    throw createHttpError(400, "Candidate is required.")
  }

  const candidates = await listManagedCandidateUsersByEmployeeRequestFormIds(
    buildAccessScope(context),
    [normalizedEmployeeRequestFormId],
  )

  const selectedCandidate = candidates.find(
    (candidate) => normalizeText(candidate?.id) === normalizedCandidateId,
  )

  if (!selectedCandidate) {
    throw createHttpError(
      400,
      "Selected candidate must be bound to the selected ERF.",
    )
  }

  return selectedCandidate
}

function validatePayload(input) {
  const employeeRequestFormId = normalizeText(input?.employee_request_form_id)
  const candidateId = normalizeText(input?.candidate_id)
  const contractNumber = normalizeNullableText(input?.contract_number)
  const employeeCode = normalizeText(input?.employee_code)
  const contractStartDate = normalizeNullableDate(input?.contract_start_date)
  const contractEndDate = normalizeNullableDate(input?.contract_end_date)
  const approvalUserId = normalizeNullableText(input?.approval_user_id)

  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form is required.")
  }

  if (!candidateId) {
    throw createHttpError(400, "Candidate is required.")
  }

  if (!employeeCode) {
    throw createHttpError(400, "Employee code is required.")
  }

  if (contractStartDate && contractEndDate && contractEndDate < contractStartDate) {
    throw createHttpError(400, "Contract end date must be on or after contract start date.")
  }

  return {
    employee_request_form_id: employeeRequestFormId,
    candidate_id: candidateId,
    contract_number: contractNumber,
    employee_code: employeeCode,
    contract_start_date: contractStartDate,
    contract_end_date: contractEndDate,
    approval_user_id: approvalUserId,
  }
}

async function getEmployeeContractFormRecord(context, id) {
  const normalizedId = normalizeText(id)
  if (!normalizedId) {
    throw createHttpError(400, "Employee contract form id is required.")
  }

  const { data, error } = await context.supabase
    .from("employee_contract_form")
    .select(`
      id,
      employee_request_form_id,
      candidate_id,
      candidate_name,
      candidate_email,
      contract_number,
      employee_code,
      contract_start_date,
      contract_end_date,
      approval_user_id,
      created_at,
      updated_at,
      employee_request_form:employee_request_form_id (
        id,
        main_position,
        employment_status,
        department_ref:master_department(name),
        master_designation_ref:master_designation(name)
      ),
      approval_user:approval_user_id (
        id,
        full_name,
        email,
        main_position,
        master_designation_ref:master_designation(name)
      )
    `)
    .eq("id", normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Employee contract form was not found.")
  }

  return data
}

async function syncCandidateAccount(candidateId, payload) {
  await switchCandidateServiceAccountToEmployee(candidateId)
  await updateCandidateServiceAccount(candidateId, {
    employee_code: payload.employee_code ?? null,
    contract_number: payload.contract_number ?? null,
  })
}

async function resetCandidateTransitionProgress(candidateId, employeeRequestFormId) {
  const normalizedCandidateId = normalizeText(candidateId)
  const normalizedEmployeeRequestFormId = normalizeText(employeeRequestFormId)
  if (!normalizedCandidateId || !normalizedEmployeeRequestFormId) {
    return
  }

  const candidateSupabase = getCandidateSupabaseAdmin()
  const { data: candidateForm, error: candidateFormError } = await candidateSupabase
    .from("candidate_form")
    .select("id")
    .eq("candidate_account_id", normalizedCandidateId)
    .eq("employee_request_form_id", normalizedEmployeeRequestFormId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (candidateFormError) {
    throw new Error(candidateFormError.message)
  }

  if (candidateForm) {
    const { error: candidateFormUpdateError } = await candidateSupabase
      .from("candidate_form")
      .update({
        completion_status: "in_progress",
        updated_at: getJakartaTimestamp(),
      })
      .eq("id", normalizeText(candidateForm.id))

    if (candidateFormUpdateError) {
      throw new Error(candidateFormUpdateError.message)
    }
  }

  const { error: applicationUpdateError } = await candidateSupabase
    .from("candidate_applications")
    .update({
      status: "in_progress",
      updated_at: getJakartaTimestamp(),
    })
    .eq("candidate_account_id", normalizedCandidateId)
    .eq("erf_id", normalizedEmployeeRequestFormId)

  if (applicationUpdateError) {
    throw new Error(applicationUpdateError.message)
  }
}

export async function listEmployeeContractForms(context) {
  requireAnyPermission(context, ["employee_contract_form:read"])

  const accessScope = buildAccessScope(context)

  let query = context.supabase
    .from("employee_contract_form")
    .select(`
      id,
      employee_request_form_id,
      candidate_id,
      candidate_name,
      candidate_email,
      contract_number,
      employee_code,
      contract_start_date,
      contract_end_date,
      approval_user_id,
      created_by,
      created_at,
      updated_at,
      employee_request_form:employee_request_form_id (
        id,
        main_position,
        employment_status,
        department_ref:master_department(name),
        master_designation_ref:master_designation(name)
      ),
      approval_user:approval_user_id (
        id,
        full_name,
        email,
        main_position,
        master_designation_ref:master_designation(name)
      )
    `)
    .order("created_at", { ascending: false })

  if (accessScope.isStaff && !accessScope.canReadAllContractForms && accessScope.userId) {
    query = query.eq("created_by", accessScope.userId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapEmployeeContractForm)
}

export async function getEmployeeContractForm(context, id) {
  requireAnyPermission(context, ["employee_contract_form:read"])
  return mapEmployeeContractForm(await getEmployeeContractFormRecord(context, id))
}

async function listEmployeeContractFormApprovalUsersInternal(context, employeeRequestFormId) {
  if (!normalizeText(employeeRequestFormId)) {
    throw createHttpError(400, "Employee request form is required.")
  }

  const supabase = getSupabaseAdmin()
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, main_position")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!profiles?.length) {
    return []
  }

  const profileIds = profiles.map((profile) => normalizeText(profile.id)).filter(Boolean)
  const { data: userRoles, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id, roles(name)")
    .in("user_id", profileIds)

  if (roleError) {
    throw new Error(roleError.message)
  }

  const roleNameByUserId = new Map(
    (userRoles ?? []).map((userRole) => [
      normalizeText(userRole.user_id),
      normalizeText(userRole?.roles?.name),
    ]),
  )

  return profiles
    .filter((profile) => {
      const roleName = roleNameByUserId.get(normalizeText(profile.id))
      return !isAdminRole(roleName)
    })
    .map((profile) => {
      return {
        id: normalizeText(profile.id),
        full_name: normalizeText(profile.full_name) || null,
        main_position: normalizeText(profile.main_position) || null,
      }
    })
}

export async function listEmployeeContractFormApprovalUsers(context, employeeRequestFormId) {
  requireAnyPermission(context, [
    "employee_contract_form:read",
    "employee_contract_form:create",
    "employee_contract_form:update",
  ])

  return listEmployeeContractFormApprovalUsersInternal(context, employeeRequestFormId)
}

async function ensureApprovalUserBelongsToEmployeeRequestForm(context, employeeRequestFormId, approvalUserId) {
  const normalizedApprovalUserId = normalizeText(approvalUserId)
  const approvalUsers = await listEmployeeContractFormApprovalUsersInternal(
    context,
    employeeRequestFormId,
  )
  const selectedApprovalUser = approvalUsers.find(
    (user) => normalizeText(user?.id) === normalizedApprovalUserId,
  )

  if (!selectedApprovalUser) {
    throw createHttpError(400, "Approval user must be an active non-admin user.")
  }

  return selectedApprovalUser
}

export async function createEmployeeContractForm(context, input) {
  requireAnyPermission(context, ["employee_contract_form:create"])

  const payload = validatePayload(input)
  const createDependencies = [
    getEmployeeRequestFormMetadata(context, payload.employee_request_form_id),
  ]
  if (payload.approval_user_id) {
    createDependencies.push(
      ensureApprovalUserBelongsToEmployeeRequestForm(
        context,
        payload.employee_request_form_id,
        payload.approval_user_id,
      ),
    )
  }
  await Promise.all(createDependencies)

  const selectedCandidate = await resolveEmployeeCandidate(
    context,
    payload.employee_request_form_id,
    payload.candidate_id,
  )

  await syncCandidateAccount(payload.candidate_id, payload)

  const insertPayload = {
    ...payload,
    candidate_name: normalizeText(selectedCandidate?.full_name) || normalizeText(selectedCandidate?.email) || null,
    candidate_email: normalizeText(selectedCandidate?.email) || null,
    created_by: context.userId,
    updated_by: context.userId,
  }

  const { data, error } = await context.supabase
    .from("employee_contract_form")
    .insert(insertPayload)
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw createHttpError(409, "A contract form for the selected candidate and ERF already exists.")
    }

    throw new Error(error.message)
  }

  await resetCandidateTransitionProgress(
    payload.candidate_id,
    payload.employee_request_form_id,
  )
  await syncRecruitmentFlowStage(context.supabase, payload.employee_request_form_id)
  return getEmployeeContractForm(context, data.id)
}

export async function updateEmployeeContractForm(context, id, input) {
  requireAnyPermission(context, ["employee_contract_form:update"])
  await getEmployeeContractFormRecord(context, id)

  const payload = validatePayload(input)
  const updateDependencies = [
    getEmployeeRequestFormMetadata(context, payload.employee_request_form_id),
  ]
  if (payload.approval_user_id) {
    updateDependencies.push(
      ensureApprovalUserBelongsToEmployeeRequestForm(
        context,
        payload.employee_request_form_id,
        payload.approval_user_id,
      ),
    )
  }
  await Promise.all(updateDependencies)

  const selectedCandidate = await resolveEmployeeCandidate(
    context,
    payload.employee_request_form_id,
    payload.candidate_id,
  )

  await syncCandidateAccount(payload.candidate_id, payload)

  const updatePayload = {
    ...payload,
    candidate_name: normalizeText(selectedCandidate?.full_name) || normalizeText(selectedCandidate?.email) || null,
    candidate_email: normalizeText(selectedCandidate?.email) || null,
    updated_by: context.userId,
  }

  const { error } = await context.supabase
    .from("employee_contract_form")
    .update(updatePayload)
    .eq("id", normalizeText(id))

  if (error) {
    if (error.code === "23505") {
      throw createHttpError(409, "A contract form for the selected candidate and ERF already exists.")
    }

    throw new Error(error.message)
  }

  await syncRecruitmentFlowStage(context.supabase, payload.employee_request_form_id)
  return getEmployeeContractForm(context, id)
}

export async function deleteEmployeeContractForm(context, id) {
  requireAnyPermission(context, ["employee_contract_form:delete"])
  const existingForm = await getEmployeeContractFormRecord(context, id)

  const { error } = await context.supabase
    .from("employee_contract_form")
    .delete()
    .eq("id", normalizeText(id))

  if (error) {
    throw new Error(error.message)
  }

  await syncRecruitmentFlowStage(
    context.supabase,
    normalizeText(existingForm.employee_request_form_id),
  )
}
