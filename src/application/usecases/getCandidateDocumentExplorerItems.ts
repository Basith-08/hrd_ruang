import type { CandidateDocumentExplorerItem } from '@/domain/entities/CandidateDocumentExplorer'
import type { CandidateDocumentExplorerRepository } from '@/domain/repositories/CandidateDocumentExplorerRepository'

export function getCandidateDocumentExplorerItems(
  repo: CandidateDocumentExplorerRepository,
): Promise<CandidateDocumentExplorerItem[]> {
  return repo.getAll()
}
