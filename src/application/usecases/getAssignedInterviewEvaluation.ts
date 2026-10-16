import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"

export function getAssignedInterviewEvaluation(
  repo: InterviewEvaluationRepository,
  id: string,
): Promise<InterviewEvaluation> {
  return repo.getAssignedById(id)
}
