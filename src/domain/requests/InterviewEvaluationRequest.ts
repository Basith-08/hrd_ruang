import type { InterviewEvaluationRecommendation } from "@/domain/entities/InterviewEvaluation"

export interface InterviewEvaluationScoreRequest {
  item_number: number
  score: number | null
  info: string
}

export interface InterviewEvaluationInterviewerRecipientRequest {
  user_id: string
  name: string
  email: string | null
  job_level: string | null
  label: string
}

export interface InterviewEvaluationRequest {
  schedule_only?: boolean
  selected_candidate_option_id: string
  interviewer_name: string
  interviewer_recipients: InterviewEvaluationInterviewerRecipientRequest[]
  interview_date: string
  notes: string
  comments: string
  recommendation: InterviewEvaluationRecommendation | ""
  scores: InterviewEvaluationScoreRequest[]
}
