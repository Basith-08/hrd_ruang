import { createClient } from "@supabase/supabase-js"

import { createHttpError } from "~~/server/lib/errors.js"
import { isEmail } from "~~/server/lib/utils.js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "~~/server/config/env.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"

const MIN_PASSWORD_LENGTH = 6

function getPasswordVerificationClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function buildFallbackLoginEmail(identifier) {
  const localPart = String(identifier ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 64)

  return `${localPart || "user"}@example.invalid`
}

export async function resolveLoginIdentifier(identifierInput) {
  const identifier = String(identifierInput ?? "").trim()
  if (!identifier) {
    throw createHttpError(400, "Identifier is required.")
  }

  if (isEmail(identifier)) {
    return { email: identifier }
  }

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("email")
    .ilike("username", identifier.replace(/^@/, ""))
    .maybeSingle()

  if (error) {
    throw createHttpError(
      500,
      "Failed to resolve login identifier.",
      { expose: false },
    )
  }

  const email = String(data?.email ?? "").trim()
  if (!email) {
    return { email: buildFallbackLoginEmail(identifier) }
  }

  return { email }
}

export async function buildAuthenticatedProfile(context) {
  const { data: profile, error } = await context.supabase
    .from("profiles")
    .select(
      "username, full_name, phone, avatar_url, created_at, email, main_position, master_designation_id, is_active, personal_data",
    )
    .eq("id", context.userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return {
    username: profile?.username ?? undefined,
    email: profile?.email ?? context.authUser.email ?? undefined,
    phone: profile?.phone ?? undefined,
    full_name: profile?.full_name ?? undefined,
    first_name: profile?.full_name ?? undefined,
    middle_name: undefined,
    last_name: undefined,
    avatar_url: profile?.avatar_url ?? undefined,
    department_id: undefined,
    master_designation_id: profile?.master_designation_id ?? undefined,
    main_position: profile?.main_position ?? undefined,
    personal_data:
      profile?.personal_data && typeof profile.personal_data === "object"
        ? profile.personal_data
        : undefined,
    created_at: profile?.created_at ?? undefined,
    is_active: profile?.is_active ?? true,
    role: context.roleName ?? undefined,
    permissions: context.permissions,
  }
}

export async function changeAuthenticatedPassword(
  context,
  input,
) {
  const currentPassword = String(input?.currentPassword ?? "")
  const newPassword = String(input?.newPassword ?? "")

  if (!currentPassword) {
    throw createHttpError(400, "Current password is required.")
  }

  if (!newPassword) {
    throw createHttpError(400, "New password is required.")
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }

  if (currentPassword === newPassword) {
    throw createHttpError(400, "New password must be different from the current password.")
  }

  const email = String(context?.authUser?.email ?? "").trim()

  if (!email) {
    throw createHttpError(400, "Authenticated email is unavailable.")
  }

  const verificationClient = getPasswordVerificationClient()
  const { error: verifyError } = await verificationClient.auth.signInWithPassword({
    email,
    password: currentPassword,
  })

  if (verifyError) {
    throw createHttpError(400, "Current password is incorrect.")
  }

  await verificationClient.auth.signOut().catch(() => {})

  const { error: updateError } = await context.supabase.auth.admin.updateUserById(
    context.userId,
    { password: newPassword },
  )

  if (updateError) {
    throw createHttpError(500, "Failed to update password.", { expose: false })
  }
}

export async function createPasswordResetToken(email) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase()

  if (!normalizedEmail) {
    throw createHttpError(400, "Email is required.")
  }

  if (!isEmail(normalizedEmail)) {
    throw createHttpError(400, "Invalid email format.")
  }

  const admin = getSupabaseAdmin()
  const { data: users, error: userError } = await admin.auth.admin.listUsers()

  if (userError) {
    throw createHttpError(500, "Failed to verify email.", { expose: false })
  }

  const user = users.users.find((u) => u.email?.toLowerCase() === normalizedEmail)

  if (!user) {
    throw createHttpError(404, "User not found with this email.")
  }

  return user.id
}

export async function storePasswordResetToken(supabase, userId, email, token, expiresAt) {
  const { error } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: userId,
      email: String(email ?? "").trim().toLowerCase(),
      token,
      expires_at: expiresAt,
    })

  if (error) {
    console.error("Password reset token storage error:", error)
    throw createHttpError(500, "Failed to create reset token.", { expose: false })
  }
}

export async function verifyPasswordResetToken(supabase, token) {
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, "Failed to verify token.", { expose: false })
  }

  if (!data) {
    throw createHttpError(404, "Invalid reset token.")
  }

  const now = new Date()
  if (new Date(data.expires_at) < now) {
    throw createHttpError(400, "Reset token has expired.")
  }

  if (data.used_at) {
    throw createHttpError(400, "Reset token has already been used.")
  }

  return data
}

export async function resetPasswordWithToken(supabase, admin, token, newPassword) {
  if (!newPassword) {
    throw createHttpError(400, "New password is required.")
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }

  const tokenData = await verifyPasswordResetToken(supabase, token)

  const { error: updateError } = await admin.auth.admin.updateUserById(
    tokenData.user_id,
    { password: newPassword },
  )

  if (updateError) {
    throw createHttpError(500, "Failed to update password.", { expose: false })
  }

  const { error: markError } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id)

  if (markError) {
    throw createHttpError(500, "Failed to mark token as used.", { expose: false })
  }
}
