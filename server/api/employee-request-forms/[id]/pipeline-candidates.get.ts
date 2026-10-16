import { createHttpError } from "~~/server/lib/errors.js"
import { isStaffRole } from "~~/server/lib/utils.js"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { listManagedCandidateUsersByEmployeeRequestFormIds } from "~~/server/services/candidateDatabaseReadService.js"
import { isCompletedInterviewer } from "~~/server/services/recruitmentFlowStageService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function buildCandidateKeys(candidate) {
  const keys = []

  const applicationId = normalizeText(candidate?.candidate_service_application_id)
  if (applicationId) {
    keys.push(`application:${applicationId}`)
  }

  const candidateId = normalizeText(candidate?.candidate_service_candidate_id)
  if (candidateId) {
    keys.push(`candidate:${candidateId}`)
  }

  const candidateName = normalizeText(candidate?.full_name ?? candidate?.email)
  if (candidateName) {
    keys.push(`name:${candidateName.toLowerCase()}`)
  }

  return keys
}

function buildInterviewCandidateKeys(row) {
  const keys = []

  const applicationId = normalizeText(row?.candidate_service_application_id)
  if (applicationId) {
    keys.push(`application:${applicationId}`)
  }

  const candidateId = normalizeText(row?.candidate_service_candidate_id)
  if (candidateId) {
    keys.push(`candidate:${candidateId}`)
  }

  const candidateName = normalizeText(row?.candidate_name)
  if (candidateName) {
    keys.push(`name:${candidateName.toLowerCase()}`)
  }

  return keys
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, [
    "employee_request_form:read",
    "employee_contract_form:read",
    "employee_contract_form:create",
    "employee_contract_form:update",
    "recruitment:approved_erf_read",
    "recruitment:vacancy_pipeline",
    "recruitment:vacancy_pipeline_detail",
    "recruitment:closed_vacancy_detail",
  ])

  const employeeRequestFormId = normalizeText(event.context.params?.id)
  if (!employeeRequestFormId) {
    throw createHttpError(400, "Employee request form id is required.")
  }

  const { data: employeeRequestForm, error: employeeRequestFormError } = await context.supabase
    .from("employee_request_form")
    .select("id, status, recruitment_flow_stage")
    .eq("id", employeeRequestFormId)
    .maybeSingle()

  if (employeeRequestFormError) {
    throw new Error(employeeRequestFormError.message)
  }

  if (!employeeRequestForm) {
    throw createHttpError(404, "Employee request form was not found.")
  }

  const candidates = await listManagedCandidateUsersByEmployeeRequestFormIds(
    {
      isStaff: isStaffRole(context.roleName),
      roleName: context.roleName,
      userId: context.userId,
    },
    [employeeRequestFormId],
  )

  const { data: interviewRows, error: interviewError } = await context.supabase
    .from("interview_evaluation_forms")
    .select(
      `
      employee_request_form_id,
      interview_date,
      candidate_service_application_id,
      candidate_service_candidate_id,
      candidate_name,
      interviewers:interview_evaluation_interviewers(
        id,
        recommendation,
        scores:interview_evaluation_interviewer_scores(item_number, score)
      )
      `,
    )
    .eq("employee_request_form_id", employeeRequestFormId)
    .not("interview_date", "is", null)
    .order("interview_date", { ascending: true })

  if (interviewError) {
    throw new Error(interviewError.message)
  }

  const { data: contractRows, error: contractError } = await context.supabase
    .from("employee_contract_form")
    .select("candidate_id")
    .eq("employee_request_form_id", employeeRequestFormId)

  if (contractError) {
    throw new Error(contractError.message)
  }

  const candidateIdsWithContract = new Set(
    (contractRows ?? []).map((row) => normalizeText(row?.candidate_id)).filter(Boolean),
  )

  const interviewDatesByCandidateKey = new Map()
  const completedInterviewCandidateKeys = new Set()

  for (const row of interviewRows ?? []) {
    const candidateKeys = buildInterviewCandidateKeys(row)
    const interviewDate = normalizeText(row?.interview_date)
    if (!candidateKeys.length || !interviewDate) continue

    const interviewers = Array.isArray(row?.interviewers) ? row.interviewers : []
    const isFormCompleted = interviewers.length > 0 && interviewers.every(isCompletedInterviewer)

    for (const candidateKey of candidateKeys) {
      const current = interviewDatesByCandidateKey.get(candidateKey) ?? []
      if (!current.includes(interviewDate)) {
        current.push(interviewDate)
      }
      interviewDatesByCandidateKey.set(candidateKey, current)

      if (isFormCompleted) {
        completedInterviewCandidateKeys.add(candidateKey)
      }
    }
  }

  return {
    candidates: candidates
      .map((candidate) => {
        const candidateKeys = buildCandidateKeys(candidate)
        const interviewDates = [
          ...new Set(
            candidateKeys.flatMap((candidateKey) => interviewDatesByCandidateKey.get(candidateKey) ?? []),
          ),
        ]
        const hasCompletedInterview = candidateKeys.some((candidateKey) =>
          completedInterviewCandidateKeys.has(candidateKey),
        )

        const id = normalizeText(candidate?.id)

        return {
          id,
          full_name: normalizeText(candidate?.full_name) || null,
          email: normalizeText(candidate?.email) || null,
          role: normalizeText(candidate?.role) || "candidate",
          interview_dates: interviewDates,
          hasCompletedInterview,
          hasExistingContract: candidateIdsWithContract.has(id),
        }
      })
      .sort((left, right) =>
        String(left.full_name ?? left.email ?? left.id).localeCompare(
          String(right.full_name ?? right.email ?? right.id),
        ),
      ),
  }
})
