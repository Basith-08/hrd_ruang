import type { CandidateForm } from '@/domain/entities/CandidateForm'

export interface GetCandidateFormsResponse {
  candidate_forms: CandidateForm[]
}

export interface GetCandidateFormResponse {
  candidate_form: CandidateForm | null
}
