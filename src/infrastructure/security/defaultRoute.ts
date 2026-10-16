import { getCandidatePortalRoute } from '@/infrastructure/security/candidatePortal'

export function getDefaultRouteForRole(
  role: string | null | undefined,
  candidatePortalUrl?: string | null,
) {
  const normalizedRole = String(role ?? "").toLowerCase().trim()

  if (normalizedRole === "candidate") {
    return getCandidatePortalRoute(candidatePortalUrl) || "/candidate-forms"
  }

  return "/dashboard"
}
