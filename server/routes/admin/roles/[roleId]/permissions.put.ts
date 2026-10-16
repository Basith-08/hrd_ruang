import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { updateRolePermissions } from "~~/server/services/roleService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody<{ permission_ids?: string[] }>(event)
  const roleId = String(event.context.params?.roleId ?? "")

  await updateRolePermissions(context, roleId, body?.permission_ids)
  return { ok: true }
})
