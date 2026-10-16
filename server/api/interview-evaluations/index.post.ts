import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { resolveTrustedAppOrigin } from "~~/server/utils/origin.js"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { createInterviewEvaluation } from "~~/server/services/interviewEvaluationService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody(event)
  const appOrigin = resolveTrustedAppOrigin(event)

  return {
    interview_evaluation: await createInterviewEvaluation(context, body ?? {}, { appOrigin }),
  }
})
