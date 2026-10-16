import type { CandidateForm } from '@/domain/entities/CandidateForm'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'

export function updateCandidateForm(
  repo: CandidateFormRepository,
  id: string,
  data: CandidateFormRequest,
): Promise<CandidateForm> {
  return repo.update(id, data)
}
