import { readBody } from "h3"

import { runInBackground } from "~~/server/lib/backgroundTask.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { resolveTrustedAppOrigin } from "~~/server/utils/origin.js"
import { sendApprovalStepEmail } from "~~/server/services/approvalService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody<{
    chain_id?: string
    step_order?: number
  }>(event)
  const appOrigin = resolveTrustedAppOrigin(event)

  runInBackground(
    () => sendApprovalStepEmail(context, body?.chain_id, body?.step_order, appOrigin),
    "approval notification email",
  )
  return { ok: true }
})
