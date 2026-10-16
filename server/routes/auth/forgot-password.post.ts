import { readBody } from "h3"

import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin"
import { sendEmail } from "~~/server/services/emailService"
import { createHttpError } from "~~/server/lib/errors"
import { isEmail } from "~~/server/lib/utils"
import { APP_BASE_URL } from "~~/server/config/env"
import { generateResetToken, getTokenExpiryTime } from "~~/server/lib/tokenGenerator"
import { enforceRateLimit, getClientIpAddress } from "~~/server/lib/rateLimit.js"
import {
  createPasswordResetToken,
  storePasswordResetToken,
} from "~~/server/services/authService"
import { defineJsonHandler } from "~~/server/utils/api"

type ForgotPasswordBody = {
  email?: string
}

export default defineJsonHandler(async (event) => {
  enforceRateLimit(
    "auth.forgot-password",
    getClientIpAddress(event),
    5,
    15 * 60 * 1000,
    "Too many password reset attempts. Please try again later.",
  )

  const body = await readBody<ForgotPasswordBody>(event)
  const email = String(body?.email ?? "").trim().toLowerCase()

  if (!email || !isEmail(email)) {
    throw createHttpError(400, "Valid email is required.")
  }

  const userId = await createPasswordResetToken(email)

  const resetToken = generateResetToken()
  const expiresAt = getTokenExpiryTime()

  const admin = getSupabaseAdmin()

  await storePasswordResetToken(admin, userId, email, resetToken, expiresAt)

  const resetLink = `${APP_BASE_URL}/reset-password?token=${resetToken}`

  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p><a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
  })

  return {
    ok: true,
  }
})
