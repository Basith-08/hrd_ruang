const CANDIDATE_SERVICE_USER_PREFIX = "candidate:"

function normalizeText(value) {
  return String(value ?? "").trim()
}

export function encodeCandidateServiceUserId(candidateId) {
  return `${CANDIDATE_SERVICE_USER_PREFIX}${candidateId}`
}

export function decodeCandidateServiceUserId(managedUserId) {
  const normalizedId = normalizeText(managedUserId)
  if (!normalizedId.startsWith(CANDIDATE_SERVICE_USER_PREFIX)) {
    return null
  }

  return normalizedId.slice(CANDIDATE_SERVICE_USER_PREFIX.length) || null
}

export function isCandidateServiceManagedUserId(managedUserId) {
  return decodeCandidateServiceUserId(managedUserId) !== null
}
