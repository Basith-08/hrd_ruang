export interface InterviewEvaluationSelectOption {
  value: string
  label: string
}

export interface InterviewEvaluationInterviewerSelectOption extends InterviewEvaluationSelectOption {
  user_id: string
  name: string
  email: string | null
  job_level: string | null
}

export interface InterviewEvaluationScoreRow {
  description: string
  info: string
  item_number: number
  note: string
  score: number | null
  title: string
}
