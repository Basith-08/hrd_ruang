import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { deleteRole } from "~~/server/services/roleService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const roleId = String(event.context.params?.roleId ?? "")

  await deleteRole(context, roleId)
  return { ok: true }
})
