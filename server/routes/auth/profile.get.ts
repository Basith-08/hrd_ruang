import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { buildAuthenticatedProfile } from "~~/server/services/authService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  return buildAuthenticatedProfile(context)
})
