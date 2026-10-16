import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAnyPermissionMock = vi.fn()
const requireRequestContextMock = vi.fn()
const isAdminRoleMock = vi.fn()
const countCandidateFormsForDashboardMock = vi.fn()
const loadManagedUsersMock = vi.fn()

vi.mock('~~/server/lib/context.js', () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock('~~/server/utils/requestContext', () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock('~~/server/lib/utils.js', () => ({
  isAdminRole: isAdminRoleMock,
}))

vi.mock('~~/server/services/candidateFormReadService.js', () => ({
  countCandidateFormsForDashboard: countCandidateFormsForDashboardMock,
}))

vi.mock('~~/server/services/userManagementService.js', () => ({
  loadManagedUsers: loadManagedUsersMock,
}))

function createManagerSupabaseMock() {
  let employeeRequestFormCallCount = 0

  return {
    from: vi.fn((table: string) => {
      if (table === 'employee_request_form') {
        employeeRequestFormCallCount += 1

        if (employeeRequestFormCallCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'erf-1' }, { id: 'erf-2' }],
                error: null,
              }),
            })),
          }
        }

        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'erf-2',
                      main_position: 'Supervisor',
                      site: 'HO',
                      position_status: 'Replacement',
                    },
                    {
                      id: 'erf-1',
                      main_position: 'Engineer',
                      site: 'Plant 1',
                      position_status: 'New',
                    },
                  ],
                  error: null,
                  count: 2,
                }),
              })),
            })),
          })),
        }
      }

      if (table === 'approval_chains') {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'chain-1',
                  status: 'pending',
                  steps: [{ approver_email: 'manager@example.com', status: 'pending' }],
                },
                {
                  id: 'chain-2',
                  status: 'approved',
                  steps: [{ approver_email: 'manager@example.com', status: 'approved' }],
                },
                {
                  id: 'chain-3',
                  status: 'pending',
                  steps: [{ approver_email: 'other@example.com', status: 'pending' }],
                },
              ],
              error: null,
            }),
          })),
        }
      }

      if (table === 'recruitment_queue_view') {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              error: null,
              count: 2,
            }),
          })),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

function createAdminSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'employee_request_form') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'erf-9',
                    main_position: 'HRBP',
                    site: 'Jakarta',
                    position_status: 'Upgrade',
                  },
                ],
                error: null,
                count: 9,
              }),
            })),
          })),
        }
      }

      if (table === 'approval_chains') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'chain-1', status: 'pending' },
              { id: 'chain-2', status: 'approved' },
              { id: 'chain-3', status: 'rejected' },
            ],
            error: null,
          }),
        }
      }

      if (table === 'recruitment_queue_view') {
        return {
          select: vi.fn().mockResolvedValue({
            error: null,
            count: 5,
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }
}

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns manager-scoped counts and recent jobs', async () => {
    requireRequestContextMock.mockResolvedValue({
      authUser: { email: 'manager@example.com' },
      permissions: [
        'dashboard:read',
        'employee_request_form:read',
        'approval:read',
        'recruitment:read',
        'candidate_form:read',
      ],
      roleName: 'manager',
      supabase: createManagerSupabaseMock(),
      userId: 'user-1',
    })
    isAdminRoleMock.mockReturnValue(false)
    countCandidateFormsForDashboardMock.mockResolvedValue(7)
    loadManagedUsersMock.mockResolvedValue([])

    const { default: handler } = await import('../summary.get')

    const result = await handler({} as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: expect.arrayContaining(['dashboard:read']) }),
      ['dashboard:read'],
    )
    expect(result).toEqual({
      employee_request_forms: {
        total_count: 2,
        recent_jobs: [
          {
            id: 'erf-2',
            main_position: 'Supervisor',
            site: 'HO',
            position_status: 'Replacement',
          },
          {
            id: 'erf-1',
            main_position: 'Engineer',
            site: 'Plant 1',
            position_status: 'New',
          },
        ],
      },
      approvals: {
        visible_count: 3,
        pending_count: 1,
        approved_count: 1,
        rejected_count: 0,
      },
      recruitment: {
        total_count: 2,
      },
      candidate_employees: {
        total_count: 0,
        candidate_count: 0,
        employee_count: 0,
      },
      candidate_forms: {
        total_count: 7,
      },
    })
  })

  it('uses admin chain statuses directly and skips candidate count without permission', async () => {
    requireRequestContextMock.mockResolvedValue({
      authUser: { email: 'admin@example.com' },
      permissions: [
        'dashboard:read',
        'employee_request_form:read',
        'approval:read',
        'recruitment:read',
      ],
      roleName: 'super_admin',
      supabase: createAdminSupabaseMock(),
      userId: 'admin-1',
    })
    isAdminRoleMock.mockReturnValue(true)
    loadManagedUsersMock.mockResolvedValue([])

    const { default: handler } = await import('../summary.get')

    const result = await handler({} as any)

    expect(countCandidateFormsForDashboardMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      employee_request_forms: {
        total_count: 9,
        recent_jobs: [
          {
            id: 'erf-9',
            main_position: 'HRBP',
            site: 'Jakarta',
            position_status: 'Upgrade',
          },
        ],
      },
      approvals: {
        visible_count: 3,
        pending_count: 1,
        approved_count: 1,
        rejected_count: 1,
      },
      recruitment: {
        total_count: 5,
      },
      candidate_employees: {
        total_count: 0,
        candidate_count: 0,
        employee_count: 0,
      },
      candidate_forms: {
        total_count: 0,
      },
    })
  })

  it('returns candidate and employee account counts when the scope is accessible', async () => {
    requireRequestContextMock.mockResolvedValue({
      authUser: { email: 'hr@example.com' },
      permissions: ['dashboard:read', 'candidate_employee:read'],
      roleName: 'hr',
      supabase: {
        from: vi.fn(() => {
          throw new Error(
            'Should not query summary tables when only candidate-employee scope is readable.',
          )
        }),
      },
      userId: 'hr-1',
    })
    isAdminRoleMock.mockReturnValue(false)
    loadManagedUsersMock.mockResolvedValue([
      { id: 'candidate-1', role: 'candidate' },
      { id: 'candidate-2', role: 'candidate' },
      { id: 'employee-1', role: 'employee' },
    ])

    const { default: handler } = await import('../summary.get')

    const result = await handler({} as any)

    expect(loadManagedUsersMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'hr-1' }),
      'candidateEmployee',
    )
    expect(result.candidate_employees).toEqual({
      total_count: 3,
      candidate_count: 2,
      employee_count: 1,
    })
  })
})
