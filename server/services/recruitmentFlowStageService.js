import { getJakartaTimestamp } from "~~/server/lib/time.js"
import { listCandidateStatusSignalsByEmployeeRequestFormIds } from "~~/server/services/candidateDatabaseReadService.js"

const scoreMinValue = 1
const scoreMaxValue = 5
const requiredInterviewScoreCount = 10

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function isRecruitmentFlowStageConstraintError(error) {
  const message = normalizeText(error?.message).toLowerCase()
  return message.includes("employee_request_form_recruitment_flow_stage_check")
}

function warnRecruitmentFlowStageConstraint(stage) {
  console.warn(
    `[recruitment_flow_stage] database constraint does not allow stage "${stage}". Run the latest SQL migration for employee_request_form.recruitment_flow_stage.`,
  )
}

async function persistRecruitmentFlowStage(supabase, employeeRequestFormId, stage) {
  const { error } = await supabase
    .from("employee_request_form")
    .update({
      recruitment_flow_stage: stage,
      updated_at: getJakartaTimestamp(),
    })
    .eq("id", normalizeText(employeeRequestFormId))

  if (error) {
    if (isRecruitmentFlowStageConstraintError(error)) {
      warnRecruitmentFlowStageConstraint(stage)
      return false
    }

    throw new Error(error.message)
  }

  return true
}

export function mapVacancyStatusFromRecruitmentFlowStage(stage) {
  switch (normalizeText(stage)) {
    case "candidate_sourcing":
    case "assessment_list_created":
      return "sourcing"
    case "interview_scheduled":
    case "interview_evaluation_in_progress":
    case "interview_evaluation_completed":
      return "interview"
    case "candidate_selected":
    case "employee_contract_form_in_progress":
    case "hiring_completed":
      return "accepted"
    default:
      return "request"
  }
}

export async function listPersistedRecruitmentFlowStages(supabase, employeeRequestFormIds) {
  const normalizedEmployeeRequestFormIds = [
    ...new Set((Array.isArray(employeeRequestFormIds) ? employeeRequestFormIds : [])
      .map(normalizeText)
      .filter(Boolean)),
  ]

  if (!normalizedEmployeeRequestFormIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from("employee_request_form")
    .select("id, recruitment_flow_stage, status")
    .in("id", normalizedEmployeeRequestFormIds)

  if (error) {
    throw new Error(error.message)
  }

  const stageRows = Array.isArray(data) ? data : []
  for (const row of stageRows) {
    const currentStage = normalizeText(row?.recruitment_flow_stage)
    if (
      [
        "approval_in_progress",
        "waiting_bu_director_approval",
        "waiting_gm_hrd_approval",
        "waiting_hr_director_approval",
      ].includes(currentStage)
    ) {
      await persistRecruitmentFlowStage(supabase, normalizeText(row?.id), "approval_in_progress")
      row.recruitment_flow_stage = "approval_in_progress"
    }
  }
  const openTailStageIds = stageRows
    .filter((item) => {
      const status = normalizeText(item?.status).toLowerCase()
      const stage = normalizeText(item?.recruitment_flow_stage)

      if (status !== "open") {
        return false
      }

      return [
        "interview_evaluation_completed",
        "candidate_selected",
        "employee_contract_form_in_progress",
      ].includes(stage)
    })
    .map((item) => normalizeText(item?.id))
    .filter(Boolean)

  if (openTailStageIds.length > 0) {
    const candidates = await listCandidateStatusSignalsByEmployeeRequestFormIds(
      {
        isAdmin: true,
        isCandidate: false,
        isManager: false,
        userId: null,
      },
      openTailStageIds,
      supabase,
    )

    const nextStageByEmployeeRequestFormId = new Map()
    for (const employeeRequestFormId of openTailStageIds) {
      const relevantCandidates = candidates.filter(
        (candidate) => normalizeText(candidate?.employee_request_form_id) === employeeRequestFormId,
      )
      const hasCompletedEmployeeForm = relevantCandidates.some((candidate) =>
        normalizeText(candidate?.role).toLowerCase() !== "candidate" &&
        normalizeText(candidate?.candidate_form_completion_status).toLowerCase() === "completed",
      )
      const hasEmployeeContractDocuments = relevantCandidates.some((candidate) =>
        normalizeText(candidate?.role).toLowerCase() !== "candidate" &&
        normalizeText(candidate?.candidate_form_completion_status).toLowerCase() === "completed" &&
        Boolean(candidate?.candidate_form_has_contract_documents),
      )

      if (!hasCompletedEmployeeForm) {
        continue
      }

      nextStageByEmployeeRequestFormId.set(
        employeeRequestFormId,
        hasEmployeeContractDocuments ? "hiring_completed" : "employee_contract_form_in_progress",
      )
    }

    for (const row of stageRows) {
      const employeeRequestFormId = normalizeText(row?.id)
      const nextStage = nextStageByEmployeeRequestFormId.get(employeeRequestFormId)
      if (!employeeRequestFormId || !nextStage || normalizeText(row?.recruitment_flow_stage) === nextStage) {
        continue
      }

      if (nextStage === "hiring_completed") {
        await syncRecruitmentFlowStage(supabase, employeeRequestFormId)
        row.recruitment_flow_stage = "hiring_completed"
        continue
      }

      await persistRecruitmentFlowStage(supabase, employeeRequestFormId, nextStage)
      row.recruitment_flow_stage = nextStage
    }
  }

  return new Map(
    stageRows.map((item) => [
      normalizeText(item?.id),
      normalizeText(item?.recruitment_flow_stage) || null,
    ]),
  )
}

function hasStartedForm(candidate) {
  const completionStatus = normalizeText(candidate?.candidate_form_completion_status).toLowerCase()
  if (completionStatus === "completed") {
    return true
  }

  if (completionStatus !== "in_progress") {
    return false
  }

  const createdAt = normalizeText(candidate?.candidate_form_created_at)
  const updatedAt = normalizeText(candidate?.candidate_form_updated_at)

  return Boolean(createdAt && updatedAt && createdAt !== updatedAt)
}

function isRejectedChain(chain) {
  if (normalizeText(chain?.status) === "rejected") {
    return true
  }

  return Array.isArray(chain?.steps)
    ? chain.steps.some((step) => normalizeText(step?.status) === "rejected")
    : false
}

export function isCompletedInterviewer(interviewer) {
  const validScoreCount = (Array.isArray(interviewer?.scores) ? interviewer.scores : []).filter((score) => {
    const value = Number(score?.score)
    return Number.isFinite(value) && value >= scoreMinValue && value <= scoreMaxValue
  }).length

  return validScoreCount >= requiredInterviewScoreCount
}

async function getLatestApprovalChain(supabase, employeeRequestFormId) {
  const { data, error } = await supabase
    .from("approval_chains")
    .select("id, status, created_at, updated_at, steps:approval_steps(step_order, status)")
    .eq("employee_request_form_id", employeeRequestFormId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

async function getCandidateStageSignals(supabase, employeeRequestFormId) {
  const candidates = await listCandidateStatusSignalsByEmployeeRequestFormIds(
    {
      isAdmin: true,
      isCandidate: false,
      isManager: false,
      userId: null,
    },
    [employeeRequestFormId],
    supabase,
  )

  const relevantCandidates = candidates.filter(
    (candidate) => normalizeText(candidate?.employee_request_form_id) === employeeRequestFormId,
  )

  const hasStartedCandidateForm = relevantCandidates.some((candidate) =>
    normalizeText(candidate?.role).toLowerCase() === "candidate" &&
    hasStartedForm(candidate),
  )
  const hasStartedEmployeeForm = relevantCandidates.some((candidate) =>
    normalizeText(candidate?.role).toLowerCase() !== "candidate" &&
    hasStartedForm(candidate),
  )
  const hasCompletedEmployeeForm = relevantCandidates.some((candidate) =>
    normalizeText(candidate?.role).toLowerCase() !== "candidate" &&
    normalizeText(candidate?.candidate_form_completion_status).toLowerCase() === "completed",
  )
  const hasEmployeeContractDocuments = relevantCandidates.some((candidate) =>
    normalizeText(candidate?.role).toLowerCase() !== "candidate" &&
    Boolean(candidate?.candidate_form_is_submitted) &&
    Boolean(candidate?.candidate_form_has_contract_documents),
  )

  return {
    hasCandidates: relevantCandidates.length > 0,
    hasStartedCandidateForm,
    hasStartedEmployeeForm,
    hasCompletedEmployeeForm,
    hasEmployeeContractDocuments,
  }
}

async function closeEmployeeRequestFormAsHiredWhenReady(supabase, employeeRequestFormId) {
  const normalizedEmployeeRequestFormId = normalizeText(employeeRequestFormId)
  if (!normalizedEmployeeRequestFormId) {
    return false
  }

  const { data: employeeRequestForm, error: employeeRequestFormError } = await supabase
    .from("employee_request_form")
    .select("id, status")
    .eq("id", normalizedEmployeeRequestFormId)
    .maybeSingle()

  if (employeeRequestFormError) {
    throw new Error(employeeRequestFormError.message)
  }

  if (!employeeRequestForm || normalizeText(employeeRequestForm.status) === "closed") {
    return false
  }

  const candidateSignals = await getCandidateStageSignals(supabase, normalizedEmployeeRequestFormId)
  if (!candidateSignals.hasCompletedEmployeeForm || !candidateSignals.hasEmployeeContractDocuments) {
    return false
  }

  const { error: closeError } = await supabase
    .from("employee_request_form")
    .update({
      status: "closed",
      closed_date: new Date().toISOString(),
      closed_category: "employee hired",
      reason: "hired",
      updated_at: getJakartaTimestamp(),
    })
    .eq("id", normalizedEmployeeRequestFormId)

  if (closeError) {
    throw new Error(closeError.message)
  }

  return true
}

async function getInterviewStageSignals(supabase, employeeRequestFormId) {
  const { data, error } = await supabase
    .from("interview_evaluation_forms")
    .select(`
      id,
      interview_date,
      interviewers:interview_evaluation_interviewers(
        id,
        recommendation,
        scores:interview_evaluation_interviewer_scores(item_number, score)
      )
    `)
    .eq("employee_request_form_id", employeeRequestFormId)

  if (error) {
    throw new Error(error.message)
  }

  const forms = Array.isArray(data) ? data : []
  const hasForms = forms.length > 0
  const hasAnyCompletedInterviewer = forms.some((form) =>
    (Array.isArray(form?.interviewers) ? form.interviewers : []).some(isCompletedInterviewer),
  )
  const hasFullyCompletedCandidateInterview =
    hasForms &&
    forms.some((form) => {
      const interviewers = Array.isArray(form?.interviewers) ? form.interviewers : []
      return interviewers.length > 0 && interviewers.every(isCompletedInterviewer)
    })

  return {
    hasForms,
    hasAnyCompletedInterviewer,
    hasFullyCompletedCandidateInterview,
  }
}

export async function resolvePersistedRecruitmentFlowStage(supabase, employeeRequestFormId) {
  const normalizedEmployeeRequestFormId = normalizeText(employeeRequestFormId)

  if (!normalizedEmployeeRequestFormId) {
    throw new Error("Employee request form id is required.")
  }

  const { data: employeeRequestForm, error: employeeRequestFormError } = await supabase
    .from("employee_request_form")
    .select("id, status, closed_category, recruiter_user_id")
    .eq("id", normalizedEmployeeRequestFormId)
    .maybeSingle()

  if (employeeRequestFormError) {
    throw new Error(employeeRequestFormError.message)
  }

  if (!employeeRequestForm) {
    throw new Error("Employee request form not found.")
  }

  const [latestChain, candidateSignals, interviewSignals] = await Promise.all([
    getLatestApprovalChain(supabase, normalizedEmployeeRequestFormId),
    getCandidateStageSignals(supabase, normalizedEmployeeRequestFormId),
    getInterviewStageSignals(supabase, normalizedEmployeeRequestFormId),
  ])

  if (isRejectedChain(latestChain)) {
    return "rejected"
  }

  if (employeeRequestForm.status === "closed") {
    return employeeRequestForm.closed_category === "employee hired"
      ? "hiring_completed"
      : "closed"
  }

  const pendingStep = Array.isArray(latestChain?.steps)
    ? [...latestChain.steps]
        .sort((left, right) => Number(left?.step_order ?? 0) - Number(right?.step_order ?? 0))
        .find((step) => normalizeText(step?.status) === "pending")
    : null

  if (pendingStep) {
    return "approval_in_progress"
  }

  if (!latestChain || normalizeText(latestChain.status) === "draft") {
    return "erf_requested"
  }

  if (candidateSignals.hasCompletedEmployeeForm && !candidateSignals.hasEmployeeContractDocuments) {
    return "employee_contract_form_in_progress"
  }

  if (candidateSignals.hasStartedEmployeeForm) {
    return "candidate_selected"
  }

  if (interviewSignals.hasFullyCompletedCandidateInterview) {
    return "interview_evaluation_completed"
  }

  if (interviewSignals.hasAnyCompletedInterviewer) {
    return "interview_evaluation_in_progress"
  }

  if (interviewSignals.hasForms) {
    return "interview_scheduled"
  }

  if (candidateSignals.hasStartedCandidateForm) {
    return "assessment_list_created"
  }

  if (candidateSignals.hasCandidates) {
    return "candidate_sourcing"
  }

  if (normalizeText(employeeRequestForm.recruiter_user_id)) {
    return "assign_recruiter"
  }

  return "erf_approved"
}

export async function syncRecruitmentFlowStage(supabase, employeeRequestFormId) {
  await closeEmployeeRequestFormAsHiredWhenReady(supabase, employeeRequestFormId)

  const stage = await resolvePersistedRecruitmentFlowStage(supabase, employeeRequestFormId)
  await persistRecruitmentFlowStage(supabase, employeeRequestFormId, stage)

  return stage
}
