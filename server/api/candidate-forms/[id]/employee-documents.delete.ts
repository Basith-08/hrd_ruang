import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { getCandidateFormForDashboard } from "~~/server/services/candidateFormReadService.js"
import { getEmployeeDocumentBucket } from "~~/server/services/candidateDatabaseReadService.js"
import { removeCandidateServiceCandidateFormEmployeeDocument } from "~~/server/services/candidateServiceClient.js"
import { getSupabaseAdmin } from "~~/server/services/supabaseAdmin.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

const ALLOWED_DOCUMENT_TYPES = ["format_office", "skb", "other"] as const

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ["employee_form:update_contract_documents"])

  const candidateFormId = normalizeText(event.context.params?.id)
  if (!candidateFormId) {
    throw createHttpError(400, "Candidate form id is required.")
  }

  const body = await readBody<{
    document_type?: unknown
    file_path?: unknown
  }>(event)

  const documentType = normalizeText(body?.document_type)
  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    throw createHttpError(400, "Document type is invalid.")
  }

  const filePath = normalizeText(body?.file_path)
  if (!filePath) {
    throw createHttpError(400, "File path is required.")
  }

  const candidateForm = await getCandidateFormForDashboard(context, candidateFormId)
  if (!candidateForm) {
    throw createHttpError(404, "Candidate form was not found.")
  }

  if (normalizeText(candidateForm.role).toLowerCase() !== "employee") {
    throw createHttpError(400, "Only employee forms manage contract documents.")
  }

  const candidateServiceFormId = normalizeText(candidateForm.candidate_service_form_id ?? candidateForm.id)
  if (normalizeText(candidateForm.candidate_source).toLowerCase() !== "candidate_service" || !candidateServiceFormId) {
    throw createHttpError(400, "Contract documents can only be managed for candidate service forms.")
  }

  const existingFiles = Array.isArray(candidateForm.employee_documents?.[documentType])
    ? candidateForm.employee_documents[documentType].map(normalizeText).filter(Boolean)
    : []

  if (!existingFiles.includes(filePath)) {
    throw createHttpError(404, "Document file was not found.")
  }

  await removeCandidateServiceCandidateFormEmployeeDocument(candidateServiceFormId, {
    document_type: documentType,
    file_path: filePath,
  })

  const { error: storageError } = await getSupabaseAdmin()
    .storage
    .from(getEmployeeDocumentBucket())
    .remove([filePath])

  if (storageError) {
    console.error(`Failed to remove employee document file from storage: ${filePath}`, storageError)
  }

  let updatedCandidateForm = await getCandidateFormForDashboard(context, candidateFormId)
  const employeeRequestFormId = normalizeText(updatedCandidateForm?.employee_request_form_id)

  if (employeeRequestFormId) {
    await syncRecruitmentFlowStage(context.supabase, employeeRequestFormId)
    updatedCandidateForm = await getCandidateFormForDashboard(context, candidateFormId)
  }

  return {
    candidate_form: updatedCandidateForm,
  }
})
