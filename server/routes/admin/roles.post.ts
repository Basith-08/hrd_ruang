import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { createRole } from "~~/server/services/roleService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody<{ description?: string; name?: string }>(event)

  return {
    role: await createRole(context, body?.name, body?.description),
  }
})
