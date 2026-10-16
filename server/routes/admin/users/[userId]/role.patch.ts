import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { updateManagedUserRole } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody<{ role_id?: string }>(event)
  const userId = String(event.context.params?.userId ?? "")

  await updateManagedUserRole(context, userId, body?.role_id)
  return { ok: true }
})
