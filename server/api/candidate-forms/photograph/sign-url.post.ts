import { readBody } from "h3"

import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"
import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { assertCandidateFormAssetAccess } from "~~/server/services/candidateFormAssetAccessService.js"
import { getCandidateServiceStorageSignedUrl } from "~~/server/services/candidateServiceClient.js"

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, [
    "candidate_form:read",
    "employee_form:read",
    "employee_contract_form:export_pdf",
  ])

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

  if (!bucket || !path) {
    throw createHttpError(400, "Bucket and path are required.")
  }

  await assertCandidateFormAssetAccess(context, candidateFormId, path, "photograph")

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
