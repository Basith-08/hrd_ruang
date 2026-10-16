import { beforeEach, describe, expect, it, vi } from 'vitest'

const listManagedCandidateUsersByEmployeeRequestFormIdsMock = vi.fn()
const switchCandidateServiceAccountToEmployeeMock = vi.fn()
const updateCandidateServiceAccountMock = vi.fn()
const syncRecruitmentFlowStageMock = vi.fn()
const getCandidateSupabaseAdminMock = vi.fn()

vi.mock('~~/server/services/candidateDatabaseReadService.js', () => ({
  listManagedCandidateUsersByEmployeeRequestFormIds:
    listManagedCandidateUsersByEmployeeRequestFormIdsMock,
}))

vi.mock('~~/server/services/candidateServiceClient.js', () => ({
  switchCandidateServiceAccountToEmployee: switchCandidateServiceAccountToEmployeeMock,
  updateCandidateServiceAccount: updateCandidateServiceAccountMock,
}))

vi.mock('~~/server/services/recruitmentFlowStageService.js', () => ({
  syncRecruitmentFlowStage: syncRecruitmentFlowStageMock,
}))

vi.mock('~~/server/services/candidateSupabaseAdmin.js', () => ({
  getCandidateSupabaseAdmin: getCandidateSupabaseAdminMock,
}))

function createSupabase(options?: { existingRecord?: Record<string, unknown> | null }) {
  const employeeRequestFormRecord = {
    id: 'erf-1',
    main_position: 'Software Engineer',
    employment_status: 'Permanent',
    department_ref: {
      name: 'Technology',
    },
    master_designation_ref: {
      name: 'Senior Staff',
    },
  }

  let currentRecord = options?.existingRecord ?? null
  const insertPayloads: Array<Record<string, unknown>> = []
  const updatePayloads: Array<Record<string, unknown>> = []

  return {
    __insertPayloads: insertPayloads,
    __updatePayloads: updatePayloads,
    from: vi.fn((table: string) => {
      if (table === 'employee_request_form') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: employeeRequestFormRecord,
                error: null,
              }),
            })),
          })),
        }
      }

      if (table === 'employee_contract_form') {
        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            insertPayloads.push(payload)
            currentRecord = {
              id: 'contract-1',
              ...payload,
              created_at: '2026-05-20T10:00:00.000Z',
              updated_at: '2026-05-20T10:00:00.000Z',
              employee_request_form: employeeRequestFormRecord,
              approval_user: null,
            }

            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'contract-1' },
                  error: null,
                }),
              })),
            }
          }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: currentRecord,
                error: null,
              }),
            })),
          })),
          update: vi.fn((payload: Record<string, unknown>) => {
            updatePayloads.push(payload)
            currentRecord = {
              ...currentRecord,
              ...payload,
              updated_at: '2026-05-20T11:00:00.000Z',
            }

            return {
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

function createListSupabase(rows: Array<Record<string, unknown>>) {
  const eqMock = vi.fn()

  return {
    __eqMock: eqMock,
    from: vi.fn((table: string) => {
      if (table !== 'employee_contract_form') {
        throw new Error(`Unexpected table: ${table}`)
      }

      return {
        select: vi.fn(() => ({
          order: vi.fn(() => {
            const builder: {
              eq: typeof eqMock
              then: (resolve: (value: { data: typeof rows; error: null }) => unknown) => unknown
            } = {
              eq: eqMock.mockImplementation((..._args: unknown[]) => builder),
              then: (resolve) => resolve({ data: rows, error: null }),
            }

            return builder
          }),
        })),
      }
    }),
  }
}

function createCandidateSupabase(options?: { candidateForm?: Record<string, unknown> | null }) {
  const candidateFormRecord = options?.candidateForm ?? {
    id: 'candidate-form-1',
  }
  const candidateFormUpdates: Array<Record<string, unknown>> = []
  const candidateApplicationUpdates: Array<Record<string, unknown>> = []

  return {
    __candidateFormUpdates: candidateFormUpdates,
    __candidateApplicationUpdates: candidateApplicationUpdates,
    from: vi.fn((table: string) => {
      if (table === 'candidate_form') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: candidateFormRecord,
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          })),
          update: vi.fn((payload: Record<string, unknown>) => {
            candidateFormUpdates.push(payload)
            return {
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }
          }),
        }
      }

      if (table === 'candidate_applications') {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            candidateApplicationUpdates.push(payload)
            return {
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              })),
            }
          }),
        }
      }

      throw new Error(`Unexpected candidate table: ${table}`)
    }),
  }
}

describe('employeeContractFormService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listManagedCandidateUsersByEmployeeRequestFormIdsMock.mockResolvedValue([
      {
        id: 'candidate-1',
        full_name: 'Candidate User',
        email: 'candidate@example.com',
      },
    ])
    switchCandidateServiceAccountToEmployeeMock.mockResolvedValue({
      candidate_id: 'candidate-1',
    })
    updateCandidateServiceAccountMock.mockResolvedValue({
      candidate_id: 'candidate-1',
    })
    syncRecruitmentFlowStageMock.mockResolvedValue(undefined)
  })

  it('allows creating a NECF record without optional contract fields', async () => {
    const supabase = createSupabase()
    const candidateSupabase = createCandidateSupabase()
    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    const context = {
      supabase,
      userId: 'user-1',
      roleName: 'staff recruitment',
      permissions: ['employee_contract_form:create', 'employee_contract_form:read'],
    }

    const { createEmployeeContractForm } = await import('../employeeContractFormService.js')
    const result = await createEmployeeContractForm(context as never, {
      employee_request_form_id: 'erf-1',
      candidate_id: 'candidate-1',
      contract_number: '',
      employee_code: 'EMP-002',
      contract_start_date: '',
      contract_end_date: '',
      approval_user_id: '',
    })

    expect(supabase.__insertPayloads).toEqual([
      expect.objectContaining({
        employee_request_form_id: 'erf-1',
        candidate_id: 'candidate-1',
        contract_number: null,
        employee_code: 'EMP-002',
        contract_start_date: null,
        contract_end_date: null,
        approval_user_id: null,
      }),
    ])
    expect(updateCandidateServiceAccountMock).toHaveBeenCalledWith('candidate-1', {
      employee_code: 'EMP-002',
      contract_number: null,
    })
    expect(candidateSupabase.__candidateFormUpdates).toEqual([
      expect.objectContaining({
        completion_status: 'in_progress',
      }),
    ])
    expect(candidateSupabase.__candidateApplicationUpdates).toEqual([
      expect.objectContaining({
        status: 'in_progress',
      }),
    ])
    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledWith(supabase, 'erf-1')
    expect(result).toMatchObject({
      id: 'contract-1',
      contract_number: null,
      employee_code: 'EMP-002',
      contract_start_date: null,
      contract_end_date: null,
      approval_user_id: null,
    })
  })

  it('allows updating a NECF record while clearing optional contract fields', async () => {
    const supabase = createSupabase({
      existingRecord: {
        id: 'contract-1',
        employee_request_form_id: 'erf-1',
        candidate_id: 'candidate-1',
        candidate_name: 'Candidate User',
        candidate_email: 'candidate@example.com',
        contract_number: 'CN-001',
        employee_code: 'EMP-001',
        contract_start_date: '2026-06-01',
        contract_end_date: '2027-06-01',
        approval_user_id: 'approver-1',
        created_at: '2026-05-20T10:00:00.000Z',
        updated_at: '2026-05-20T10:00:00.000Z',
        employee_request_form: {
          id: 'erf-1',
          main_position: 'Software Engineer',
          employment_status: 'Permanent',
          department_ref: {
            name: 'Technology',
          },
          master_designation_ref: {
            name: 'Senior Staff',
          },
        },
        approval_user: null,
      },
    })
    const candidateSupabase = createCandidateSupabase()
    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)
    const context = {
      supabase,
      userId: 'user-1',
      roleName: 'staff recruitment',
      permissions: ['employee_contract_form:update', 'employee_contract_form:read'],
    }

    const { updateEmployeeContractForm } = await import('../employeeContractFormService.js')
    const result = await updateEmployeeContractForm(context as never, 'contract-1', {
      employee_request_form_id: 'erf-1',
      candidate_id: 'candidate-1',
      contract_number: '',
      employee_code: 'EMP-002',
      contract_start_date: '',
      contract_end_date: '',
      approval_user_id: '',
    })

    expect(supabase.__updatePayloads).toEqual([
      expect.objectContaining({
        contract_number: null,
        employee_code: 'EMP-002',
        contract_start_date: null,
        contract_end_date: null,
        approval_user_id: null,
      }),
    ])
    expect(updateCandidateServiceAccountMock).toHaveBeenCalledWith('candidate-1', {
      employee_code: 'EMP-002',
      contract_number: null,
    })
    expect(candidateSupabase.__candidateFormUpdates).toEqual([])
    expect(candidateSupabase.__candidateApplicationUpdates).toEqual([])
    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledWith(supabase, 'erf-1')
    expect(result).toMatchObject({
      id: 'contract-1',
      contract_number: null,
      employee_code: 'EMP-002',
      contract_start_date: null,
      contract_end_date: null,
      approval_user_id: null,
    })
  })

  it('restricts a staff user without read_all to NECF records they created', async () => {
    const supabase = createListSupabase([
      { id: 'contract-1', created_by: 'user-1', employee_request_form: null, approval_user: null },
    ])
    const context = {
      supabase,
      userId: 'user-1',
      roleName: 'staff recruitment',
      permissions: ['employee_contract_form:read'],
    }

    const { listEmployeeContractForms } = await import('../employeeContractFormService.js')
    await listEmployeeContractForms(context as never)

    expect(supabase.__eqMock).toHaveBeenCalledWith('created_by', 'user-1')
  })

  it('lets a staff user with read_all see NECF records from other creators', async () => {
    const supabase = createListSupabase([
      {
        id: 'contract-1',
        created_by: 'someone-else',
        employee_request_form: null,
        approval_user: null,
      },
    ])
    const context = {
      supabase,
      userId: 'user-1',
      roleName: 'staff recruitment',
      permissions: ['employee_contract_form:read', 'employee_contract_form:read_all'],
    }

    const { listEmployeeContractForms } = await import('../employeeContractFormService.js')
    const result = await listEmployeeContractForms(context as never)

    expect(supabase.__eqMock).not.toHaveBeenCalled()
    expect(result).toMatchObject([{ id: 'contract-1' }])
  })

  it('does not restrict a non-staff role even without read_all', async () => {
    const supabase = createListSupabase([
      {
        id: 'contract-1',
        created_by: 'someone-else',
        employee_request_form: null,
        approval_user: null,
      },
    ])
    const context = {
      supabase,
      userId: 'user-1',
      roleName: 'recruiter',
      permissions: ['employee_contract_form:read'],
    }

    const { listEmployeeContractForms } = await import('../employeeContractFormService.js')
    const result = await listEmployeeContractForms(context as never)

    expect(supabase.__eqMock).not.toHaveBeenCalled()
    expect(result).toMatchObject([{ id: 'contract-1' }])
  })
})
