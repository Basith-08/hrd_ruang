import type { InterviewEvaluationCandidateOption } from "@/domain/entities/InterviewEvaluation"
import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"

export function getInterviewEvaluationCandidateOptions(
  repo: InterviewEvaluationRepository,
): Promise<InterviewEvaluationCandidateOption[]> {
  return repo.getCandidateOptions()
}
