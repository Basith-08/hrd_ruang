import { getRouterParam } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import { listExportTemplateFields } from '~~/server/services/export/export-template-service'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage'])

  const templateId = getRouterParam(event, 'id') ?? ''
  return listExportTemplateFields(context.supabase, templateId)
})
