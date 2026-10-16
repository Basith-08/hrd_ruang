import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { assertCandidateFormAssetAccess } from "~~/server/services/candidateFormAssetAccessService.js"
import { getCandidateServiceStorageSignedUrl } from "~~/server/services/candidateServiceClient.js"
import { getErfDocumentBucket } from "~~/server/services/candidateDatabaseReadService.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ["recruitment:document_explorer"])

  const body = await readBody<{
    bucket?: string
    candidate_form_id?: string
    path?: string
    storage_source?: "dashboard" | "candidate_service" | null
  }>(event)

  const bucket = String(body?.bucket ?? "").trim()
  const candidateFormId = String(body?.candidate_form_id ?? "").trim()
  const path = String(body?.path ?? "").trim()
  const storageSource = body?.storage_source === "candidate_service" ? "candidate_service" : "dashboard"

  if (!bucket || !candidateFormId || !path) {
    throw createHttpError(400, "Bucket, candidate_form_id, and path are required.")
  }

  const assetType =
    bucket === "candidate-photographs"
      ? "photograph"
      : bucket === getErfDocumentBucket()
        ? "erf_document"
        : "employee_document"

  await assertCandidateFormAssetAccess(context, candidateFormId, path, assetType)

  if (storageSource === "candidate_service") {
    return {
      signed_url: await getCandidateServiceStorageSignedUrl(bucket, candidateFormId, path),
    }
  }

  const { data, error } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error) {
    throw createHttpError(404, error.message)
  }

  return {
    signed_url: data.signedUrl,
  }
})
