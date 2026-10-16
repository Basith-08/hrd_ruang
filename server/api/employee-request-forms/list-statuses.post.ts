import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import {
  listPersistedRecruitmentFlowStages,
  mapVacancyStatusFromRecruitmentFlowStage,
} from "~~/server/services/recruitmentFlowStageService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, [
    "approval:read",
    "pic_recruitment:read",
    "recruitment:pic_recruitment_read",
    "employee_request_form:read",
    "recruitment:approved_erf_read",
  ])

  const body = await readBody<{ employee_request_form_ids?: unknown[] }>(event)
  const employeeRequestFormIds = [
    ...new Set(
      (Array.isArray(body?.employee_request_form_ids) ? body.employee_request_form_ids : [])
        .map(normalizeText)
        .filter(Boolean),
    ),
  ]

  if (employeeRequestFormIds.length === 0) {
    return {
      recruitment_flow_stages: [],
      vacancy_statuses: [],
    }
  }

  const recruitmentFlowStageByEmployeeRequestFormId = await listPersistedRecruitmentFlowStages(
    context.supabase,
    employeeRequestFormIds,
  )

  return {
    recruitment_flow_stages: employeeRequestFormIds.map((employeeRequestFormId) => ({
      employee_request_form_id: employeeRequestFormId,
      stage: recruitmentFlowStageByEmployeeRequestFormId.get(employeeRequestFormId) ?? null,
    })),
    vacancy_statuses: employeeRequestFormIds.map((employeeRequestFormId) => {
      const stage = recruitmentFlowStageByEmployeeRequestFormId.get(employeeRequestFormId) ?? null

      return {
        employee_request_form_id: employeeRequestFormId,
        status: mapVacancyStatusFromRecruitmentFlowStage(stage),
      }
    }),
  }
})
