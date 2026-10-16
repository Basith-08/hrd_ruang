import { readBody } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import { generateDocxFromTemplate } from '~~/server/services/export/docx-generator'
import { getExportCandidateById, validateGeneratePayload } from '~~/server/services/export/export-payload-builder'
import { renderDocxPreviewHtml } from '~~/server/services/export/docx-preview'
import {
  downloadExportTemplateFile,
  getExportTemplateById,
  listExportTemplateFields,
} from '~~/server/services/export/export-template-service'
import { normalizeText } from '~~/server/services/export/export-utils'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
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
  await getExportCandidateById(context, candidateId)
  const normalizedPayload = validateGeneratePayload(fields, payload ?? {})
  const templateBuffer = await downloadExportTemplateFile(context.supabase, template)
  const generatedBuffer = generateDocxFromTemplate(templateBuffer, normalizedPayload)
  const html = await renderDocxPreviewHtml(generatedBuffer)

  return {
    html,
  }
})
