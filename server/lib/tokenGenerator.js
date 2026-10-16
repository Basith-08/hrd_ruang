import crypto from "crypto"

const TOKEN_LENGTH = 32
const TOKEN_EXPIRY_HOURS = 24

export function generateResetToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex")
}

export function getTokenExpiryTime() {
  const now = new Date()
  now.setHours(now.getHours() + TOKEN_EXPIRY_HOURS)
  return now.toISOString()
}
