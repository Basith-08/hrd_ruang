import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { createManagedUser } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody(event)
  return { user: await createManagedUser(context, body ?? {}) }
})
