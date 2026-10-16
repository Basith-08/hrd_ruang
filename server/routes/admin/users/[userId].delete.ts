import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { deleteManagedUser } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const userId = String(event.context.params?.userId ?? "")

  await deleteManagedUser(context, userId)
  return { ok: true }
})
