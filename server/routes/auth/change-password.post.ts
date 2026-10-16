import { readBody } from "h3"

import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { changeAuthenticatedPassword } from "~~/server/services/authService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

type ChangePasswordBody = {
  currentPassword?: string
  newPassword?: string
}

export default defineJsonHandler(async (event) => {
  enforceRateLimit(
    "auth.change-password",
    getClientIpAddress(event),
    10,
    5 * 60 * 1000,
    "Too many password change attempts. Please try again in a few minutes.",
  )

  const context = await requireRequestContext(event)
  const body = await readBody<ChangePasswordBody>(event)

  await changeAuthenticatedPassword(context, {
    currentPassword: body?.currentPassword,
    newPassword: body?.newPassword,
  })

  return {
    ok: true,
  }
})
