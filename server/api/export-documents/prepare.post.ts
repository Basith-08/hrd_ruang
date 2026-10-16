import { readBody } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { createHttpError } from '~~/server/lib/errors.js'
import {
  buildPreparedExportFields,
  getPreparedExportCandidateById,
} from '~~/server/services/export/export-payload-builder'
import {
  getExportTemplateById,
  listExportTemplateFields,
} from '~~/server/services/export/export-template-service'
import { normalizeText } from '~~/server/services/export/export-utils'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage', 'export_configuration:generate'])

  const body = await readBody<{ template_id?: string; candidate_id?: string }>(event)
  const templateId = normalizeText(body?.template_id)
  const candidateId = normalizeText(body?.candidate_id)

  if (!templateId) {
    throw createHttpError(400, 'Template id is required.')
  }

  if (!candidateId) {
    throw createHttpError(400, 'Candidate id is required.')
  }

  const template = await getExportTemplateById(context.supabase, templateId)
  const fields = await listExportTemplateFields(context.supabase, template.id)
  const preparedCandidate = await getPreparedExportCandidateById(context, candidateId)
  const candidate = preparedCandidate.candidate

  return {
    template: {
      id: template.id,
      name: template.name,
    },
    candidate: {
      id: candidate.id,
      candidate_name: candidate.candidate_name,
    },
    fields: buildPreparedExportFields(fields, candidate, preparedCandidate.sourceScope),
  }
})
