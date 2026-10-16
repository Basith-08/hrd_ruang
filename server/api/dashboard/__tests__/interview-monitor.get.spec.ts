import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAnyPermissionMock = vi.fn()
const requireRequestContextMock = vi.fn()
const isAdminRoleMock = vi.fn()
const listAssignedInterviewEvaluationsMock = vi.fn()

vi.mock('~~/server/lib/context.js', () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock('~~/server/utils/requestContext', () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock('~~/server/lib/utils.js', () => ({
  isAdminRole: isAdminRoleMock,
}))

vi.mock('~~/server/services/interviewEvaluationService.js', () => ({
  listAssignedInterviewEvaluations: listAssignedInterviewEvaluationsMock,
}))

describe('GET /api/dashboard/interview-monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns zero summary when user has no interview access', async () => {
    requireRequestContextMock.mockResolvedValue({
      permissions: ['dashboard:read'],
      roleName: 'staff',
    })
    isAdminRoleMock.mockReturnValue(false)

    const { default: handler } = await import('../interview-monitor.get')

    const result = await handler({} as any)

    expect(listAssignedInterviewEvaluationsMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      interview_monitor: {
        visible_count: 0,
        pending_count: 0,
        completed_count: 0,
        upcoming_count: 0,
        nearest_interview: null,
        upcoming_interviews: [],
      },
    })
  })

  it('aggregates interview metrics from assigned evaluations', async () => {
    requireRequestContextMock.mockResolvedValue({
      permissions: ['dashboard:read', 'interview_evaluation:read'],
      roleName: 'staff',
    })
    isAdminRoleMock.mockReturnValue(false)
    listAssignedInterviewEvaluationsMock.mockResolvedValue([
      {
        candidate_name: 'Alex',
        interview_date: '2099-01-03',
        interviewer_name: 'Panel A',
        applied_position: 'Designer',
        is_completed: false,
      },
      {
        candidate_name: 'Bima',
        interview_date: '2099-01-04',
        interviewer_name: 'Panel B',
        applied_position: 'Engineer',
        is_completed: true,
      },
      {
        candidate_name: 'Citra',
        interview_date: '2020-01-01',
        interviewer_name: 'Panel C',
        applied_position: 'Analyst',
        is_completed: true,
      },
    ])

    const { default: handler } = await import('../interview-monitor.get')

    const result = await handler({} as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: ['dashboard:read', 'interview_evaluation:read'] }),
      ['dashboard:read'],
    )
    expect(result).toEqual({
      interview_monitor: {
        visible_count: 3,
        pending_count: 1,
        completed_count: 2,
        upcoming_count: 2,
        nearest_interview: {
          candidate_name: 'Alex',
          interview_date: '2099-01-03',
          interviewer_name: 'Panel A',
          applied_position: 'Designer',
        },
        upcoming_interviews: [
          {
            candidate_name: 'Alex',
            interview_date: '2099-01-03',
            interviewer_name: 'Panel A',
            applied_position: 'Designer',
          },
          {
            candidate_name: 'Bima',
            interview_date: '2099-01-04',
            interviewer_name: 'Panel B',
            applied_position: 'Engineer',
          },
        ],
      },
    })
  })
})
