import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { deleteEmployeeRequestForm } from "~~/server/services/employeeRequestFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const id = String(event.context.params?.id ?? "")

  await deleteEmployeeRequestForm(context, id)

  return { ok: true }
})
