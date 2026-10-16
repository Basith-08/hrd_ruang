import { readBody } from "h3"

import { createHttpError } from "~~/server/lib/errors.js"
import { getCandidateServiceStorageSignedUrl } from "~~/server/services/candidateServiceClient.js"
import { getAssignedInterviewEvaluation } from "~~/server/services/interviewEvaluationService.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  const interviewEvaluationId = normalizeText(event.context.params?.id)
  const body = await readBody<{
    bucket?: string
    path?: string
  }>(event)

  const bucket = normalizeText(body?.bucket)
  const path = normalizeText(body?.path)

  if (!bucket || !path) {
    throw createHttpError(400, "Bucket and path are required.")
  }

  const evaluation = await getAssignedInterviewEvaluation(context, interviewEvaluationId)
  const candidateForm = evaluation.candidate_form
  const documents = Object.values(candidateForm?.employee_documents ?? {})
    .flat()
    .map((documentPath) => normalizeText(documentPath))
    .filter(Boolean)

  if (!documents.includes(path)) {
    throw createHttpError(403, "You do not have permission to access this document.")
  }

  if (candidateForm?.candidate_source === "candidate_service") {
    const candidateFormId = normalizeText(candidateForm?.id)
    if (!candidateFormId) {
      throw createHttpError(400, "candidate_form_id is required.")
    }

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
