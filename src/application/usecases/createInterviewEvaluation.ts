import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"

export function createInterviewEvaluation(
  repo: InterviewEvaluationRepository,
  payload: InterviewEvaluationRequest,
) {
  return repo.create(payload)
}
