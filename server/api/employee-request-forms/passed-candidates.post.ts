import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import { isStaffRole } from "~~/server/lib/utils.js"
import { listManagedCandidateUsersFromCandidateDatabase } from "~~/server/services/candidateDatabaseReadService.js"
import {
  listPersistedRecruitmentFlowStages,
  mapVacancyStatusFromRecruitmentFlowStage,
} from "~~/server/services/recruitmentFlowStageService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function isEmployeePortalCandidate(candidate: Record<string, unknown>) {
  return normalizeText(candidate?.role).toLowerCase() !== "candidate"
}

function buildInterviewCandidateKey(row: Record<string, unknown>) {
  const applicationId = normalizeText(row?.candidate_service_application_id)
  if (applicationId) {
    return `application:${applicationId}`
  }

  const candidateId = normalizeText(row?.candidate_service_candidate_id)
  if (candidateId) {
    return `candidate:${candidateId}`
  }

  const candidateName = normalizeText(row?.candidate_name)
  if (candidateName) {
    return `name:${candidateName.toLowerCase()}`
  }

  return ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, [
    "employee_request_form:read",
    "recruitment:approved_erf_read",
    "recruitment:vacancy_pipeline",
  ])

  const body = await readBody<{ employee_request_form_ids?: unknown[] }>(event)
  const employeeRequestFormIds = new Set(
    (Array.isArray(body?.employee_request_form_ids) ? body.employee_request_form_ids : [])
      .map(normalizeText)
      .filter(Boolean),
  )

  if (employeeRequestFormIds.size === 0) {
    return {
      passed_candidates: [],
      recruitment_flow_stages: [],
      vacancy_statuses: [],
      vacancy_pipeline: [],
    }
  }

  const candidates = await listManagedCandidateUsersFromCandidateDatabase(
    {
      isStaff: isStaffRole(context.roleName),
      roleName: context.roleName,
      userId: context.userId,
    },
    context.supabase,
  )

  const relevantCandidates = candidates.filter((candidate: { employee_request_form_id?: unknown }) =>
    employeeRequestFormIds.has(normalizeText(candidate?.employee_request_form_id)),
  )
  const passedCandidates = relevantCandidates.filter((candidate: { employee_request_form_id?: unknown }) => isEmployeePortalCandidate(candidate))
  const employeeRequestFormIdList = Array.from(employeeRequestFormIds)
  const recruitmentFlowStageByEmployeeRequestFormId = await listPersistedRecruitmentFlowStages(
    context.supabase,
    employeeRequestFormIdList,
  )

  const interviewResult = await context.supabase
    .from("interview_evaluation_forms")
    .select(
      "employee_request_form_id, interview_date, candidate_service_application_id, candidate_service_candidate_id, candidate_name, interviewers:interview_evaluation_interviewers(recommendation, scores:interview_evaluation_interviewer_scores(score))",
    )
    .in("employee_request_form_id", employeeRequestFormIdList)

  const { data: interviewRows, error: interviewError } = interviewResult

  if (interviewError) {
    throw new Error(interviewError.message)
  }

  const candidatesByEmployeeRequestFormId = new Map()
  const interviewCandidateKeysByEmployeeRequestFormId = new Map()

  for (const candidate of relevantCandidates) {
    const employeeRequestFormId = normalizeText(candidate?.employee_request_form_id)
    if (!employeeRequestFormId) continue

    const current = candidatesByEmployeeRequestFormId.get(employeeRequestFormId) ?? []
    current.push(candidate)
    candidatesByEmployeeRequestFormId.set(employeeRequestFormId, current)
  }

  for (const row of interviewRows ?? []) {
    const employeeRequestFormId = normalizeText(row?.employee_request_form_id)
    if (!employeeRequestFormId) continue

    const interviewDate = normalizeText(row?.interview_date)
    if (!interviewDate) continue

    const candidateKey = buildInterviewCandidateKey(row)
    if (!candidateKey) continue

    const current = interviewCandidateKeysByEmployeeRequestFormId.get(employeeRequestFormId) ?? new Set()
    current.add(candidateKey)
    interviewCandidateKeysByEmployeeRequestFormId.set(employeeRequestFormId, current)
  }

  return {
    passed_candidates: passedCandidates.map((candidate: { employee_request_form_id?: unknown, id?: unknown, full_name?: unknown, email?: unknown }) => ({
      employee_request_form_id: normalizeText(candidate.employee_request_form_id),
      candidate_id: normalizeText(candidate.id),
      full_name: normalizeText(candidate.full_name) || null,
      email: normalizeText(candidate.email) || null,
    })),
    recruitment_flow_stages: Array.from(employeeRequestFormIds).map((employeeRequestFormId) => {
      return {
        employee_request_form_id: employeeRequestFormId,
        stage: recruitmentFlowStageByEmployeeRequestFormId.get(employeeRequestFormId) ?? null,
      }
    }),
    vacancy_statuses: Array.from(employeeRequestFormIds).map((employeeRequestFormId) => ({
      employee_request_form_id: employeeRequestFormId,
      status: mapVacancyStatusFromRecruitmentFlowStage(
        recruitmentFlowStageByEmployeeRequestFormId.get(employeeRequestFormId) ?? null,
      ),
    })),
    vacancy_pipeline: Array.from(employeeRequestFormIds).map((employeeRequestFormId) => {
      const candidatesForErf = candidatesByEmployeeRequestFormId.get(employeeRequestFormId) ?? []
      const interviewCandidatesForErf =
        interviewCandidateKeysByEmployeeRequestFormId.get(employeeRequestFormId) ?? new Set()

      return {
        employee_request_form_id: employeeRequestFormId,
        candidate_count: candidatesForErf.length,
        interview_scheduled_count: interviewCandidatesForErf.size,
      }
    }),
  }
})
