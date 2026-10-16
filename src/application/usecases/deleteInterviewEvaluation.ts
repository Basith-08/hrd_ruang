import type { InterviewEvaluationRepository } from "@/domain/repositories/InterviewEvaluationRepository"

export function deleteInterviewEvaluation(repo: InterviewEvaluationRepository, id: string) {
  return repo.delete(id)
}
