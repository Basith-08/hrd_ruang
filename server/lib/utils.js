export const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0
}

export function isEmail(value) {
  return emailRx.test(String(value ?? "").trim())
}

export function normalizeRoleName(roleName) {
  return String(roleName ?? "").trim().toLowerCase()
}

export function isAdminRole(roleName) {
  return normalizeRoleName(roleName) === "super_admin"
}

export function isStaffRole(roleName) {
  return normalizeRoleName(roleName).startsWith("staff")
}

export function isMissingDatabaseObjectError(error) {
  const code = String(error?.code ?? "").trim()
  const message = String(error?.message ?? error ?? "").toLowerCase()

  return (
    ["42703", "42p01", "pgrst204", "pgrst205"].includes(code) ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the column")
  )
}

export function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))]
}

export function extractCreatorId(user) {
  const userMetadata = user?.user_metadata ?? {}
  const appMetadata = user?.app_metadata ?? {}
  const creatorId = userMetadata.created_by ?? appMetadata.created_by

  return typeof creatorId === "string" && creatorId.trim() ? creatorId : null
}

export function readPersonalDataString(personalData, key) {
  if (!personalData || typeof personalData !== "object") {
    return null
  }

  const value = personalData[key]
  return typeof value === "string" && value.trim() ? value : null
}

export function buildPersonalData(identity, existing) {
  const next = existing && typeof existing === "object" ? { ...existing } : {}
  next.full_name = identity.full_name
  next.personal_email = identity.email
  next.phone_number = identity.phone
  return next
}
