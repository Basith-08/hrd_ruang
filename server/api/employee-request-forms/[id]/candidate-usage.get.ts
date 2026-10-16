import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import { hasCandidateDataForEmployeeRequestForm } from "~~/server/services/candidateDatabaseReadService.js"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  if (!isAdminRole(context.roleName)) {
    requireAnyPermission(context, ["employee_request_form:delete"])
  }

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  let employeeRequestFormQuery = context.supabase
    .from("employee_request_form")
    .select("id")
    .eq("id", employeeRequestFormId)

  if (normalizeText(context.roleName).toLowerCase() === "manager" && context.userId) {
    employeeRequestFormQuery = employeeRequestFormQuery.eq("created_by", context.userId)
  }

  const { data: employeeRequestForm, error: employeeRequestFormError } = await employeeRequestFormQuery.maybeSingle()

  if (employeeRequestFormError) {
    throw new Error(employeeRequestFormError.message)
  }

  if (!employeeRequestForm) {
    throw createHttpError(404, "Job request data not found or inaccessible.")
  }

  return {
    has_candidate_forms: await hasCandidateDataForEmployeeRequestForm(employeeRequestFormId),
  }
})
