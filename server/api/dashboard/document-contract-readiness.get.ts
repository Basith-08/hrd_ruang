import { defineJsonHandler } from '~~/server/utils/api'
import { requireRequestContext } from '~~/server/utils/requestContext'
import { requireAnyPermission } from '~~/server/lib/context.js'
import { listCandidateDocumentExplorerItemsForDashboard } from '~~/server/services/candidateDocumentExplorerReadService.js'
import { listEmployeeContractForms } from '~~/server/services/employeeContractFormService.js'

function hasAnyPermission(context: { permissions: string[] }, permissions: string[]) {
  return permissions.some((permission) => context.permissions.includes(permission))
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function hasFiles(document: { files?: string[] } | null | undefined) {
  return Array.isArray(document?.files) && document.files.length > 0
}

function isContractFormReady(form: {
  contract_number?: string | null
  employee_code?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  approval_user_id?: string | null
}) {
  return [
    form?.contract_number,
    form?.employee_code,
    form?.contract_start_date,
    form?.contract_end_date,
    form?.approval_user_id,
  ].every((value) => normalizeText(value).length > 0)
}

function buildEmptySummary() {
  return {
    visible_document_candidates: 0,
    profiles_without_documents: 0,
    profiles_missing_cv: 0,
    profiles_with_contract_documents: 0,
    contract_form_total: 0,
    contract_form_ready: 0,
    contract_form_in_progress: 0,
    latest_contract_candidate: null,
  }
}

export default defineJsonHandler(async (event) => {
  const context = await requireRequestContext(event)
  requireAnyPermission(context, ['dashboard:read'])

  const canReadDocuments = hasAnyPermission(context, ['recruitment:document_explorer'])
  const canReadContracts = hasAnyPermission(context, ['employee_contract_form:read'])

  const [documentItems, contractForms] = await Promise.all([
    canReadDocuments
      ? listCandidateDocumentExplorerItemsForDashboard(context)
      : Promise.resolve([]),
    canReadContracts ? listEmployeeContractForms(context) : Promise.resolve([]),
  ])

  const profilesWithoutDocuments = documentItems.filter(
    (item) => !item.documents.some((document) => hasFiles(document)),
  ).length
  const profilesMissingCv = documentItems.filter((item) => {
    const cvDocument = item.documents.find((document) => normalizeText(document?.key) === 'cv')
    return !hasFiles(cvDocument)
  }).length
  const profilesWithContractDocuments = documentItems.filter((item) =>
    item.documents.some(
      (document) =>
        ['format_office', 'skb'].includes(normalizeText(document?.key)) && hasFiles(document),
    ),
  ).length
  const readyContractForms = contractForms.filter((form) => isContractFormReady(form))
  const latestContractForm = contractForms[0] ?? null

  return {
    document_contract_readiness: {
      visible_document_candidates: documentItems.length,
      profiles_without_documents: profilesWithoutDocuments,
      profiles_missing_cv: profilesMissingCv,
      profiles_with_contract_documents: profilesWithContractDocuments,
      contract_form_total: contractForms.length,
      contract_form_ready: readyContractForms.length,
      contract_form_in_progress: contractForms.length - readyContractForms.length,
      latest_contract_candidate:
        normalizeText(latestContractForm?.candidate_name) ||
        normalizeText(latestContractForm?.candidate_email) ||
        null,
    },
  }
})
