import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"

export function getAssignedInterviewEvaluations(
  repo: InterviewEvaluationRepository,
): Promise<InterviewEvaluation[]> {
  return repo.getAssigned()
}
