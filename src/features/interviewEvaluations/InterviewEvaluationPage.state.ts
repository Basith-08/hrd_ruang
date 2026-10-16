import type { InterviewEvaluationRequest } from "@/domain/requests/InterviewEvaluationRequest"
import { interviewEvaluationCriteria } from "./interviewEvaluationSchema"

export function createInterviewEvaluationFormState(): InterviewEvaluationRequest {
  return {
    selected_candidate_option_id: "",
    interviewer_name: "",
    interviewer_recipients: [],
    interview_date: "",
    notes: "",
    comments: "",
    recommendation: "",
    scores: interviewEvaluationCriteria.map((criterion) => ({
      item_number: criterion.number,
      score: null,
      info: "",
    })),
  }
}
