import { createHttpError } from "~~/server/lib/errors.js"
import { getCandidateFormForDashboard } from "~~/server/services/candidateFormReadService.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function listEmployeeDocumentPaths(candidateForm) {
  const employeeDocuments =
    candidateForm?.employee_documents && typeof candidateForm.employee_documents === "object"
      ? candidateForm.employee_documents
      : {}

  return [
    ...new Set(
      Object.values(employeeDocuments)
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .map(normalizeText)
        .filter(Boolean),
    ),
  ]
}

function listErfDocumentPaths(candidateForm) {
  const documentErf = candidateForm?.employee_request_form?.document_erf
  return Array.isArray(documentErf) ? documentErf.map(normalizeText).filter(Boolean) : []
}

export async function assertCandidateFormAssetAccess(
  context,
  candidateFormId,
  path,
  assetType,
) {
  const normalizedCandidateFormId = normalizeText(candidateFormId)
  if (!normalizedCandidateFormId) {
    throw createHttpError(400, "candidate_form_id is required.")
  }

  const normalizedPath = normalizeText(path)
  if (!normalizedPath) {
    throw createHttpError(400, "Asset path is required.")
  }

  const candidateForm = await getCandidateFormForDashboard(context, normalizedCandidateFormId)
  if (!candidateForm) {
    throw createHttpError(404, "Candidate form was not found.")
  }

  if (assetType === "photograph") {
    if (normalizeText(candidateForm.photograph) !== normalizedPath) {
      throw createHttpError(403, "You do not have permission to access this file.")
    }

    return candidateForm
  }

  if (assetType === "erf_document") {
    if (!listErfDocumentPaths(candidateForm).includes(normalizedPath)) {
      throw createHttpError(403, "You do not have permission to access this file.")
    }

    return candidateForm
  }

  if (!listEmployeeDocumentPaths(candidateForm).includes(normalizedPath)) {
    throw createHttpError(403, "You do not have permission to access this file.")
  }

  return candidateForm
}
