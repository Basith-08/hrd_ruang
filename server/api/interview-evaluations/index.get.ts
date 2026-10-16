import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { listInterviewEvaluations } from "~~/server/services/interviewEvaluationService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)

  return {
    interview_evaluations: await listInterviewEvaluations(context),
  }
})
