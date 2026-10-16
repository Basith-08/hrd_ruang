import { defineJsonHandler } from "~~/server/utils/api"
import { getQuery } from "h3"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { loadUserManagementRoles } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const query = getQuery(event)
  const scope = String(query.scope ?? "").trim()
  return { roles: await loadUserManagementRoles(context, scope) }
})
