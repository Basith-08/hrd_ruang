import { callBackendApi } from '@/infrastructure/http/backendApi'
import type { CandidateDocumentExplorerItem } from '@/domain/entities/CandidateDocumentExplorer'
import type { CandidateDocumentExplorerRepository } from '@/domain/repositories/CandidateDocumentExplorerRepository'
import type { GetCandidateDocumentExplorerItemsResponse } from '@/infrastructure/supabase/repositories/responses/CandidateDocumentExplorerRepositoryResponse'

export class CandidateDocumentExplorerRepositoryImpl implements CandidateDocumentExplorerRepository {
  async getAll(): Promise<CandidateDocumentExplorerItem[]> {
    const payload = await callBackendApi<GetCandidateDocumentExplorerItemsResponse>(
      '/api/recruitment/candidate-document-explorer',
    )

    return Array.isArray(payload.items) ? payload.items : []
  }
}
