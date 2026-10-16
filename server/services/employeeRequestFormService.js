import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import {
  getCandidateSupabaseAdmin,
  isCandidateDatabaseConfigured,
} from "~~/server/services/candidateSupabaseAdmin.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function isManagerRole(roleName) {
  return normalizeText(roleName).toLowerCase() === "manager"
}

function normalizeDeleteError(error) {
  const message = normalizeText(error?.message).toLowerCase()
  if (message.includes("violates foreign key constraint")) {
    return createHttpError(
      409,
      "ERF cannot be deleted because some linked records could not be removed automatically.",
    )
  }

  return error
}

async function getAccessibleEmployeeRequestForm(context, employeeRequestFormId) {
  let query = context.supabase
    .from("employee_request_form")
    .select("id")
    .eq("id", employeeRequestFormId)

  if (isManagerRole(context.roleName) && context.userId) {
    query = query.eq("created_by", context.userId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Job request data not found or inaccessible.")
  }

  return data
}

async function deleteCandidateDependencies(employeeRequestFormId) {
  if (!isCandidateDatabaseConfigured()) {
    return
  }

  const candidateSupabase = getCandidateSupabaseAdmin()
  const { error: candidateFormError } = await candidateSupabase
    .from("candidate_form")
    .delete()
    .eq("employee_request_form_id", employeeRequestFormId)

  if (candidateFormError) {
    throw new Error(candidateFormError.message)
  }

  const { error: candidateApplicationError } = await candidateSupabase
    .from("candidate_applications")
    .delete()
    .eq("erf_id", employeeRequestFormId)

  if (candidateApplicationError) {
    throw new Error(candidateApplicationError.message)
  }
}

async function deleteLocalDependencies(context, employeeRequestFormId) {
  const { error: approvalChainError } = await context.supabase
    .from("approval_chains")
    .delete()
    .eq("employee_request_form_id", employeeRequestFormId)

  if (approvalChainError) {
    throw new Error(approvalChainError.message)
  }

  const { error: employeeContractFormError } = await context.supabase
    .from("employee_contract_form")
    .delete()
    .eq("employee_request_form_id", employeeRequestFormId)

  if (employeeContractFormError) {
    throw new Error(employeeContractFormError.message)
  }
}

export async function deleteEmployeeRequestForm(context, id) {
  if (!isAdminRole(context.roleName)) {
    requireAnyPermission(context, ["employee_request_form:delete"])
  }

  const employeeRequestFormId = normalizeText(id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  await getAccessibleEmployeeRequestForm(context, employeeRequestFormId)

  try {
    await deleteCandidateDependencies(employeeRequestFormId)
    await deleteLocalDependencies(context, employeeRequestFormId)

    let deleteQuery = context.supabase
      .from("employee_request_form")
      .delete()
      .eq("id", employeeRequestFormId)

    if (isManagerRole(context.roleName) && context.userId) {
      deleteQuery = deleteQuery.eq("created_by", context.userId)
    }

    const { data, error } = await deleteQuery.select("id")

    if (error) {
      throw new Error(error.message)
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw createHttpError(404, "Job request data not found or could not be deleted.")
    }
  } catch (error) {
    throw normalizeDeleteError(error)
  }
}
