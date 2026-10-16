import { HRD_PINTU_SERVICE_SYNC_TOKEN } from "~~/server/config/env.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"

export function requireCandidateProjectionSyncToken(headers) {
  const token = String(headers["x-hrd-pintu-sync-token"] ?? "").trim()
  if (!HRD_PINTU_SERVICE_SYNC_TOKEN) {
    throw createHttpError(500, "HRD_PINTU_SERVICE_SYNC_TOKEN is not configured.", {
      expose: false,
    })
  }

  if (!token || token !== HRD_PINTU_SERVICE_SYNC_TOKEN) {
    throw createHttpError(401, "Unauthorized candidate sync request.")
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function extractEmployeeRequestFormIdsFromSummary(summary) {
  const ids = new Set()
  const primaryApplication = summary?.primary_application
  const primaryErfId = normalizeText(primaryApplication?.erf_id)
  if (primaryErfId) {
    ids.add(primaryErfId)
  }

  for (const application of Array.isArray(summary?.applications) ? summary.applications : []) {
    const employeeRequestFormId = normalizeText(application?.erf_id)
    if (employeeRequestFormId) {
      ids.add(employeeRequestFormId)
    }
  }

  return Array.from(ids)
}

export async function syncCandidateProjectionEvent(context, payload) {
  const employeeRequestFormIds = extractEmployeeRequestFormIdsFromSummary(payload?.summary)

  for (const employeeRequestFormId of employeeRequestFormIds) {
    await syncRecruitmentFlowStage(context.supabase, employeeRequestFormId)
  }

  return {
    ok: true,
    event_type: payload?.event_type ?? null,
    synced_employee_request_form_ids: employeeRequestFormIds,
  }
}
