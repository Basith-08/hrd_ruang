import { callBackendApi } from "@/infrastructure/http/backendApi"
import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"
import type {
  GetAssignedInterviewEvaluationsResponse,
  GetAssignedInterviewEvaluationResponse,
  GetInterviewEvaluationCandidateOptionsResponse,
  GetInterviewEvaluationsResponse,
  MutateInterviewEvaluationResponse,
} from "@/infrastructure/supabase/repositories/responses/InterviewEvaluationRepositoryResponse"

export class InterviewEvaluationRepositoryImpl implements InterviewEvaluationRepository {
  async getAll(): Promise<InterviewEvaluation[]> {
    const payload = await callBackendApi<GetInterviewEvaluationsResponse>("/api/interview-evaluations")
    return Array.isArray(payload.interview_evaluations) ? payload.interview_evaluations : []
  }

  async getAssigned(): Promise<InterviewEvaluation[]> {
    const payload = await callBackendApi<GetAssignedInterviewEvaluationsResponse>(
      "/api/interview-evaluations/assigned",
    )
    return Array.isArray(payload.interview_evaluations) ? payload.interview_evaluations : []
  }

  async getAssignedById(id: string): Promise<InterviewEvaluation> {
    const payload = await callBackendApi<GetAssignedInterviewEvaluationResponse>(
      `/api/interview-evaluations/assigned/${encodeURIComponent(id)}`,
    )
    return payload.interview_evaluation
  }

  async getCandidateOptions(): Promise<InterviewEvaluationCandidateOption[]> {
    const payload = await callBackendApi<GetInterviewEvaluationCandidateOptionsResponse>(
      "/api/interview-evaluations/candidates",
    )
    return Array.isArray(payload.candidate_options) ? payload.candidate_options : []
  }

  async create(payload: InterviewEvaluationRequest): Promise<InterviewEvaluation> {
    const response = await callBackendApi<MutateInterviewEvaluationResponse>(
      "/api/interview-evaluations",
      {
        body: JSON.stringify(payload),
        method: "POST",
      },
    )
    return response.interview_evaluation
  }

  async update(id: string, payload: InterviewEvaluationRequest): Promise<InterviewEvaluation> {
    const response = await callBackendApi<MutateInterviewEvaluationResponse>(
      `/api/interview-evaluations/${encodeURIComponent(id)}`,
      {
        body: JSON.stringify(payload),
        method: "PATCH",
      },
    )
    return response.interview_evaluation
  }

  async delete(id: string): Promise<void> {
    await callBackendApi(`/api/interview-evaluations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  }
}
