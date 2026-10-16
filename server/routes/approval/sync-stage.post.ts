import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const body = await readBody<{
    chain_id?: string
  }>(event)

  const chainId = String(body?.chain_id ?? "").trim()
  if (!chainId) {
    throw createError({
      statusCode: 400,
      statusMessage: "chain_id is required.",
    })
  }

  const { data: chain, error } = await context.supabase
    .from("approval_chains")
    .select("employee_request_form_id")
    .eq("id", chainId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const employeeRequestFormId = String(chain?.employee_request_form_id ?? "").trim()
  if (!employeeRequestFormId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Approval chain not found.",
    })
  }

  const stage = await syncRecruitmentFlowStage(context.supabase, employeeRequestFormId)
  return { ok: true, stage }
})
