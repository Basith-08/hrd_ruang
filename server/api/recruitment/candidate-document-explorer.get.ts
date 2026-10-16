import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { listCandidateDocumentExplorerItemsForDashboard } from "~~/server/services/candidateDocumentExplorerReadService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ["recruitment:document_explorer"])

  return {
    items: await listCandidateDocumentExplorerItemsForDashboard(context),
  }
})
