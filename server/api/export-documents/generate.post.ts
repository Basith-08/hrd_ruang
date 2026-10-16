import { defineEventHandler, readBody, setHeader, setResponseStatus } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { generateDocxFromTemplate } from '~~/server/services/export/docx-generator'
import {
  buildGeneratedExportFileName,
  getExportCandidateById,
  validateGeneratePayload,
} from '~~/server/services/export/export-payload-builder'
import {
  createGeneratedExportHistory,
  downloadExportTemplateFile,
  getExportTemplateById,
  listExportTemplateFields,
} from '~~/server/services/export/export-template-service'
import { normalizeText } from '~~/server/services/export/export-utils'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineEventHandler(async (event) => {
  try {
    const context = await requireRequestContext(event)
    requireAnyPermission(context, ['export_configuration:generate'])

    const body = await readBody<{
      template_id?: string
      candidate_id?: string
      payload?: Record<string, unknown>
    }>(event)

    const templateId = normalizeText(body?.template_id)
    const candidateId = normalizeText(body?.candidate_id)
    const payload = body?.payload

    if (!templateId) {
      throw createHttpError(400, 'Template id is required.')
    }

    if (!candidateId) {
      throw createHttpError(400, 'Candidate id is required.')
    }

    const template = await getExportTemplateById(context.supabase, templateId)
    const fields = await listExportTemplateFields(context.supabase, template.id)
    const candidate = await getExportCandidateById(context, candidateId)
    const normalizedPayload = validateGeneratePayload(fields, payload ?? {})
    const templateBuffer = await downloadExportTemplateFile(context.supabase, template)
    const generatedBuffer = generateDocxFromTemplate(templateBuffer, normalizedPayload)
    const fileName = buildGeneratedExportFileName(
      normalizeText(normalizedPayload.candidate_name) || candidate.candidate_name,
    )

    await createGeneratedExportHistory(context.supabase, {
      templateId: template.id,
      candidateId: candidate.id,
      fileName,
      filePath: null,
      payload: normalizedPayload,
      generatedBy: context.userId,
    })

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    setHeader(event, 'Content-Length', String(generatedBuffer.byteLength))
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)

    return generatedBuffer
  } catch (error) {
    console.error(error)

    const status = Number((error as { status?: number } | null)?.status) || 500
    const expose =
      Boolean((error as { expose?: boolean } | null)?.expose) || (status >= 400 && status < 500)

    setResponseStatus(event, status)
    return {
      ok: false,
      error: expose && error instanceof Error ? error.message : 'Internal Server Error',
    }
  }
})
