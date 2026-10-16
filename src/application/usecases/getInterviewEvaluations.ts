import type { InterviewEvaluation } from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"

export function getInterviewEvaluations(
  repo: InterviewEvaluationRepository,
): Promise<InterviewEvaluation[]> {
  return repo.getAll()
}
