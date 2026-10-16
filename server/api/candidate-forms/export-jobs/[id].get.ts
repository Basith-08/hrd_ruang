import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { getExportJob, serializeExportJob } from '~~/server/lib/exportJobQueue'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

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

  const jobId = normalizeText(event.context.params?.id)
  if (!jobId) {
    throw createHttpError(400, 'Export job id is required.')
  }

  const job = getExportJob(jobId)
  if (!job || job.requestedByUserId !== userId) {
    throw createHttpError(404, 'Export job was not found.')
  }

  return {
    export_job: serializeExportJob(job),
  }
})
