import { readBody } from "h3"

import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { resolveLoginIdentifier } from "~~/server/services/authService.js"

export default defineJsonHandler(async (event) => {
  enforceRateLimit(
    "auth.resolve-login",
    getClientIpAddress(event),
    20,
    60 * 1000,
    "Too many login identifier lookups. Please try again in a minute.",
  )

  const body = await readBody<{ identifier?: string }>(event)
  return resolveLoginIdentifier(body?.identifier)
})
