import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { getJakartaTimestamp } from "~~/server/lib/time.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

const closeCategories = new Set(["canceled", "done", "employee hired"])

function normalizeCloseCategory(value: string) {
  if (value === "done") {
    return "employee hired"
  }

  return value
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  if (!isAdminRole(context.roleName)) {
    requireAnyPermission(context, ["employee_request_form:close"])
  }

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  const body = await readBody<{
    category?: string
    reason?: string
  }>(event)
  const category = normalizeCloseCategory(normalizeText(body?.category))
  const reason = normalizeText(body?.reason)

  if (!closeCategories.has(category)) {
    throw createHttpError(400, "Close category is not valid.")
  }

  if (!reason) {
    throw createHttpError(400, "Close reason is required.")
  }

  const { data, error } = await context.supabase
    .from("employee_request_form")
    .update({
      status: "closed",
      closed_date: new Date().toISOString(),
      closed_category: category,
      reason,
      updated_at: getJakartaTimestamp(),
    })
    .eq("id", employeeRequestFormId)
    .select("id")

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw createHttpError(404, "Job request data not found or could not be closed.")
  }

  await syncRecruitmentFlowStage(context.supabase, employeeRequestFormId)

  return { ok: true }
})
