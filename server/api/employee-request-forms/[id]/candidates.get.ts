import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { isStaffRole } from "~~/server/lib/utils.js"
import { listManagedCandidateUsersFromCandidateDatabase } from "~~/server/services/candidateDatabaseReadService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ["employee_request_form:close"])

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  const candidates = await listManagedCandidateUsersFromCandidateDatabase(
    {
      isStaff: isStaffRole(context.roleName),
      roleName: context.roleName,
      userId: context.userId,
    },
    context.supabase,
  )

  return {
    candidates: candidates.filter((candidate) => {
      return (
        normalizeText(candidate?.employee_request_form_id) === employeeRequestFormId &&
        normalizeText(candidate?.role).toLowerCase() === "candidate"
      )
    }),
  }
})
