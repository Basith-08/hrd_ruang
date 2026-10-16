import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { deleteEmployeeContractForm } from "~~/server/services/employeeContractFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const id = String(event.context.params?.id ?? "")

  await deleteEmployeeContractForm(context, id)

  return { ok: true }
})
