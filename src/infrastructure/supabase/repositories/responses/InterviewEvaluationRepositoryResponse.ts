import type {
  InterviewEvaluation,
  InterviewEvaluationCandidateOption,
} from "@/domain/entities/InterviewEvaluation"

export interface GetInterviewEvaluationsResponse {
  interview_evaluations: InterviewEvaluation[]
}

export interface GetAssignedInterviewEvaluationsResponse {
  interview_evaluations: InterviewEvaluation[]
}

export interface GetAssignedInterviewEvaluationResponse {
  interview_evaluation: InterviewEvaluation
}

export interface GetInterviewEvaluationCandidateOptionsResponse {
  candidate_options: InterviewEvaluationCandidateOption[]
}

export interface MutateInterviewEvaluationResponse {
  interview_evaluation: InterviewEvaluation
}
