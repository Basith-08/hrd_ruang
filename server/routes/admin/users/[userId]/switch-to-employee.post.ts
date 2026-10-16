import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { switchManagedUserToEmployee } from "~~/server/services/userManagementService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const userId = String(event.context.params?.userId ?? "")

  return {
    user: await switchManagedUserToEmployee(context, userId),
  }
})
