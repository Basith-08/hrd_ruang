import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { deleteInterviewEvaluation } from "~~/server/services/interviewEvaluationService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const id = String(event.context.params?.id ?? "")

  await deleteInterviewEvaluation(context, id)

  return {
    ok: true,
  }
})
