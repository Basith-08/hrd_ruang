import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'

export function deleteCandidateForm(repo: CandidateFormRepository, id: string): Promise<void> {
  return repo.delete(id)
}
