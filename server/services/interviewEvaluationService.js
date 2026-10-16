import { createHttpError } from "~~/server/lib/errors.js"
import { runInBackground } from "~~/server/lib/backgroundTask.js"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { isAdminRole, isEmail, isStaffRole } from "~~/server/lib/utils.js"
import { SMTP_USER } from "~~/server/config/env.js"
import {
  getCandidateFormForDashboard,
  listCandidateFormsForDashboard,
} from "~~/server/services/candidateFormReadService.js"
import { listCandidateStatusSignalsByEmployeeRequestFormIds } from "~~/server/services/candidateDatabaseReadService.js"
import { getTransporter } from "~~/server/services/mailer.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"

const scoreMinValue = 1
const scoreMaxValue = 5

const interviewCriteria = [
  {
    item_number: 1,
    category_title: "Work Experience",
    category_description:
      "Alignment of years of service, job type, and industry background with workforce requirements.",
  },
  {
    item_number: 2,
    category_title: "Education",
    category_description: "Alignment of educational background with workforce requirements.",
  },
  {
    item_number: 3,
    category_title: "Job Knowledge",
    category_description:
      "Alignment of technical and non-technical knowledge with workforce requirements.",
  },
  {
    item_number: 4,
    category_title: "Communication",
    category_description:
      "Ability to communicate required information clearly, accurately, and appropriately for the situation.",
  },
  {
    item_number: 5,
    category_title: "Motivation",
    category_description:
      "Candidate's ability and willingness to adapt, receive feedback, and grow within the work environment.",
  },
  {
    item_number: 6,
    category_title: "Creativity",
    category_description:
      "Candidate's ability to develop solutions and provide alternatives in decision-making.",
  },
  {
    item_number: 7,
    category_title: "Initiative",
    category_description:
      "Candidate's ability and willingness to start work without close supervision and actively support problem solving.",
  },
  {
    item_number: 8,
    category_title: "Emotional Control",
    category_description: "Candidate's ability to manage and express emotions professionally.",
  },
  {
    item_number: 9,
    category_title: "Leadership",
    category_description: "Candidate's ability to lead subordinates and delegate work effectively.",
  },
  {
    item_number: 10,
    category_title: "Decision Making",
    category_description:
      "Candidate's ability and courage to analyze situations and build and implement problem-solving concepts.",
  },
]

const recommendationValues = new Set([
  "continue_recruitment",
  "find_comparison_candidate",
  "stop_recruitment",
  "save_as_candidate_database",
])

const interviewEvaluationSelect = `
  *,
  interviewers:interview_evaluation_interviewers(
    *,
    scores:interview_evaluation_interviewer_scores(*)
  )
`

const interviewEvaluationSummarySelect = `
  id,
  employee_request_form_id,
  candidate_service_candidate_id,
  candidate_service_application_id,
  candidate_name,
  applied_position,
  interviewer_name,
  interviewer_recipients,
  interview_date,
  notes,
  created_at,
  updated_at,
  interviewers:interview_evaluation_interviewers(
    *,
    scores:interview_evaluation_interviewer_scores(item_number, score)
  )
`

function buildLegacySelectedCandidateOptionId(evaluationId) {
  return `legacy:${normalizeText(evaluationId)}`
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
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

function isEmployeePortalCandidate(candidate) {
  return normalizeText(candidate?.role).toLowerCase() !== "candidate"
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const interviewDateEmailMonthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatInterviewDateForEmail(value) {
  const normalizedValue = normalizeText(value)
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)

  if (!match) {
    return normalizedValue || "-"
  }

  const [, year, month, day, hour, minute] = match
  const monthName = interviewDateEmailMonthNames[Number(month) - 1] ?? month

  return `${Number(day)} ${monthName} ${year}, ${hour}:${minute}`
}

function buildCandidateName(candidateForm) {
  return (
    normalizeText(candidateForm?.full_name) ||
    [
      normalizeText(candidateForm?.first_name),
      normalizeText(candidateForm?.middle_name),
      normalizeText(candidateForm?.last_name),
    ].filter(Boolean).join(" ") ||
    normalizeText(candidateForm?.personal_email) ||
    "Unnamed Candidate"
  )
}

function buildCandidateOptionId(candidateForm) {
  const source =
    normalizeText(candidateForm?.candidate_source).toLowerCase() === "candidate_service"
      ? "candidate_service"
      : "local"

  return `${source}:${normalizeText(candidateForm?.id)}`
}

function mapCandidateOption(candidateForm) {
  const id = buildCandidateOptionId(candidateForm)
  const candidateName = buildCandidateName(candidateForm)

  if (!normalizeText(id) || !normalizeText(candidateName)) {
    return null
  }

  return {
    id,
    candidate_name: candidateName,
    applied_position: candidateForm?.employee_request_form?.main_position ?? null,
    employee_request_form_id: candidateForm?.employee_request_form_id ?? null,
    candidate_service_candidate_id: candidateForm?.candidate_service_candidate_id ?? null,
    candidate_service_application_id: candidateForm?.candidate_service_application_id ?? null,
    personal_email: candidateForm?.personal_email ?? null,
    phone_number: candidateForm?.phone_number ?? null,
    completion_status: candidateForm?.completion_status ?? null,
    updated_at: candidateForm?.updated_at ?? candidateForm?.created_at ?? null,
  }
}

function isCandidateFormRole(candidateForm) {
  return normalizeText(candidateForm?.role).toLowerCase() === "candidate"
}

function isCandidateFormMatchingEvaluation(candidateForm, evaluation) {
  const applicationId = normalizeText(candidateForm?.candidate_service_application_id)
  const candidateId = normalizeText(candidateForm?.candidate_service_candidate_id)
  const employeeRequestFormId = normalizeText(candidateForm?.employee_request_form_id)

  if (
    applicationId &&
    applicationId === normalizeText(evaluation?.candidate_service_application_id)
  ) {
    return true
  }

  if (
    candidateId &&
    candidateId === normalizeText(evaluation?.candidate_service_candidate_id)
  ) {
    return true
  }

  return (
    employeeRequestFormId &&
    employeeRequestFormId === normalizeText(evaluation?.employee_request_form_id) &&
    buildCandidateName(candidateForm) === normalizeText(evaluation?.candidate_name) &&
    normalizeText(candidateForm?.employee_request_form?.main_position) === normalizeText(evaluation?.applied_position)
  )
}

function normalizeScoreInput(scoreInput) {
  const itemNumber = Number(scoreInput?.item_number ?? 0)
  const rawScore = scoreInput?.score
  const score = rawScore === null || rawScore === "" || typeof rawScore === "undefined" ? null : Number(rawScore)

  return {
    item_number: itemNumber,
    score,
    info: normalizeText(scoreInput?.info),
  }
}

function normalizeInterviewerRecipients(input) {
  if (!Array.isArray(input)) return []

  return input
    .map((recipient) => {
      const userId = normalizeText(recipient?.user_id)
      const name = normalizeText(recipient?.name)
      const email = normalizeText(recipient?.email) || null
      const jobLevel = normalizeText(recipient?.job_level) || null
      const fallbackLabel = [name, jobLevel].filter(Boolean).join(" - ")
      const label = normalizeText(recipient?.label) || fallbackLabel

      if (!userId && !email && !label) return null

      return {
        user_id: userId,
        name: name || label,
        email,
        job_level: jobLevel,
        label,
      }
    })
    .filter(Boolean)
}

function validatePayload(payload, options = {}) {
  const requireScores = options.requireScores ?? true
  const selectedCandidateOptionId = normalizeText(payload?.selected_candidate_option_id)
  const interviewerRecipients = normalizeInterviewerRecipients(payload?.interviewer_recipients)
  const interviewerName =
    interviewerRecipients.map((recipient) => recipient.label).filter(Boolean).join(", ") ||
    normalizeText(payload?.interviewer_name)
  const interviewDate = normalizeText(payload?.interview_date)
  const notes = normalizeText(payload?.notes)
  const comments = normalizeText(payload?.comments)
  const recommendation = normalizeText(payload?.recommendation)
  const scores = Array.isArray(payload?.scores) ? payload.scores.map(normalizeScoreInput) : []

  if (!selectedCandidateOptionId) {
    throw createHttpError(400, "Please select a candidate to assess.")
  }

  if (!interviewerName) {
    throw createHttpError(400, "Interviewer name is required.")
  }

  if (!interviewDate || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(interviewDate)) {
    throw createHttpError(400, "Interview date must use the YYYY-MM-DDTHH:MM format.")
  }

  if (recommendation && !recommendationValues.has(recommendation)) {
    throw createHttpError(400, "Recommendation value is not valid.")
  }

  const scoreMap = new Map(scores.map((score) => [score.item_number, score]))

  for (const criterion of interviewCriteria) {
    const scoreEntry = scoreMap.get(criterion.item_number)

    if (!scoreEntry) {
      if (!requireScores) continue

      throw createHttpError(400, `Score for item ${criterion.item_number} is required.`)
    }

    if (!requireScores && scoreEntry.score === null) {
      continue
    }

    if (
      !Number.isInteger(scoreEntry.score) ||
      scoreEntry.score < scoreMinValue ||
      scoreEntry.score > scoreMaxValue
    ) {
      throw createHttpError(
        400,
        `Score for item ${criterion.item_number} must be between ${scoreMinValue} and ${scoreMaxValue}.`,
      )
    }
  }

  return {
    notes: notes || null,
    comments: comments || null,
    interviewer_name: interviewerName,
    interviewer_recipients: interviewerRecipients,
    interview_date: interviewDate,
    recommendation: recommendation || null,
    scores,
    selected_candidate_option_id: selectedCandidateOptionId,
  }
}

function buildInterviewEvaluationSubject(actionLabel, appliedPosition, candidateName) {
  const normalizedPosition = normalizeText(appliedPosition)
  const normalizedCandidateName = normalizeText(candidateName)

  if (normalizedPosition && normalizedCandidateName) {
    return `[Interview] ${actionLabel} - ${normalizedCandidateName} (${normalizedPosition})`
  }

  if (normalizedCandidateName) {
    return `[Interview] ${actionLabel} - ${normalizedCandidateName}`
  }

  return `[Interview] ${actionLabel}`
}

function buildInterviewEvaluationEmailHtml({
  interviewerName,
  candidateName,
  appliedPosition,
  interviewDate,
  notes,
  appOrigin,
  actionLabel,
}) {
  const safeInterviewerName = escapeHtml(interviewerName || "Interviewer")
  const safeCandidateName = escapeHtml(candidateName || "-")
  const safeAppliedPosition = escapeHtml(appliedPosition || "-")
  const safeInterviewDate = escapeHtml(formatInterviewDateForEmail(interviewDate))
  const safeNotes = escapeHtml(notes || "-")
  const redirectPath = "/interview-evaluations"
  const loginLink = `${String(appOrigin ?? "").replace(/\/$/, "")}/login?redirect=${encodeURIComponent(redirectPath)}`

  return `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Interview Notification</h2>
      <p>Dear ${safeInterviewerName},</p>
      <p>
        You have been ${escapeHtml(actionLabel.toLowerCase())} as an interviewer in the HRD Ruang.
      </p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 12px 6px 0; font-weight: 600;">Candidate</td>
          <td style="padding: 6px 0;">${safeCandidateName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; font-weight: 600;">Position</td>
          <td style="padding: 6px 0;">${safeAppliedPosition}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; font-weight: 600;">Interview Date</td>
          <td style="padding: 6px 0;">${safeInterviewDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px 6px 0; font-weight: 600;">Notes</td>
          <td style="padding: 6px 0;">${safeNotes}</td>
        </tr>
      </table>
      <a href="${escapeHtml(loginLink)}" style="display:inline-block; padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">
        Sign In to Review Interview
      </a>
      <p style="margin-top:20px; font-size: 12px; color: #666;">
        If the button above does not work, use this link:<br/>${escapeHtml(loginLink)}
      </p>
    </div>
  `
}

function getUniqueInterviewerRecipients(recipients) {
  const uniqueRecipients = new Map()

  for (const recipient of recipients) {
    const normalizedEmail = normalizeText(recipient?.email).toLowerCase()
    if (!normalizedEmail || !isEmail(normalizedEmail) || uniqueRecipients.has(normalizedEmail)) continue

    uniqueRecipients.set(normalizedEmail, {
      ...recipient,
      email: normalizedEmail,
    })
  }

  return Array.from(uniqueRecipients.values())
}

function mapInterviewersToRecipients(interviewers) {
  return (Array.isArray(interviewers) ? interviewers : [])
    .map((interviewer) => {
      const userId = normalizeText(interviewer?.interviewer_user_id)
      const name = normalizeText(interviewer?.interviewer_name)
      const email = normalizeText(interviewer?.interviewer_email) || null
      const jobLevel = normalizeText(interviewer?.interviewer_job_level) || null
      const label =
        normalizeText(interviewer?.interviewer_label) ||
        [name, jobLevel].filter(Boolean).join(" - ")

      if (!name && !label && !userId && !email) {
        return null
      }

      return {
        user_id: userId,
        name: name || label,
        email,
        job_level: jobLevel,
        label: label || name,
      }
    })
    .filter(Boolean)
}

function buildInterviewerRows(recipients, interviewerName) {
  const normalizedRecipients = normalizeInterviewerRecipients(recipients)

  if (normalizedRecipients.length > 0) {
    return normalizedRecipients.map((recipient) => ({
      interviewer_user_id: normalizeText(recipient.user_id) || null,
      interviewer_name: normalizeText(recipient.name) || normalizeText(recipient.label),
      interviewer_email: normalizeText(recipient.email) || null,
      interviewer_job_level: normalizeText(recipient.job_level) || null,
      interviewer_label:
        normalizeText(recipient.label) ||
        [normalizeText(recipient.name), normalizeText(recipient.job_level)]
          .filter(Boolean)
          .join(" - "),
      comments: null,
      recommendation: null,
    }))
  }

  const normalizedInterviewerName = normalizeText(interviewerName)
  if (!normalizedInterviewerName) {
    return []
  }

  return [
    {
      interviewer_user_id: null,
      interviewer_name: normalizedInterviewerName,
      interviewer_email: null,
      interviewer_job_level: null,
      interviewer_label: normalizedInterviewerName,
      comments: null,
      recommendation: null,
    },
  ]
}

function isMatchingInterviewerRow(existingRow, nextRow) {
  const existingUserId = normalizeText(existingRow?.interviewer_user_id)
  const nextUserId = normalizeText(nextRow?.interviewer_user_id)
  if (existingUserId || nextUserId) {
    if (existingUserId && nextUserId) {
      return existingUserId === nextUserId
    }

    const existingEmail = normalizeEmail(existingRow?.interviewer_email)
    const nextEmail = normalizeEmail(nextRow?.interviewer_email)
    return Boolean(existingEmail && nextEmail && existingEmail === nextEmail)
  }

  const existingEmail = normalizeEmail(existingRow?.interviewer_email)
  const nextEmail = normalizeEmail(nextRow?.interviewer_email)
  if (existingEmail && nextEmail && existingEmail === nextEmail) {
    return true
  }

  const existingLabel = normalizeText(existingRow?.interviewer_label)
  const nextLabel = normalizeText(nextRow?.interviewer_label)
  if (existingLabel && nextLabel && existingLabel === nextLabel) {
    return true
  }

  const existingName = normalizeText(existingRow?.interviewer_name)
  const nextName = normalizeText(nextRow?.interviewer_name)
  return Boolean(existingName && nextName && existingName === nextName)
}

async function syncInterviewEvaluationInterviewers(
  supabase,
  interviewEvaluationFormId,
  recipients,
  interviewerName,
  actorUserId,
) {
  const normalizedFormId = normalizeText(interviewEvaluationFormId)
  if (!normalizedFormId) {
    return []
  }

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("interview_evaluation_interviewers")
    .select("*")
    .eq("interview_evaluation_form_id", normalizedFormId)

  if (existingRowsError) {
    throw new Error(existingRowsError.message)
  }

  const existingRowsQueue = [...(existingRows ?? [])]
  const desiredRows = buildInterviewerRows(recipients, interviewerName)

  if (!desiredRows.length) {
    if (existingRowsQueue.length > 0) {
      const { error: deleteError } = await supabase
        .from("interview_evaluation_interviewers")
        .delete()
        .eq("interview_evaluation_form_id", normalizedFormId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }
    }

    return []
  }

  const matchedRows = []
  const rowsToInsert = []

  for (const desiredRow of desiredRows) {
    const matchIndex = existingRowsQueue.findIndex((existingRow) =>
      isMatchingInterviewerRow(existingRow, desiredRow),
    )

    if (matchIndex === -1) {
      rowsToInsert.push({
        interview_evaluation_form_id: normalizedFormId,
        created_by: actorUserId,
        updated_by: actorUserId,
        ...desiredRow,
      })
      continue
    }

    const [matchedRow] = existingRowsQueue.splice(matchIndex, 1)
    matchedRows.push(matchedRow)

    const { error: updateError } = await supabase
      .from("interview_evaluation_interviewers")
      .update({
        interviewer_user_id: desiredRow.interviewer_user_id,
        interviewer_name: desiredRow.interviewer_name,
        interviewer_email: desiredRow.interviewer_email,
        interviewer_job_level: desiredRow.interviewer_job_level,
        interviewer_label: desiredRow.interviewer_label,
        updated_by: actorUserId,
      })
      .eq("id", matchedRow.id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  if (existingRowsQueue.length > 0) {
    const staleIds = existingRowsQueue.map((row) => row.id).filter(Boolean)
    if (staleIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("interview_evaluation_interviewers")
        .delete()
        .in("id", staleIds)

      if (deleteError) {
        throw new Error(deleteError.message)
      }
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("interview_evaluation_interviewers")
      .insert(rowsToInsert)

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  const { data: syncedRows, error: syncedRowsError } = await supabase
    .from("interview_evaluation_interviewers")
    .select("*, scores:interview_evaluation_interviewer_scores(*)")
    .eq("interview_evaluation_form_id", normalizedFormId)

  if (syncedRowsError) {
    throw new Error(syncedRowsError.message)
  }

  return syncedRows ?? []
}

function isInterviewerRowAssignedToUser(interviewer, context) {
  const interviewerUserId = normalizeText(interviewer?.interviewer_user_id)
  const interviewerEmail = normalizeEmail(interviewer?.interviewer_email)
  const currentUserId = normalizeText(context?.userId)
  const currentUserEmail = normalizeEmail(context?.authUser?.email)

  return (
    (interviewerUserId && currentUserId && interviewerUserId === currentUserId) ||
    (interviewerEmail && currentUserEmail && interviewerEmail === currentUserEmail)
  )
}

function resolvePreferredInterviewer(interviewers, context, recipients = []) {
  const normalizedInterviewers = Array.isArray(interviewers) ? interviewers : []
  if (!normalizedInterviewers.length) {
    return null
  }

  const assignedInterviewer = normalizedInterviewers.find((interviewer) =>
    isInterviewerRowAssignedToUser(interviewer, context),
  )
  if (assignedInterviewer) {
    return assignedInterviewer
  }

  const normalizedRecipients = normalizeInterviewerRecipients(recipients)
  for (const recipient of normalizedRecipients) {
    const recipientUserId = normalizeText(recipient.user_id)
    const recipientLabel = normalizeText(recipient.label)
    const recipientName = normalizeText(recipient.name)
    const recipientEmail = normalizeEmail(recipient.email)

    const matchedInterviewer = recipientUserId
      ? normalizedInterviewers.find(
          (interviewer) => normalizeText(interviewer?.interviewer_user_id) === recipientUserId,
        )
      : normalizedInterviewers.find((interviewer) =>
          (recipientEmail && normalizeEmail(interviewer?.interviewer_email) === recipientEmail) ||
          (recipientLabel && normalizeText(interviewer?.interviewer_label) === recipientLabel) ||
          (recipientName && normalizeText(interviewer?.interviewer_name) === recipientName)
        )

    if (matchedInterviewer) {
      return matchedInterviewer
    }
  }

  return normalizedInterviewers[0] ?? null
}

function mapInterviewerScores(formId, interviewer) {
  return (Array.isArray(interviewer?.scores) ? interviewer.scores : [])
    .map((score) => ({
      ...score,
      interview_evaluation_form_id: formId,
    }))
    .sort((left, right) => Number(left?.item_number ?? 0) - Number(right?.item_number ?? 0))
}

function mapInterviewerResult(formId, interviewer) {
  if (!interviewer?.id) {
    return null
  }

  const name = normalizeText(interviewer?.interviewer_name)
  const label =
    normalizeText(interviewer?.interviewer_label) ||
    [name, normalizeText(interviewer?.interviewer_job_level)].filter(Boolean).join(" - ")

  if (
    !normalizeText(interviewer?.interviewer_user_id) &&
    !name &&
    !normalizeEmail(interviewer?.interviewer_email) &&
    !label
  ) {
    return null
  }

  return {
    id: interviewer.id,
    interview_evaluation_form_id: formId,
    interviewer: {
      user_id: normalizeText(interviewer?.interviewer_user_id),
      name: name || label,
      email: normalizeText(interviewer?.interviewer_email) || null,
      job_level: normalizeText(interviewer?.interviewer_job_level) || null,
      label: label || name,
    },
    comments: interviewer?.comments ?? null,
    recommendation: interviewer?.recommendation ?? null,
    scores: mapInterviewerScores(formId, interviewer),
  }
}

async function syncInterviewerEvaluationScores(supabase, interviewerId, scores, actorUserId) {
  const normalizedInterviewerId = normalizeText(interviewerId)
  if (!normalizedInterviewerId) {
    return
  }

  const { error: deleteError } = await supabase
    .from("interview_evaluation_interviewer_scores")
    .delete()
    .eq("interview_evaluation_interviewer_id", normalizedInterviewerId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const scoreMap = new Map((Array.isArray(scores) ? scores : []).map((score) => [score.item_number, score]))
  const rows = interviewCriteria.map((criterion) => {
    const scoreEntry = scoreMap.get(criterion.item_number)

    return {
      interview_evaluation_interviewer_id: normalizedInterviewerId,
      item_number: criterion.item_number,
      category_title: criterion.category_title,
      category_description: criterion.category_description,
      score: scoreEntry?.score ?? null,
      info: scoreEntry?.info ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    }
  })

  const { error: insertError } = await supabase
    .from("interview_evaluation_interviewer_scores")
    .insert(rows)

  if (insertError) {
    throw new Error(insertError.message)
  }
}

function calculateAverageScore(interviewers) {
  const validScores = (Array.isArray(interviewers) ? interviewers : [])
    .flatMap((interviewer) => (Array.isArray(interviewer?.scores) ? interviewer.scores : []))
    .map((score) => Number(score?.score))
    .filter((score) => Number.isFinite(score) && score > 0)

  if (!validScores.length) {
    return null
  }

  return Number((validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2))
}

async function syncInterviewEvaluationAverageScore(
  supabase,
  interviewEvaluationFormId,
  interviewers,
  actorUserId,
) {
  const normalizedFormId = normalizeText(interviewEvaluationFormId)
  if (!normalizedFormId) {
    return null
  }

  const averageScore = calculateAverageScore(interviewers)

  const { error } = await supabase
    .from("interview_evaluation_forms")
    .update({ average_score: averageScore, updated_by: actorUserId })
    .eq("id", normalizedFormId)

  if (error) {
    throw new Error(error.message)
  }

  return averageScore
}

async function notifyInterviewers({
  recipients,
  candidateName,
  appliedPosition,
  interviewDate,
  notes,
  appOrigin,
  actionLabel,
}) {
  const normalizedAppOrigin = normalizeText(appOrigin)
  if (!normalizedAppOrigin) return { sent: false, count: 0 }

  const uniqueRecipients = getUniqueInterviewerRecipients(recipients)
  if (uniqueRecipients.length === 0) return { sent: false, count: 0 }

  try {
    const transporter = getTransporter()
    await Promise.all(
      uniqueRecipients.map((recipient) =>
        transporter.sendMail({
          from: `"Recruitment" <${SMTP_USER}>`,
          to: recipient.email,
          subject: buildInterviewEvaluationSubject(actionLabel, appliedPosition, candidateName),
          html: buildInterviewEvaluationEmailHtml({
            interviewerName: recipient.name || recipient.label,
            candidateName,
            appliedPosition,
            interviewDate,
            notes,
            appOrigin: normalizedAppOrigin,
            actionLabel,
          }),
        }),
      ),
    )

    return { sent: true, count: uniqueRecipients.length }
  } catch (error) {
    console.warn("Failed to send interview notification email:", error)
    return { sent: false, count: 0 }
  }
}

function mapInterviewEvaluation(formRow, options = {}) {
  const interviewerResults = (Array.isArray(formRow?.interviewers) ? formRow.interviewers : [])
    .map((interviewer) => mapInterviewerResult(formRow?.id, interviewer))
    .filter(Boolean)
  const normalizedRecipients = mapInterviewersToRecipients(formRow?.interviewers)
  const interviewerRecipients =
    normalizedRecipients.length > 0
      ? normalizedRecipients
      : (Array.isArray(formRow?.interviewer_recipients)
          ? formRow.interviewer_recipients
          : [])
  const preferredInterviewer = resolvePreferredInterviewer(
    formRow?.interviewers,
    options.context,
    interviewerRecipients,
  )
  const interviewerScores = mapInterviewerScores(formRow?.id, preferredInterviewer)
  const joinedInterviewerName = normalizedRecipients
    .map((recipient) => recipient.label)
    .filter(Boolean)
    .join(", ")
  const averageScore = calculateAverageScore(formRow?.interviewers)

  return {
    ...formRow,
    average_score: averageScore,
    interviewer_name:
      normalizeText(preferredInterviewer?.interviewer_label) ||
      normalizeText(preferredInterviewer?.interviewer_name) ||
      joinedInterviewerName ||
      formRow?.interviewer_name ||
      "",
    interviewer_recipients: interviewerRecipients,
    comments: preferredInterviewer?.comments ?? null,
    recommendation: preferredInterviewer?.recommendation ?? null,
    scores: interviewerScores,
    interviewer_results: interviewerResults,
  }
}

function isCompletedEvaluation(evaluation) {
  const scores = Array.isArray(evaluation?.scores) ? evaluation.scores : []
  const scoreMap = new Map(scores.map((score) => [Number(score?.item_number), Number(score?.score)]))
  const hasAllScores = interviewCriteria.every((criterion) => {
    const score = scoreMap.get(criterion.item_number)
    return Number.isFinite(score) && score >= scoreMinValue && score <= scoreMaxValue
  })

  return hasAllScores && Boolean(normalizeText(evaluation?.recommendation))
}

function mapInterviewEvaluationSummary(formRow) {
  const mapped = formRow

  return {
    id: mapped.id,
    employee_request_form_id: mapped.employee_request_form_id ?? null,
    recruitment_flow_stage: mapped.recruitment_flow_stage ?? null,
    candidate_service_candidate_id: mapped.candidate_service_candidate_id ?? null,
    candidate_service_application_id: mapped.candidate_service_application_id ?? null,
    candidate_name: mapped.candidate_name,
    applied_position: mapped.applied_position,
    average_score: mapped.average_score ?? null,
    interviewer_name: mapped.interviewer_name,
    interviewer_recipients: [],
    interview_date: mapped.interview_date,
    notes: mapped.notes ?? null,
    comments: null,
    recommendation: null,
    created_by: null,
    updated_by: null,
    created_at: mapped.created_at ?? null,
    updated_at: mapped.updated_at ?? null,
    is_completed: isCompletedEvaluation(mapped),
    scores: [],
    interviewer_results: mapped.interviewer_results ?? [],
  }
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

function isRecipientAssignedToUser(recipient, context) {
  const recipientUserId = normalizeText(recipient?.user_id)
  const recipientEmail = normalizeEmail(recipient?.email)
  const currentUserId = normalizeText(context.userId)
  const currentUserEmail = normalizeEmail(context.authUser?.email)

  return (
    (recipientUserId && currentUserId && recipientUserId === currentUserId) ||
    (recipientEmail && currentUserEmail && recipientEmail === currentUserEmail)
  )
}

function isEvaluationAssignedToUser(evaluation, context) {
  const recipients = Array.isArray(evaluation?.interviewer_recipients)
    ? evaluation.interviewer_recipients
    : []

  return recipients.some((recipient) => isRecipientAssignedToUser(recipient, context))
}

function hasPermission(context, permissionName) {
  return Array.isArray(context.permissions) && context.permissions.includes(permissionName)
}

async function attachEmployeeRequestFormStageSummaries(context, evaluations) {
  const employeeRequestFormIds = [
    ...new Set(
      (Array.isArray(evaluations) ? evaluations : [])
        .map((evaluation) => normalizeText(evaluation?.employee_request_form_id))
        .filter(Boolean),
    ),
  ]

  if (!employeeRequestFormIds.length) {
    return Array.isArray(evaluations) ? evaluations : []
  }

  const candidateSignals = await listCandidateStatusSignalsByEmployeeRequestFormIds(
    {
      isAdmin: isAdminRole(context.roleName),
      isStaff: false,
      isCandidate: false,
      isManager: false,
      roleName: context.roleName,
      employeeRequestFormIds: [],
      userId: context.userId,
    },
    employeeRequestFormIds,
  )

  const { data, error } = await context.supabase
    .from("employee_request_form")
    .select("id, recruitment_flow_stage")
    .in("id", employeeRequestFormIds)

  if (error) {
    throw new Error(error.message)
  }

  const candidateSignalMap = new Map()
  for (const candidate of Array.isArray(candidateSignals) ? candidateSignals : []) {
    const employeeRequestFormId = normalizeText(candidate?.employee_request_form_id)
    if (!employeeRequestFormId) {
      continue
    }

    const current = candidateSignalMap.get(employeeRequestFormId) ?? []
    current.push(candidate)
    candidateSignalMap.set(employeeRequestFormId, current)
  }

  const stageMap = new Map(
    (data ?? []).map((item) => [
      normalizeText(item?.id),
      {
        recruitment_flow_stage: item?.recruitment_flow_stage ?? null,
      },
    ]),
  )

  return evaluations.map((evaluation) => {
    const employeeRequestFormId = normalizeText(evaluation?.employee_request_form_id)
    const stageSummary = stageMap.get(employeeRequestFormId)
    const candidateSignalsForErf = candidateSignalMap.get(employeeRequestFormId) ?? []

    const hasCompletedEmployeeFormWithoutContractDocuments = candidateSignalsForErf.some((candidate) =>
      isEmployeePortalCandidate(candidate) &&
      normalizeText(candidate?.candidate_form_completion_status).toLowerCase() === "completed" &&
      !candidate?.candidate_form_has_contract_documents,
    )
    const hasStartedEmployeeForm = candidateSignalsForErf.some((candidate) =>
      isEmployeePortalCandidate(candidate) &&
      hasStartedForm(candidate),
    )

    const nextRecruitmentFlowStage = stageSummary?.recruitment_flow_stage
      ?? evaluation?.recruitment_flow_stage
      ?? (hasCompletedEmployeeFormWithoutContractDocuments
        ? "employee_contract_form_in_progress"
        : hasStartedEmployeeForm
          ? "candidate_selected"
          : null)

    return {
      ...evaluation,
      recruitment_flow_stage: nextRecruitmentFlowStage,
    }
  })
}

async function getCandidateOptionsInternal(context) {
  const candidateForms = await listCandidateFormsForDashboard(context)

  return candidateForms
    .filter(isCandidateFormRole)
    .map(mapCandidateOption)
    .filter(Boolean)
    .sort((left, right) =>
      String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? "")),
    )
}

async function getCandidateFormForEvaluation(context, evaluation) {
  const candidateForms = await listCandidateFormsForDashboard(context)
  const matchedCandidateForm = candidateForms
    .filter(isCandidateFormRole)
    .find((candidateForm) => isCandidateFormMatchingEvaluation(candidateForm, evaluation))

  if (!matchedCandidateForm?.id) return null

  return getCandidateFormForDashboard(context, matchedCandidateForm.id)
}

async function requireExistingEvaluation(context, interviewEvaluationId) {
  const normalizedId = normalizeText(interviewEvaluationId)
  if (!normalizedId) {
    throw createHttpError(400, "Interview evaluation id is required.")
  }

  const { data, error } = await context.supabase
    .from("interview_evaluation_forms")
    .select("id")
    .eq("id", normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Interview evaluation was not found.")
  }

  return normalizedId
}

export async function listInterviewEvaluations(context) {
  const adminAccess = isAdminRole(context.roleName)

  if (!adminAccess) {
    requireAnyPermission(context, [
      "interview_evaluation:read",
      "interview_evaluation:interviewer_form",
      "recruitment:interview_evaluasi",
    ])
  }

  const { data, error } = await context.supabase
    .from("interview_evaluation_forms")
    .select(interviewEvaluationSelect)
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const evaluations = (data ?? []).map(mapInterviewEvaluation)

  if (
    adminAccess ||
    hasPermission(context, "interview_evaluation:read") ||
    hasPermission(context, "recruitment:interview_evaluasi")
  ) {
    const canReadAll = adminAccess || hasPermission(context, "interview_evaluation:read_all")
    const scopedEvaluations =
      isStaffRole(context.roleName) && !canReadAll && context.userId
        ? evaluations.filter((evaluation) => normalizeText(evaluation?.created_by) === context.userId)
        : evaluations

    return attachEmployeeRequestFormStageSummaries(context, scopedEvaluations)
  }

  if (hasPermission(context, "interview_evaluation:interviewer_form")) {
    return attachEmployeeRequestFormStageSummaries(
      context,
      evaluations.filter((evaluation) => isEvaluationAssignedToUser(evaluation, context)),
    )
  }

  return []
}

export async function listAssignedInterviewEvaluations(context) {
  const adminAccess = isAdminRole(context.roleName)

  if (!adminAccess) {
    requireAnyPermission(context, [
      "interview_evaluation:interviewer_form",
      "interview_evaluation:read",
      "interview_evaluation:update",
    ])
  }

  const { data, error } = await context.supabase
    .from("interview_evaluation_forms")
    .select(interviewEvaluationSummarySelect)
    .order("interview_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const evaluations = (data ?? []).map((row) => mapInterviewEvaluation(row, { context }))

  if (adminAccess || hasPermission(context, "interview_evaluation:read")) {
    return attachEmployeeRequestFormStageSummaries(
      context,
      evaluations.map(mapInterviewEvaluationSummary),
    )
  }

  return attachEmployeeRequestFormStageSummaries(
    context,
    evaluations
      .filter((evaluation) => isEvaluationAssignedToUser(evaluation, context))
      .map(mapInterviewEvaluationSummary),
  )
}

export async function getAssignedInterviewEvaluation(context, interviewEvaluationId) {
  const adminAccess = isAdminRole(context.roleName)

  if (!adminAccess) {
    requireAnyPermission(context, [
      "interview_evaluation:interviewer_form",
      "interview_evaluation:read",
      "interview_evaluation:update",
    ])
  }

  const normalizedId = normalizeText(interviewEvaluationId)
  if (!normalizedId) {
    throw createHttpError(400, "Interview evaluation id is required.")
  }

  const { data, error } = await context.supabase
    .from("interview_evaluation_forms")
    .select(interviewEvaluationSelect)
    .eq("id", normalizedId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw createHttpError(404, "Interview evaluation was not found.")
  }

  const evaluation = mapInterviewEvaluation(data, { context })
  if (
    !adminAccess &&
    !hasPermission(context, "interview_evaluation:read") &&
    !isEvaluationAssignedToUser(evaluation, context)
  ) {
    throw createHttpError(403, "You do not have permission to access this interview evaluation.")
  }

  evaluation.candidate_form = await getCandidateFormForEvaluation(context, evaluation)

  return evaluation
}

export async function listInterviewEvaluationCandidateOptions(context) {
  requireAnyPermission(context, [
    "interview_evaluation:read",
    "interview_evaluation:create",
    "interview_evaluation:update",
    "interview_evaluation:interviewer_form",
  ])

  return getCandidateOptionsInternal(context)
}

export async function createInterviewEvaluation(context, payload, options = {}) {
  requireAnyPermission(context, ["interview_evaluation:create"])

  const normalizedPayload = validatePayload(payload, { requireScores: payload?.schedule_only !== true })
  const candidateOptions = await getCandidateOptionsInternal(context)
  const selectedCandidate = candidateOptions.find(
    (option) => option.id === normalizedPayload.selected_candidate_option_id,
  )

  if (!selectedCandidate) {
    throw createHttpError(404, "Selected candidate was not found.")
  }

  const { data: createdForm, error: createError } = await context.supabase
    .from("interview_evaluation_forms")
    .insert({
      employee_request_form_id: selectedCandidate.employee_request_form_id,
      candidate_service_candidate_id: selectedCandidate.candidate_service_candidate_id,
      candidate_service_application_id: selectedCandidate.candidate_service_application_id,
      candidate_name: selectedCandidate.candidate_name,
      applied_position: selectedCandidate.applied_position,
      interviewer_name: normalizedPayload.interviewer_name,
      interviewer_recipients: normalizedPayload.interviewer_recipients,
      interview_date: normalizedPayload.interview_date,
      notes: normalizedPayload.notes,
      created_by: context.userId ?? null,
      updated_by: context.userId ?? null,
    })
    .select("id")
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  try {
    const syncedInterviewers = await syncInterviewEvaluationInterviewers(
      context.supabase,
      createdForm.id,
      normalizedPayload.interviewer_recipients,
      normalizedPayload.interviewer_name,
      context.userId ?? null,
    )

    const preferredInterviewer = resolvePreferredInterviewer(
      syncedInterviewers,
      context,
      normalizedPayload.interviewer_recipients,
    )

    if (preferredInterviewer?.id) {
      const { error: interviewerUpdateError } = await context.supabase
        .from("interview_evaluation_interviewers")
        .update({
          comments: normalizedPayload.comments,
          recommendation: normalizedPayload.recommendation,
          updated_by: context.userId ?? null,
        })
        .eq("id", preferredInterviewer.id)

      if (interviewerUpdateError) {
        throw new Error(interviewerUpdateError.message)
      }

      await syncInterviewerEvaluationScores(
        context.supabase,
        preferredInterviewer.id,
        normalizedPayload.scores,
        context.userId ?? null,
      )
    }

    const refreshedInterviewers = await context.supabase
      .from("interview_evaluation_interviewers")
      .select("*, scores:interview_evaluation_interviewer_scores(*)")
      .eq("interview_evaluation_form_id", createdForm.id)
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message)
        }

        return data ?? []
      })

    await syncInterviewEvaluationAverageScore(
      context.supabase,
      createdForm.id,
      refreshedInterviewers,
      context.userId ?? null,
    )
  } catch (syncError) {
    await context.supabase.from("interview_evaluation_forms").delete().eq("id", createdForm.id)
    throw syncError
  }

  const [createdEvaluation] = await context.supabase
    .from("interview_evaluation_forms")
    .select(interviewEvaluationSelect)
    .eq("id", createdForm.id)
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []).map(mapInterviewEvaluation)
    })

  if (!createdEvaluation) {
    throw createHttpError(500, "Failed to load the created interview evaluation.")
  }

  if (normalizeText(createdEvaluation.employee_request_form_id)) {
    await syncRecruitmentFlowStage(context.supabase, createdEvaluation.employee_request_form_id)
  }

  runInBackground(
    () =>
      notifyInterviewers({
        recipients: normalizedPayload.interviewer_recipients,
        candidateName: createdEvaluation.candidate_name,
        appliedPosition: createdEvaluation.applied_position,
        interviewDate: createdEvaluation.interview_date,
        notes: createdEvaluation.notes,
        appOrigin: options.appOrigin,
        actionLabel: "Interview Assigned",
      }),
    "interview assignment email",
  )

  return createdEvaluation
}

export async function updateInterviewEvaluation(context, interviewEvaluationId, payload, options = {}) {
  requireAnyPermission(context, [
    "interview_evaluation:update",
    "interview_evaluation:interviewer_form",
  ])

  const normalizedId = await requireExistingEvaluation(context, interviewEvaluationId)
  const [currentEvaluation] = await context.supabase
    .from("interview_evaluation_forms")
    .select("id, employee_request_form_id, candidate_service_candidate_id, candidate_service_application_id, candidate_name, applied_position, interviewer_name, interviewer_recipients, interviewers:interview_evaluation_interviewers(*)")
    .eq("id", normalizedId)
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []).map(mapInterviewEvaluation)
    })

  if (!currentEvaluation) {
    throw createHttpError(404, "Interview evaluation was not found.")
  }

  if (
    !hasPermission(context, "interview_evaluation:update") &&
    hasPermission(context, "interview_evaluation:interviewer_form") &&
    !isEvaluationAssignedToUser(currentEvaluation, context)
  ) {
    throw createHttpError(403, "You do not have permission to update this interview evaluation.")
  }

  const normalizedPayload = validatePayload(payload, {
    requireScores: payload?.schedule_only !== true,
  })
  const candidateOptions = await getCandidateOptionsInternal(context)
  let selectedCandidate = candidateOptions.find(
    (option) => option.id === normalizedPayload.selected_candidate_option_id,
  )

  if (
    !selectedCandidate &&
    normalizedPayload.selected_candidate_option_id === buildLegacySelectedCandidateOptionId(currentEvaluation.id)
  ) {
    selectedCandidate = {
      id: normalizedPayload.selected_candidate_option_id,
      candidate_name: currentEvaluation.candidate_name,
      applied_position: currentEvaluation.applied_position,
      employee_request_form_id: currentEvaluation.employee_request_form_id,
      candidate_service_candidate_id: currentEvaluation.candidate_service_candidate_id,
      candidate_service_application_id: currentEvaluation.candidate_service_application_id,
      personal_email: null,
      phone_number: null,
      completion_status: "completed",
      updated_at: currentEvaluation.updated_at ?? currentEvaluation.created_at ?? null,
    }
  }

  if (!selectedCandidate) {
    throw createHttpError(404, "Selected candidate was not found.")
  }

  const { error: updateError } = await context.supabase
    .from("interview_evaluation_forms")
    .update({
      employee_request_form_id: selectedCandidate.employee_request_form_id,
      candidate_service_candidate_id: selectedCandidate.candidate_service_candidate_id,
      candidate_service_application_id: selectedCandidate.candidate_service_application_id,
      candidate_name: selectedCandidate.candidate_name,
      applied_position: selectedCandidate.applied_position,
      interviewer_name: normalizedPayload.interviewer_name,
      interviewer_recipients: normalizedPayload.interviewer_recipients,
      interview_date: normalizedPayload.interview_date,
      notes: normalizedPayload.notes,
      updated_by: context.userId ?? null,
    })
    .eq("id", normalizedId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  const syncedInterviewers = await syncInterviewEvaluationInterviewers(
    context.supabase,
    normalizedId,
    normalizedPayload.interviewer_recipients,
    normalizedPayload.interviewer_name,
    context.userId ?? null,
  )

  const preferredInterviewer = resolvePreferredInterviewer(
    syncedInterviewers,
    context,
    normalizedPayload.interviewer_recipients,
  )

  if (preferredInterviewer?.id) {
    const { error: interviewerUpdateError } = await context.supabase
      .from("interview_evaluation_interviewers")
      .update({
        comments: normalizedPayload.comments,
        recommendation: normalizedPayload.recommendation,
        updated_by: context.userId ?? null,
      })
      .eq("id", preferredInterviewer.id)

    if (interviewerUpdateError) {
      throw new Error(interviewerUpdateError.message)
    }

    await syncInterviewerEvaluationScores(
      context.supabase,
      preferredInterviewer.id,
      normalizedPayload.scores,
      context.userId ?? null,
    )
  }

  const refreshedInterviewers = await context.supabase
    .from("interview_evaluation_interviewers")
    .select("*, scores:interview_evaluation_interviewer_scores(*)")
    .eq("interview_evaluation_form_id", normalizedId)
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message)
      }

      return data ?? []
    })

  await syncInterviewEvaluationAverageScore(
    context.supabase,
    normalizedId,
    refreshedInterviewers,
    context.userId ?? null,
  )

  const [updatedEvaluation] = await context.supabase
    .from("interview_evaluation_forms")
    .select(interviewEvaluationSelect)
    .eq("id", normalizedId)
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []).map(mapInterviewEvaluation)
    })

  if (!updatedEvaluation) {
    throw createHttpError(500, "Failed to load the updated interview evaluation.")
  }

  if (normalizeText(updatedEvaluation.employee_request_form_id)) {
    await syncRecruitmentFlowStage(context.supabase, updatedEvaluation.employee_request_form_id)
  }

  runInBackground(
    () =>
      notifyInterviewers({
        recipients: normalizedPayload.interviewer_recipients,
        candidateName: updatedEvaluation.candidate_name,
        appliedPosition: updatedEvaluation.applied_position,
        interviewDate: updatedEvaluation.interview_date,
        notes: updatedEvaluation.notes,
        appOrigin: options.appOrigin,
        actionLabel: "Interview Updated",
      }),
    "interview update email",
  )

  return updatedEvaluation
}

export async function deleteInterviewEvaluation(context, interviewEvaluationId) {
  requireAnyPermission(context, ["interview_evaluation:delete"])

  const normalizedId = await requireExistingEvaluation(context, interviewEvaluationId)
  const { data: existingRow, error: existingRowError } = await context.supabase
    .from("interview_evaluation_forms")
    .select("employee_request_form_id")
    .eq("id", normalizedId)
    .maybeSingle()

  if (existingRowError) {
    throw new Error(existingRowError.message)
  }

  const { error } = await context.supabase.from("interview_evaluation_forms").delete().eq("id", normalizedId)

  if (error) {
    throw new Error(error.message)
  }

  if (normalizeText(existingRow?.employee_request_form_id)) {
    await syncRecruitmentFlowStage(context.supabase, existingRow.employee_request_form_id)
  }
}
