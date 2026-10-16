import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'

export function createCandidateForm(repo: CandidateFormRepository, payload: CandidateFormRequest) {
  return repo.create(payload)
}
