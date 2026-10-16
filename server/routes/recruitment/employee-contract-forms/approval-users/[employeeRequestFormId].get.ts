import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { listEmployeeContractFormApprovalUsers } from "~~/server/services/employeeContractFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const employeeRequestFormId = String(event.context.params?.employeeRequestFormId ?? "")

  return {
    approval_users: await listEmployeeContractFormApprovalUsers(context, employeeRequestFormId),
  }
})
