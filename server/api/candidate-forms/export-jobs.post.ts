import { readBody } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { enqueueExportJob, serializeExportJob } from '~~/server/lib/exportJobQueue'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'
import { getCandidateFormsForDashboardByIds } from '~~/server/services/candidateFormReadService.js'
import { createCandidateFormsExcelExport } from '~~/server/services/candidateFormExportService'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['candidate_form:export_excel', 'employee_form:export_excel'])

  const userId = normalizeText(context.userId)
  if (!userId) {
    throw createHttpError(401, 'Authenticated user not found.')
  }

  const body = await readBody<{ candidate_form_ids?: unknown[] }>(event)
  const candidateFormIds = [
    ...new Set(
      (Array.isArray(body?.candidate_form_ids) ? body.candidate_form_ids : [])
        .map(normalizeText)
        .filter(Boolean),
    ),
  ]

  if (!candidateFormIds.length) {
    throw createHttpError(400, 'Candidate form ids are required.')
  }

  const candidateForms = await getCandidateFormsForDashboardByIds(context, candidateFormIds)
  if (!candidateForms.length) {
    throw createHttpError(404, 'Candidate forms were not found.')
  }

  const job = enqueueExportJob(userId, () => createCandidateFormsExcelExport(candidateForms))

  return {
    export_job: serializeExportJob(job),
  }
})
