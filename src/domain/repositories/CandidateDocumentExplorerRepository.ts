import type { CandidateDocumentExplorerItem } from '@/domain/entities/CandidateDocumentExplorer'

export interface CandidateDocumentExplorerRepository {
  getAll(): Promise<CandidateDocumentExplorerItem[]>
}
