import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { createHttpError } from "~~/server/lib/errors.js"
import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { isAdminRole } from "~~/server/lib/utils.js"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { sendEmail, validateSendEmailBody } from "~~/server/services/emailService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)

  enforceRateLimit(
    "email.send",
    String(context.userId ?? context.authUser?.email ?? getClientIpAddress(event)),
    10,
    60 * 1000,
    "Too many email requests. Please wait a minute before trying again.",
  )

  if (!isAdminRole(context.roleName)) {
    throw createHttpError(403, "Only administrators can send emails from this endpoint.")
  }

  const body = await readBody(event)
  const errors = validateSendEmailBody(body)

  if (errors.length > 0) {
    const error = new Error(errors.join("; "))
    ;(error as Error & { status?: number }).status = 400
    throw error
  }

  await sendEmail(body)
  return { ok: true }
})
