import type { CandidateForm } from "@/domain/entities/CandidateForm"
import type { RecruitmentFlowStage, VacancyStatus } from "@/domain/entities/EmployeeRequestForm"

export const interviewEvaluationRecommendationOptions = [
  "continue_recruitment",
  "find_comparison_candidate",
  "stop_recruitment",
  "save_as_candidate_database",
] as const

export type InterviewEvaluationRecommendation =
  (typeof interviewEvaluationRecommendationOptions)[number]

export interface InterviewEvaluationScore {
  id: string
  interview_evaluation_form_id: string
  interview_evaluation_interviewer_id?: string | null
  item_number: number
  category_title: string
  category_description: string
  score: number | null
  info: string | null
  created_at: string | null
  updated_at: string | null
}

export interface InterviewEvaluationInterviewerRecipient {
  user_id: string
  name: string
  email: string | null
  job_level: string | null
  label: string
}

export interface InterviewEvaluationInterviewerResult {
  id: string
  interview_evaluation_form_id: string
  interviewer: InterviewEvaluationInterviewerRecipient
  comments: string | null
  recommendation: InterviewEvaluationRecommendation | null
  scores: InterviewEvaluationScore[]
}

export interface InterviewEvaluation {
  id: string
  employee_request_form_id: string | null
  recruitment_flow_stage?: RecruitmentFlowStage | null
  vacancy_status?: VacancyStatus | null
  candidate_service_candidate_id: string | null
  candidate_service_application_id: string | null
  candidate_name: string
  applied_position: string | null
  average_score?: number | null
  interviewer_name: string
  interviewer_recipients: InterviewEvaluationInterviewerRecipient[]
  interview_date: string
  notes: string | null
  comments: string | null
  recommendation: InterviewEvaluationRecommendation | null
  created_by: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
  is_completed?: boolean
  candidate_form?: CandidateForm | null
  scores: InterviewEvaluationScore[]
  interviewer_results?: InterviewEvaluationInterviewerResult[]
}

export interface InterviewEvaluationCandidateOption {
  id: string
  candidate_name: string
  applied_position: string | null
  employee_request_form_id: string | null
  candidate_service_candidate_id: string | null
  candidate_service_application_id: string | null
  personal_email: string | null
  phone_number: string | null
  completion_status: string | null
  updated_at: string | null
}
