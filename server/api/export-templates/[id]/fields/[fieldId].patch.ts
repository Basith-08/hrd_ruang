import { getRouterParam, readBody } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { updateExportTemplateField } from '~~/server/services/export/export-template-service'
import { normalizeText } from '~~/server/services/export/export-utils'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage'])

  const templateId = getRouterParam(event, 'id') ?? ''
  const fieldId = getRouterParam(event, 'fieldId') ?? ''
  const body = await readBody<{
    source_path?: string | null
    source_type?: string | null
    field_label?: string | null
    default_value?: string | null
    is_editable?: boolean
    is_required?: boolean
  }>(event)

  const field = await updateExportTemplateField(context.supabase, {
    templateId,
    fieldId,
    sourcePath: normalizeText(body?.source_path) || null,
    sourceType: normalizeText(body?.source_type) || 'auto',
    fieldLabel: body?.field_label,
    defaultValue: body?.default_value,
    isEditable: body?.is_editable,
    isRequired: body?.is_required,
  })

  return {
    field,
  }
})
