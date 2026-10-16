import type {
  CandidateForm,
  CandidateFormCompletionStatus,
} from '@/domain/entities/CandidateForm'
import type { CandidateFormRequest } from '@/domain/requests/CandidateFormRequest'

export interface CandidateFormRepository {
  getAll(): Promise<CandidateForm[]>
  getById(id: string): Promise<CandidateForm | null>
  create(data: CandidateFormRequest): Promise<CandidateForm>
  update(id: string, data: CandidateFormRequest): Promise<CandidateForm>
  updateCompletionStatus(id: string, status: CandidateFormCompletionStatus): Promise<CandidateForm>
  delete(id: string): Promise<void>
}
