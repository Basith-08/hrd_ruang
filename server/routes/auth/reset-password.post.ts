import { readBody } from "h3"

import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin"
import { createHttpError } from "~~/server/lib/errors"
import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import { resetPasswordWithToken } from "~~/server/services/authService"
import { defineJsonHandler } from "~~/server/utils/api"

type ResetPasswordBody = {
  token?: string
  newPassword?: string
}

export default defineJsonHandler(async (event) => {
  enforceRateLimit(
    "auth.reset-password",
    getClientIpAddress(event),
    5,
    15 * 60 * 1000,
    "Too many password reset attempts. Please try again later.",
  )

  const body = await readBody<ResetPasswordBody>(event)
  const token = String(body?.token ?? "").trim()
  const newPassword = String(body?.newPassword ?? "")

  if (!token) {
    throw createHttpError(400, "Reset token is required.")
  }

  if (!newPassword) {
    throw createHttpError(400, "New password is required.")
  }

  const admin = getSupabaseAdmin()

  await resetPasswordWithToken(admin, admin, token, newPassword)

  return {
    ok: true,
  }
})
