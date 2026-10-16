import { readBody } from "h3"

import { requireAnyPermission } from "~~/server/lib/context.js"
import { createHttpError } from "~~/server/lib/errors.js"
import { getCandidateFormForDashboard } from "~~/server/services/candidateFormReadService.js"
import { appendCandidateServiceCandidateFormEmployeeDocuments } from "~~/server/services/candidateServiceClient.js"
import { syncRecruitmentFlowStage } from "~~/server/services/recruitmentFlowStageService.js"
import { defineJsonHandler } from "~~/server/utils/api"
import { requireRequestContext } from "~~/server/utils/requestContext"

const ALLOWED_DOCUMENT_TYPES = ["format_office", "skb", "other"] as const
const REQUIRED_CONTRACT_DOCUMENT_TYPES = ["format_office"] as const
const ALLOWED_DOCUMENT_TYPE_SET = new Set(ALLOWED_DOCUMENT_TYPES)

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
    file_paths?: unknown
    documents?: unknown
  }>(event)
  const incomingDocuments =
    body?.documents && typeof body.documents === "object" && !Array.isArray(body.documents)
      ? body.documents as Record<string, unknown>
      : null

  const documentsByType = Object.fromEntries(
    ALLOWED_DOCUMENT_TYPES.map((documentType) => [documentType, [] as string[]]),
  ) as Record<(typeof ALLOWED_DOCUMENT_TYPES)[number], string[]>

  if (incomingDocuments) {
    for (const documentType of ALLOWED_DOCUMENT_TYPES) {
      documentsByType[documentType] = [
        ...new Set(
          (Array.isArray(incomingDocuments[documentType]) ? incomingDocuments[documentType] : [])
            .map(normalizeText)
            .filter(Boolean),
        ),
      ]
    }
  } else {
    const documentType = normalizeText(body?.document_type)
    if (!ALLOWED_DOCUMENT_TYPE_SET.has(documentType as typeof ALLOWED_DOCUMENT_TYPES[number])) {
      throw createHttpError(400, "Document type is invalid.")
    }

    documentsByType[documentType as typeof ALLOWED_DOCUMENT_TYPES[number]] = [
      ...new Set(
        (Array.isArray(body?.file_paths) ? body.file_paths : [])
          .map(normalizeText)
          .filter(Boolean),
      ),
    ]
  }

  const candidateForm = await getCandidateFormForDashboard(context, candidateFormId)
  if (!candidateForm) {
    throw createHttpError(404, "Candidate form was not found.")
  }

  if (normalizeText(candidateForm.role).toLowerCase() !== "employee") {
    throw createHttpError(400, "Only employee forms can upload contract documents.")
  }

  if (normalizeText(candidateForm.completion_status).toLowerCase() !== "completed") {
    throw createHttpError(400, "Employee form must be submitted before uploading contract documents.")
  }

  const candidateServiceFormId = normalizeText(candidateForm.candidate_service_form_id ?? candidateForm.id)
  if (normalizeText(candidateForm.candidate_source).toLowerCase() !== "candidate_service" || !candidateServiceFormId) {
    throw createHttpError(400, "Contract documents can only be managed for candidate service forms.")
  }

  const currentEmployeeDocuments =
    candidateForm.employee_documents && typeof candidateForm.employee_documents === "object"
      ? candidateForm.employee_documents
      : {}
  const hasCompleteContractDocumentsAfterSubmit = REQUIRED_CONTRACT_DOCUMENT_TYPES.every((documentType) => {
    const existingFiles = Array.isArray(currentEmployeeDocuments?.[documentType])
      ? currentEmployeeDocuments[documentType].map(normalizeText).filter(Boolean)
      : []

    return existingFiles.length > 0 || documentsByType[documentType].length > 0
  })

  if (!hasCompleteContractDocumentsAfterSubmit) {
    throw createHttpError(
      400,
      "Draft Employment Contract must be available before submitting contract documents.",
    )
  }

  for (const documentType of ALLOWED_DOCUMENT_TYPES) {
    const filePaths = documentsByType[documentType as typeof ALLOWED_DOCUMENT_TYPES[number]]
    if (!filePaths.length) {
      continue
    }

    await appendCandidateServiceCandidateFormEmployeeDocuments(candidateServiceFormId, {
      document_type: documentType,
      file_paths: filePaths,
    })
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
