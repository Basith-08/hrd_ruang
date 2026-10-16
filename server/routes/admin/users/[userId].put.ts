import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { updateManagedUser } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody(event)
  const userId = String(event.context.params?.userId ?? "")

  return {
    user: await updateManagedUser(context, userId, body ?? {}),
  }
})
