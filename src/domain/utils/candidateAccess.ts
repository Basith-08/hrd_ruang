const DAY_IN_MS = 24 * 60 * 60 * 1000

export const CANDIDATE_ACTIVE_DAYS = 365

export function getCandidateAccessStartTime(
  activatedAt: string | null | undefined,
  createdAt: string | null | undefined = activatedAt,
) {
  const referenceTime = activatedAt || createdAt
  if (!referenceTime) {
    return null
  }

  const referenceDate = new Date(referenceTime)
  if (Number.isNaN(referenceDate.getTime())) {
    return null
  }

  return referenceDate.getTime()
}

export function getCandidateAccessExpiryTime(
  activatedAt: string | null | undefined,
  createdAt: string | null | undefined = activatedAt,
) {
  const accessStartTime = getCandidateAccessStartTime(activatedAt, createdAt)
  if (accessStartTime === null) {
    return null
  }

  return accessStartTime + CANDIDATE_ACTIVE_DAYS * DAY_IN_MS
}

export function getCandidateAccessRemainingMs(
  activatedAt: string | null | undefined,
  createdAt: string | null | undefined = activatedAt,
  now = Date.now(),
) {
  const expiresAt = getCandidateAccessExpiryTime(activatedAt, createdAt)
  if (expiresAt === null) {
    return null
  }

  return expiresAt - now
}

export function getCandidateAccessRemainingDays(
  activatedAt: string | null | undefined,
  createdAt: string | null | undefined = activatedAt,
  now = Date.now(),
) {
  const remainingMs = getCandidateAccessRemainingMs(activatedAt, createdAt, now)
  if (remainingMs === null) {
    return null
  }

  if (remainingMs <= 0) {
    return 0
  }

  return Math.ceil(remainingMs / DAY_IN_MS)
}
