import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'
import { requireAnyPermission } from '~~/server/lib/context.js'
import { isAdminRole } from '~~/server/lib/utils.js'
import { listAssignedInterviewEvaluations } from '~~/server/services/interviewEvaluationService.js'

function hasAnyPermission(context: { permissions: string[] }, permissions: string[]) {
  return permissions.some((permission) => context.permissions.includes(permission))
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildEmptySummary() {
  return {
    visible_count: 0,
    pending_count: 0,
    completed_count: 0,
    upcoming_count: 0,
    nearest_interview: null,
    upcoming_interviews: [],
  }
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['dashboard:read'])

  const canReadInterviewMonitor =
    isAdminRole(context.roleName) ||
    hasAnyPermission(context, [
      'interview_evaluation:read',
      'interview_evaluation:interviewer_form',
      'recruitment:interview_evaluasi',
    ])

  if (!canReadInterviewMonitor) {
    return {
      interview_monitor: buildEmptySummary(),
    }
  }

  const evaluations = await listAssignedInterviewEvaluations(context)
  const todayKey = new Date().toISOString().slice(0, 10)
  const completedCount = evaluations.filter(
    (evaluation) => evaluation?.is_completed === true,
  ).length
  const pendingCount = evaluations.length - completedCount
  const upcomingEvaluations = evaluations.filter(
    (evaluation) => normalizeText(evaluation?.interview_date) >= todayKey,
  )
  const nearestInterview = upcomingEvaluations[0] ?? null

  return {
    interview_monitor: {
      visible_count: evaluations.length,
      pending_count: pendingCount,
      completed_count: completedCount,
      upcoming_count: upcomingEvaluations.length,
      nearest_interview: nearestInterview
        ? {
            candidate_name: nearestInterview.candidate_name ?? null,
            interview_date: normalizeText(nearestInterview.interview_date) || null,
            interviewer_name: normalizeText(nearestInterview.interviewer_name) || null,
            applied_position: nearestInterview.applied_position ?? null,
          }
        : null,
      upcoming_interviews: upcomingEvaluations.slice(0, 4).map((evaluation) => ({
        candidate_name: evaluation.candidate_name ?? null,
        interview_date: normalizeText(evaluation.interview_date) || null,
        interviewer_name: normalizeText(evaluation.interviewer_name) || null,
        applied_position: evaluation.applied_position ?? null,
      })),
    },
  }
})
