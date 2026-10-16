import { requireAnyPermission } from '~~/server/lib/context.js'
import { listExportCandidates } from '~~/server/services/export/export-payload-builder'
import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['export_configuration:manage', 'export_configuration:generate'])
  return listExportCandidates(context)
})
