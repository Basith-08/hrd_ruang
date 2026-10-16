import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized : null
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  if (!isAdminRole(context.roleName)) {
    requireAnyPermission(context, [
      "employee_request_form:update",
      "recruitment:vacancy_pipeline_detail",
      "recruitment:closed_vacancy_detail",
    ])
  }

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  const body = await readBody<{ notes?: string | null }>(event)
  if (body?.notes !== undefined && body?.notes !== null && typeof body.notes !== "string") {
    throw createHttpError(400, "Notes value is not valid.")
  }

  const notes = normalizeNullableText(body?.notes)

  const { data, error } = await context.supabase
    .from("employee_request_form")
    .update({
      notes,
    })
    .eq("id", employeeRequestFormId)
    .select("id")

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw createHttpError(404, "Job request data not found or inaccessible.")
  }

  return { ok: true, notes }
})
