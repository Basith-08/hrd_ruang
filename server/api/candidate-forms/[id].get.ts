import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import { getCandidateFormForDashboard } from "~~/server/services/candidateFormReadService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  if (!isAdminRole(context.roleName)) {
    requireAnyPermission(context, [
      "candidate_form:read",
      "employee_form:read",
      "recruitment:candidate_database",
      "employee_contract_form:export_pdf",
    ])
  }

  return {
    candidate_form: await getCandidateFormForDashboard(
      context,
      String(event.context.params?.id ?? ""),
    ),
  }
})
