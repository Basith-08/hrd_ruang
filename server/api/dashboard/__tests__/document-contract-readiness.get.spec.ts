import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAnyPermissionMock = vi.fn()
const requireRequestContextMock = vi.fn()
const listCandidateDocumentExplorerItemsForDashboardMock = vi.fn()
const listEmployeeContractFormsMock = vi.fn()

vi.mock('~~/server/lib/context.js', () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock('~~/server/utils/requestContext', () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock('~~/server/services/candidateDocumentExplorerReadService.js', () => ({
  listCandidateDocumentExplorerItemsForDashboard:
    listCandidateDocumentExplorerItemsForDashboardMock,
}))

vi.mock('~~/server/services/employeeContractFormService.js', () => ({
  listEmployeeContractForms: listEmployeeContractFormsMock,
}))

describe('GET /api/dashboard/document-contract-readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns zero summary when user has no document and contract access', async () => {
    requireRequestContextMock.mockResolvedValue({
      permissions: ['dashboard:read'],
    })

    const { default: handler } = await import('../document-contract-readiness.get')

    const result = await handler({} as any)

    expect(listCandidateDocumentExplorerItemsForDashboardMock).not.toHaveBeenCalled()
    expect(listEmployeeContractFormsMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      document_contract_readiness: {
        visible_document_candidates: 0,
        profiles_without_documents: 0,
        profiles_missing_cv: 0,
        profiles_with_contract_documents: 0,
        contract_form_total: 0,
        contract_form_ready: 0,
        contract_form_in_progress: 0,
        latest_contract_candidate: null,
      },
    })
  })

  it('aggregates document and contract readiness safely', async () => {
    requireRequestContextMock.mockResolvedValue({
      permissions: [
        'dashboard:read',
        'recruitment:document_explorer',
        'employee_contract_form:read',
      ],
    })
    listCandidateDocumentExplorerItemsForDashboardMock.mockResolvedValue([
      {
        documents: [
          { key: 'cv', files: ['cv-1.pdf'] },
          { key: 'format_office', files: ['contract.pdf'] },
        ],
      },
      {
        documents: [
          { key: 'cv', files: [] },
          { key: 'identity_card', files: ['ktp.pdf'] },
        ],
      },
      {
        documents: [],
      },
    ])
    listEmployeeContractFormsMock.mockResolvedValue([
      {
        candidate_name: 'Alex',
        contract_number: 'CTR-1',
        employee_code: 'EMP-1',
        contract_start_date: '2026-06-01',
        contract_end_date: '2027-06-01',
        approval_user_id: 'approver-1',
      },
      {
        candidate_name: 'Bima',
        contract_number: null,
        employee_code: 'EMP-2',
        contract_start_date: '2026-06-01',
        contract_end_date: null,
        approval_user_id: 'approver-2',
      },
    ])

    const { default: handler } = await import('../document-contract-readiness.get')

    const result = await handler({} as any)

    expect(result).toEqual({
      document_contract_readiness: {
        visible_document_candidates: 3,
        profiles_without_documents: 1,
        profiles_missing_cv: 2,
        profiles_with_contract_documents: 1,
        contract_form_total: 2,
        contract_form_ready: 1,
        contract_form_in_progress: 1,
        latest_contract_candidate: 'Alex',
      },
    })
  })
})
