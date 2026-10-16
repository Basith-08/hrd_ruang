import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingleMock = vi.fn()
const inMock = vi.fn()
const orderMock = vi.fn()
const selectEqMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock,
}))
const selectMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock,
  eq: selectEqMock,
  in: inMock,
  order: orderMock,
}))
const eqStatusMock = vi.fn(() => ({
  select: selectMock,
}))
const eqIdMock = vi.fn(() => ({
  eq: eqStatusMock,
}))
const updateMock = vi.fn(() => ({
  eq: eqIdMock,
}))
const fromMock = vi.fn(() => ({
  select: selectMock,
  update: updateMock,
}))

const getAuthAccessScopeMock = vi.fn()
const resolveRecruitmentFlowStageMock = vi.fn()
const getJakartaTimestampMock = vi.fn(() => '2026-05-19T10:00:00+07:00')
const callBackendApiMock = vi.fn()

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}))

vi.mock('@/infrastructure/auth/accessScope', () => ({
  getAuthAccessScope: getAuthAccessScopeMock,
}))

vi.mock('@/infrastructure/utils/jakartaTime', () => ({
  getJakartaTimestamp: getJakartaTimestampMock,
}))

vi.mock('@/domain/utils/recruitmentFlowStage', () => ({
  resolveRecruitmentFlowStage: resolveRecruitmentFlowStageMock,
}))

vi.mock('@/infrastructure/http/backendApi', () => ({
  callBackendApi: callBackendApiMock,
}))

vi.mock('@/infrastructure/repositories', () => ({
  getInfrastructureRepositories: vi.fn(),
}))

describe('EmployeeRequestFormRepositoryImpl.assignRecruiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getAuthAccessScopeMock.mockResolvedValue({
      isManager: false,
      userId: 'user-1',
    })
    maybeSingleMock.mockResolvedValue({
      data: { id: 'erf-1' },
      error: null,
    })
    resolveRecruitmentFlowStageMock.mockReturnValue('erf_approved')
  })

  it('assigns recruiter without querying legacy approval date columns', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()
    vi.spyOn(repository, 'getById').mockResolvedValue({
      id: 'erf-1',
      status: 'open',
    } as any)

    await repository.assignRecruiter('erf-1', 'recruiter-1')

    expect(resolveRecruitmentFlowStageMock).toHaveBeenCalledWith({
      employeeRequestForm: expect.objectContaining({ id: 'erf-1', status: 'open' }),
    })
    expect(fromMock).toHaveBeenCalledWith('employee_request_form')
    expect(updateMock).toHaveBeenCalledWith({
      recruiter_user_id: 'recruiter-1',
      recruitment_flow_stage: 'assign_recruiter',
      updated_by: 'user-1',
      updated_at: '2026-05-19T10:00:00+07:00',
    })
    expect(eqIdMock).toHaveBeenCalledWith('id', 'erf-1')
    expect(eqStatusMock).toHaveBeenCalledWith('status', 'open')
  })

  it('rejects recruiter assignment when ERF is not in approved stage', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()
    vi.spyOn(repository, 'getById').mockResolvedValue({
      id: 'erf-1',
      status: 'open',
    } as any)
    resolveRecruitmentFlowStageMock.mockReturnValue('approval_in_progress')

    await expect(repository.assignRecruiter('erf-1', 'recruiter-1')).rejects.toThrow(
      'Only approved ERFs can be assigned to recruiters.',
    )

    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('EmployeeRequestFormRepositoryImpl.getAllForList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fills Business Unit Category from bu_id for list mode', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()

    vi.spyOn(repository as any, 'fetchBaseItems').mockResolvedValue([
      {
        id: 'erf-1',
        bu_id: 'bu-1',
        business_unit: null,
      },
    ])
    vi.spyOn(repository as any, 'attachApprovalSummaries').mockImplementation(async (items) => items)
    vi.spyOn(repository as any, 'attachListRecruitmentStatuses').mockImplementation(async (items) => items)

    inMock.mockResolvedValue({
      data: [
        { id: 'bu-1', name: 'Corporate' },
      ],
      error: null,
    })

    const result = await repository.getAllForList()

    expect(fromMock).toHaveBeenCalledWith('master_bu')
    expect(result).toEqual([
      expect.objectContaining({
        id: 'erf-1',
        bu_id: 'bu-1',
        business_unit: 'Corporate',
      }),
    ])
  })

  it('keeps requester display name in list mode', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()

    vi.spyOn(repository as any, 'fetchBaseItems').mockResolvedValue([
      {
        id: 'erf-1',
        bu_id: null,
        business_unit: null,
        created_by: 'user-1',
      },
    ])
    vi.spyOn(repository as any, 'attachBusinessUnits').mockImplementation(async (items) => items)
    vi.spyOn(repository as any, 'attachCreatorNames').mockResolvedValue([
      {
        id: 'erf-1',
        bu_id: null,
        business_unit: null,
        created_by: 'user-1',
        created_by_name: 'Hana Recruiter',
      },
    ])
    vi.spyOn(repository as any, 'attachApprovalSummaries').mockImplementation(async (items) => items)
    vi.spyOn(repository as any, 'attachListRecruitmentStatuses').mockImplementation(async (items) => items)

    const result = await repository.getAllForList()

    expect(result).toEqual([
      expect.objectContaining({
        id: 'erf-1',
        created_by_name: 'Hana Recruiter',
      }),
    ])
  })
})

describe('EmployeeRequestFormRepositoryImpl.getById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAuthAccessScopeMock.mockResolvedValue({
      isManager: false,
      userId: 'user-1',
    })
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'erf-1',
        created_by: 'user-1',
      },
      error: null,
    })
  })

  it('keeps creator name when supplementary data is skipped', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()

    vi.spyOn(repository as any, 'flattenCustomGroups').mockReturnValue({
      id: 'erf-1',
      created_by: 'user-1',
    })
    vi.spyOn(repository as any, 'attachBusinessUnits').mockResolvedValue([
      {
        id: 'erf-1',
        created_by: 'user-1',
      },
    ])
    vi.spyOn(repository as any, 'attachCreatorNames').mockResolvedValue([
      {
        id: 'erf-1',
        created_by: 'user-1',
        created_by_name: 'Hana Recruiter',
      },
    ])

    const approvalSpy = vi.spyOn(repository as any, 'attachApprovalSummaries')

    const result = await repository.getById('erf-1', { includeSupplementaryData: false })

    expect(result).toEqual(expect.objectContaining({
      id: 'erf-1',
      created_by_name: 'Hana Recruiter',
    }))
    expect(approvalSpy).not.toHaveBeenCalled()
  })
})

describe('EmployeeRequestFormRepositoryImpl.delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callBackendApiMock.mockResolvedValue({ ok: true })
  })

  it('deletes ERF through backend cascade endpoint', async () => {
    const { EmployeeRequestFormRepositoryImpl } = await import('./EmployeeRequestFormRepositoryImpl')
    const repository = new EmployeeRequestFormRepositoryImpl()

    await repository.delete('erf-1')

    expect(callBackendApiMock).toHaveBeenCalledWith('/api/employee-request-forms/erf-1', {
      method: 'DELETE',
    })
  })
})
