import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { listEmployeeContractForms } from "~~/server/services/employeeContractFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)

  return {
    employee_contract_forms: await listEmployeeContractForms(context),
  }
})
