import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { loadRoles } from "~~/server/services/roleService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  return { roles: await loadRoles(context) }
})
