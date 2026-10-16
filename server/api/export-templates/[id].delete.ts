import { getRouterParam } from 'h3'

import { requireAnyPermission } from '~~/server/lib/context.js'
import {
  deleteExportTemplate,
  deleteExportTemplateFile,
  getExportTemplateById,
} from '~~/server/services/export/export-template-service'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage'])

  const templateId = getRouterParam(event, 'id') || ''
  const template = await getExportTemplateById(context.supabase, templateId)

  await deleteExportTemplateFile(context.supabase, {
    bucketName: template.storage_bucket,
    filePath: template.file_path,
  })

  await deleteExportTemplate(context.supabase, template.id)

  return {
    success: true,
  }
})
