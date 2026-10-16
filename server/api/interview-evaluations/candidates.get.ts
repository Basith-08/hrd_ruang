import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { listInterviewEvaluationCandidateOptions } from "~~/server/services/interviewEvaluationService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)

  return {
    candidate_options: await listInterviewEvaluationCandidateOptions(context),
  }
})
