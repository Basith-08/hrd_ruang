import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAnyPermissionMock = vi.fn()
const listManagedCandidateUsersFromCandidateDatabaseMock = vi.fn()

vi.mock('~~/server/lib/errors.js', () => ({
  createHttpError: (statusCode: number, message: string) => {
    const error = new Error(message) as Error & { statusCode?: number; expose?: boolean }
    error.statusCode = statusCode
    error.expose = true
    return error
  },
}))

vi.mock('~~/server/lib/time.js', () => ({
  getJakartaTimestamp: vi.fn(),
}))

vi.mock('~~/server/lib/utils.js', () => ({
  buildPersonalData: vi.fn(),
  extractCreatorId: vi.fn(),
  isNonEmptyString: (value: unknown) => typeof value === 'string' && value.trim().length > 0,
  isStaffRole: (roleName: unknown) =>
    String(roleName ?? '')
      .trim()
      .toLowerCase()
      .startsWith('staff'),
  normalizeRoleName: (roleName: unknown) =>
    String(roleName ?? '')
      .trim()
      .toLowerCase(),
  readPersonalDataString: vi.fn(),
}))

vi.mock('~~/server/lib/context.js', () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock('~~/server/lib/backgroundTask.js', () => ({
  runInBackground: vi.fn(),
}))

vi.mock('~~/server/services/candidateServiceClient.js', () => ({
  addCandidateServiceApplication: vi.fn(),
  createCandidateServiceAccount: vi.fn(),
  resetCandidateServicePassword: vi.fn(),
  revokeCandidateServiceAccount: vi.fn(),
  setCandidateServiceAccountActive: vi.fn(),
  switchCandidateServiceAccountToEmployee: vi.fn(),
  updateCandidateServiceAccount: vi.fn(),
}))

vi.mock('~~/server/services/candidateProjectionService.js', () => ({
  decodeCandidateServiceUserId: vi.fn(),
}))

vi.mock('~~/server/services/candidateDatabaseReadService.js', () => ({
  assertStaffCanManageCandidateAccount: vi.fn(),
  getManagedCandidateUserFromCandidateDatabase: vi.fn(),
  listCandidateBindingsByIdentityUserIdsFromCandidateDatabase: vi.fn(),
  listManagedCandidateUsersFromCandidateDatabase:
    listManagedCandidateUsersFromCandidateDatabaseMock,
  loadCandidateUserHistoryFromCandidateDatabase: vi.fn(),
}))

vi.mock('~~/server/services/candidateCredentialEmailService.js', () => ({
  sendCandidateCredentialEmailIfEligible: vi.fn(),
}))

describe('userManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([])
  })

  it('handles users scope without throwing when no internal profiles exist', async () => {
    const profilesOrderMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const profilesEqMock = vi.fn(() => ({ order: profilesOrderMock }))
    const profilesSelectMock = vi.fn(() => ({ eq: profilesEqMock }))
    const fromMock = vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: profilesSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { loadManagedUsers } = await import('../userManagementService.js')

    await expect(
      loadManagedUsers(
        {
          roleName: 'super_admin',
          userId: 'admin-1',
          supabase: { from: fromMock },
        },
        'users',
      ),
    ).resolves.toEqual([])

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ roleName: 'super_admin', userId: 'admin-1' }),
      ['user:read', 'candidate_employee:read'],
    )
    expect(listManagedCandidateUsersFromCandidateDatabaseMock).not.toHaveBeenCalled()
  })

  it('filters candidate and employee roles for candidateEmployee scope', async () => {
    const rolesOrderMock = vi.fn().mockResolvedValue({
      data: [
        { id: 'role-admin', name: 'Admin', description: null },
        { id: 'role-candidate', name: 'Candidate', description: null },
        { id: 'role-employee', name: 'Employee', description: null },
      ],
      error: null,
    })
    const rolesSelectMock = vi.fn(() => ({ order: rolesOrderMock }))
    const fromMock = vi.fn((table: string) => {
      if (table === 'roles') {
        return { select: rolesSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { loadUserManagementRoles } = await import('../userManagementService.js')

    await expect(
      loadUserManagementRoles(
        {
          roleName: 'super_admin',
          userId: 'admin-1',
          supabase: { from: fromMock },
        },
        'candidateEmployee',
      ),
    ).resolves.toEqual([
      { id: 'role-candidate', name: 'Candidate', description: null },
      { id: 'role-employee', name: 'Employee', description: null },
    ])
  })

  it('rejects candidate account creation when an approved ERF has no recruiter assigned', async () => {
    const roleSingleMock = vi.fn().mockResolvedValue({
      data: { name: 'candidate' },
      error: null,
    })
    const roleEqMock = vi.fn(() => ({ single: roleSingleMock }))
    const roleSelectMock = vi.fn(() => ({ eq: roleEqMock }))

    const bindingMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'erf-1',
        pt_id: 'pt-1',
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        main_position: 'Backend Engineer',
        recruiter_user_id: null,
        recruitment_flow_stage: 'erf_approved',
        pt_ref: { name: 'PT One' },
        department_ref: { name: 'Engineering' },
        master_designation_ref: { name: 'Senior' },
      },
      error: null,
    })
    const bindingEqMock = vi.fn(() => ({ maybeSingle: bindingMaybeSingleMock }))
    const bindingSelectMock = vi.fn(() => ({ eq: bindingEqMock }))

    const fromMock = vi.fn((table: string) => {
      if (table === 'roles') {
        return { select: roleSelectMock }
      }

      if (table === 'employee_request_form') {
        return { select: bindingSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { createManagedUser } = await import('../userManagementService.js')

    await expect(
      createManagedUser(
        {
          roleName: 'super_admin',
          userId: 'admin-1',
          supabase: { from: fromMock },
        },
        {
          email: 'candidate@example.com',
          password: 'secret12',
          full_name: 'Candidate User',
          employee_request_form_id: 'erf-1',
          role_id: 'role-candidate',
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message:
        'Selected ERF must have a recruiter assigned before candidate accounts can be created.',
    })
  })

  it('rejects candidate account creation when the ERF is still in approval', async () => {
    const roleSingleMock = vi.fn().mockResolvedValue({
      data: { name: 'candidate' },
      error: null,
    })
    const roleEqMock = vi.fn(() => ({ single: roleSingleMock }))
    const roleSelectMock = vi.fn(() => ({ eq: roleEqMock }))

    const bindingMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'erf-2',
        pt_id: 'pt-1',
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        main_position: 'Backend Engineer',
        recruiter_user_id: null,
        recruitment_flow_stage: 'approval_in_progress',
        pt_ref: { name: 'PT One' },
        department_ref: { name: 'Engineering' },
        master_designation_ref: { name: 'Senior' },
      },
      error: null,
    })
    const bindingEqMock = vi.fn(() => ({ maybeSingle: bindingMaybeSingleMock }))
    const bindingSelectMock = vi.fn(() => ({ eq: bindingEqMock }))

    const fromMock = vi.fn((table: string) => {
      if (table === 'roles') {
        return { select: roleSelectMock }
      }

      if (table === 'employee_request_form') {
        return { select: bindingSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { createManagedUser } = await import('../userManagementService.js')

    await expect(
      createManagedUser(
        {
          roleName: 'super_admin',
          userId: 'admin-1',
          supabase: { from: fromMock },
        },
        {
          email: 'candidate@example.com',
          password: 'secret12',
          full_name: 'Candidate User',
          employee_request_form_id: 'erf-2',
          role_id: 'role-candidate',
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Selected ERF is not eligible for candidate account binding.',
    })
  })

  it('creates a candidate account with an auto-generated password when password is blank', async () => {
    const roleSingleMock = vi.fn().mockResolvedValue({
      data: { name: 'candidate' },
      error: null,
    })
    const roleEqMock = vi.fn(() => ({ single: roleSingleMock }))
    const roleSelectMock = vi.fn(() => ({ eq: roleEqMock }))

    const bindingMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'erf-3',
        pt_id: 'pt-1',
        department_id: 'dep-1',
        master_designation_id: 'des-1',
        main_position: 'Backend Engineer',
        recruiter_user_id: 'recruiter-1',
        recruitment_flow_stage: 'assign_recruiter',
        pt_ref: { name: 'PT One' },
        department_ref: { name: 'Engineering' },
        master_designation_ref: { name: 'Senior' },
      },
      error: null,
    })
    const bindingEqMock = vi.fn(() => ({ maybeSingle: bindingMaybeSingleMock }))
    const bindingSelectMock = vi.fn(() => ({ eq: bindingEqMock }))

    const fromMock = vi.fn((table: string) => {
      if (table === 'roles') {
        return { select: roleSelectMock }
      }

      if (table === 'employee_request_form') {
        return { select: bindingSelectMock }
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const { createCandidateServiceAccount } =
      await import('~~/server/services/candidateServiceClient.js')
    vi.mocked(createCandidateServiceAccount).mockResolvedValue({
      candidate_id: 'cand-1',
      email: 'candidate@example.com',
      full_name: 'Candidate User',
      role: 'candidate',
      status: 'active',
      primary_application: null,
    } as any)

    const { createManagedUser } = await import('../userManagementService.js')

    await createManagedUser(
      {
        roleName: 'super_admin',
        userId: 'admin-1',
        supabase: { from: fromMock },
      },
      {
        email: 'candidate@example.com',
        password: '   ',
        full_name: 'Candidate User',
        employee_request_form_id: 'erf-3',
        role_id: 'role-candidate',
      },
    )

    expect(createCandidateServiceAccount).toHaveBeenCalledTimes(1)
    expect(createCandidateServiceAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'candidate@example.com',
        full_name: 'Candidate User',
        phone: null,
        employee_code: null,
        created_by_internal_user_id: 'admin-1',
        erf_id: 'erf-3',
        job_snapshot: {
          department_id: 'dep-1',
          department_name: 'Engineering',
          master_designation_id: 'des-1',
          designation_name: 'Senior',
          main_position: 'Backend Engineer',
          pt_id: 'pt-1',
          pt_name: 'PT One',
        },
      }),
    )
    expect(vi.mocked(createCandidateServiceAccount).mock.calls[0]?.[0]?.password).toEqual(
      expect.any(String),
    )
    expect(
      vi.mocked(createCandidateServiceAccount).mock.calls[0]?.[0]?.password.length,
    ).toBeGreaterThanOrEqual(6)
  })
})
