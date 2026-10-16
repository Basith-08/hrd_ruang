import { appendHeader, defineEventHandler, setHeader } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { getExportJob } from '~~/server/lib/exportJobQueue'
import { requireRequestContext } from '~~/server/utils/requestContext'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export default defineEventHandler(async (event) => {
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

  if (job.status === 'failed') {
    throw createHttpError(409, job.error || 'Export job failed.')
  }

  if (job.status !== 'completed' || !job.result) {
    throw createHttpError(409, 'Export file is not ready yet.')
  }

  setHeader(event, 'Content-Type', job.result.contentType)
  setHeader(event, 'Content-Length', String(job.result.buffer.byteLength))
  appendHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${job.result.filename.replace(/"/g, '')}"`,
  )

  return job.result.buffer
})
