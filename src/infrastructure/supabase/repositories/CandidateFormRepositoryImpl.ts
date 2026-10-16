import { callBackendApi } from '@/infrastructure/http/backendApi'
import type {
  CandidateForm,
  CandidateFormCompletionStatus,
} from '@/domain/entities/CandidateForm'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'
import type { CandidateFormRepository } from '@/domain/repositories/CandidateFormRepository'
import type {
  GetCandidateFormResponse,
  GetCandidateFormsResponse,
} from '@/infrastructure/supabase/repositories/responses/CandidateFormRepositoryResponse'

function createDashboardCandidateFormReadOnlyError(): Error {
  return new Error(
    'Candidate & Employee Forms in hrd_ruang are read-only. Manage candidate form changes from hrd_pintu.',
  )
}

export class CandidateFormRepositoryImpl implements CandidateFormRepository {
  async getAll(): Promise<CandidateForm[]> {
    const payload = await callBackendApi<GetCandidateFormsResponse>('/api/candidate-forms')
    return Array.isArray(payload.candidate_forms) ? payload.candidate_forms : []
  }

  async getById(id: string): Promise<CandidateForm | null> {
    const payload = await callBackendApi<GetCandidateFormResponse>(
      `/api/candidate-forms/${encodeURIComponent(id)}`,
    )
    return payload.candidate_form ?? null
  }

  async create(data: CandidateFormRequest): Promise<CandidateForm> {
    void data
    throw createDashboardCandidateFormReadOnlyError()
  }

  async update(id: string, data: CandidateFormRequest): Promise<CandidateForm> {
    void id
    void data
    throw createDashboardCandidateFormReadOnlyError()
  }

  async updateCompletionStatus(
    id: string,
    status: CandidateFormCompletionStatus,
  ): Promise<CandidateForm> {
    void id
    void status
    throw createDashboardCandidateFormReadOnlyError()
  }

  async delete(id: string): Promise<void> {
    void id
    throw createDashboardCandidateFormReadOnlyError()
  }
}
