export function normalizeCandidatePortalUrl(value: unknown) {
  const url = String(value ?? '').trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(url) ? url : ''
}

export function isExternalRouteTarget(target: string | null | undefined) {
  return /^https?:\/\//i.test(String(target ?? '').trim())
}

export function getCandidatePortalRoute(
  candidatePortalUrl: string | null | undefined,
  path = '',
) {
  const baseUrl = normalizeCandidatePortalUrl(candidatePortalUrl)
  if (!baseUrl) {
    return ''
  }

  const normalizedPath = String(path ?? '').trim().replace(/^\/+/, '')
  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl
}

export function shouldRedirectCandidateToPortal(
  role: string | null | undefined,
  candidatePortalUrl: string | null | undefined,
) {
  return String(role ?? '').trim().toLowerCase() === 'candidate' && !!normalizeCandidatePortalUrl(candidatePortalUrl)
}
