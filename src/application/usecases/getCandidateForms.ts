import type { CandidateForm } from '@/domain/entities/CandidateForm'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'

export function getCandidateForms(repo: CandidateFormRepository): Promise<CandidateForm[]> {
  return repo.getAll()
}
