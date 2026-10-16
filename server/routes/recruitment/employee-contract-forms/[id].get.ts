import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { getEmployeeContractForm } from "~~/server/services/employeeContractFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const id = String(event.context.params?.id ?? "")

  return {
    employee_contract_form: await getEmployeeContractForm(context, id),
  }
})
