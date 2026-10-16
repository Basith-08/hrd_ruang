import type { CandidateFormCompletionStatus } from '@/domain/entities/CandidateForm'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'

export function updateCandidateFormStatus(
  repo: CandidateFormRepository,
  id: string,
  status: CandidateFormCompletionStatus,
) {
  return repo.updateCompletionStatus(id, status)
}
