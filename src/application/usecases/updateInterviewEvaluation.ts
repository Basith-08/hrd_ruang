import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"
import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"

export function updateInterviewEvaluation(
  repo: InterviewEvaluationRepository,
  id: string,
  payload: InterviewEvaluationRequest,
) {
  return repo.update(id, payload)
}
