import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"

export interface InterviewEvaluationRepository {
  getAll(): Promise<InterviewEvaluation[]>
  getAssigned(): Promise<InterviewEvaluation[]>
  getAssignedById(id: string): Promise<InterviewEvaluation>
  getCandidateOptions(): Promise<InterviewEvaluationCandidateOption[]>
  create(payload: InterviewEvaluationRequest): Promise<InterviewEvaluation>
  update(id: string, payload: InterviewEvaluationRequest): Promise<InterviewEvaluation>
  delete(id: string): Promise<void>
}
