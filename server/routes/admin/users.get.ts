import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { loadManagedUsers } from "~~/server/services/userManagementService.js"
import { getQuery } from "h3"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const query = getQuery(event)
  const scope = String(query.scope ?? "").trim()
  return { users: await loadManagedUsers(context, scope) }
})
