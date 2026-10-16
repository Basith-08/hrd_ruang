import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { createEmployeeContractForm } from "~~/server/services/employeeContractFormService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody(event)

  return {
    employee_contract_form: await createEmployeeContractForm(context, body ?? {}),
  }
})
