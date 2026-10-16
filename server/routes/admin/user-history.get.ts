import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { loadUserHistory } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  return { history: await loadUserHistory(context) }
})
