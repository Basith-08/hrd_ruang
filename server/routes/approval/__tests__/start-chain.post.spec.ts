import { beforeEach, describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
const requireRequestContextMock = vi.fn()
const runInBackgroundMock = vi.fn()
const getJakartaTimestampMock = vi.fn(() => '2026-06-11T10:00:00+07:00')
const isAdminRoleMock = vi.fn()
const syncRecruitmentFlowStageMock = vi.fn()
const resolveTrustedAppOriginMock = vi.fn(() => 'https://app.example.com')
const sendApprovalStepEmailMock = vi.fn()

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    readBody: readBodyMock,
  }
})

vi.mock('~~/server/lib/backgroundTask.js', () => ({
  runInBackground: runInBackgroundMock,
}))

vi.mock('~~/server/lib/time.js', () => ({
  getJakartaTimestamp: getJakartaTimestampMock,
}))

vi.mock('~~/server/lib/utils.js', () => ({
  isAdminRole: isAdminRoleMock,
}))

vi.mock('~~/server/utils/requestContext', () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock('~~/server/utils/origin.js', () => ({
  resolveTrustedAppOrigin: resolveTrustedAppOriginMock,
}))

vi.mock('~~/server/services/approvalService.js', () => ({
  sendApprovalStepEmail: sendApprovalStepEmailMock,
}))

vi.mock('~~/server/services/recruitmentFlowStageService.js', () => ({
  syncRecruitmentFlowStage: syncRecruitmentFlowStageMock,
}))

describe('POST /approval/start-chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readBodyMock.mockResolvedValue({
      employee_request_form_id: 'erf-1',
    })
    isAdminRoleMock.mockReturnValue(false)
    syncRecruitmentFlowStageMock.mockResolvedValue(undefined)
    runInBackgroundMock.mockImplementation((_task) => undefined)
    sendApprovalStepEmailMock.mockResolvedValue(undefined)
  })

  it('uses the selected Director BU from the ERF when creating approval steps', async () => {
    const approvalStepsInsertMock = vi.fn().mockResolvedValue({ error: null })
    const approvalChainInsertSingleMock = vi.fn().mockResolvedValue({
      data: { id: 'chain-1' },
      error: null,
    })

    requireRequestContextMock.mockResolvedValue({
      roleName: 'HR',
      userId: 'user-1',
      permissions: ['employee_request_form:create'],
      supabase: {
        from: vi.fn((table: string) => {
          if (table === 'employee_request_form') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'erf-1',
                      created_by: 'user-1',
                      master_designation_id: 'des-1',
                      approval_director_bu_id: 'director-1',
                      approval_director_bu_profile: {
                        id: 'director-1',
                        full_name: 'Selected Director',
                        email: 'selected-director@example.com',
                        username: 'selected-director',
                      },
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_chains') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: approvalChainInsertSingleMock,
                })),
              })),
            }
          }

          if (table === 'approver_master') {
            return {
              select: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        profile_id: 'manager-1',
                        approval_flow_key: 'designations:des-1',
                        approval_role_key: 'manager_approval',
                        approval_role_label: 'Manager Approval',
                        profile: {
                          full_name: 'Manager One',
                          email: 'manager@example.com',
                          username: 'manager1',
                        },
                      },
                      {
                        profile_id: 'director-1',
                        approval_flow_key: 'designations:des-1',
                        approval_role_key: 'director_approval',
                        approval_role_label: 'Director BU',
                        profile: {
                          full_name: 'Master Director',
                          email: 'master-director@example.com',
                          username: 'master-director',
                        },
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_steps') {
            return {
              insert: approvalStepsInsertMock,
            }
          }

          throw new Error(`Unexpected table ${table}`)
        }),
      },
    })

    const { default: handler } = await import('../start-chain.post')

    const result = await handler({} as any)

    expect(result).toEqual({ ok: true, chain_id: 'chain-1' })
    expect(approvalStepsInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        approval_role_key: 'manager_approval',
        approver_email: 'manager@example.com',
        approver_name: 'Manager One',
      }),
      expect.objectContaining({
        approval_role_key: 'director_approval',
        approval_role_label: 'Director BU',
        approver_email: 'selected-director@example.com',
        approver_name: 'Selected Director',
      }),
    ])
    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledWith(expect.anything(), 'erf-1')
    expect(runInBackgroundMock).toHaveBeenCalled()
  })

  it('falls back to the master-configured approver when no Director BU is selected', async () => {
    const approvalStepsInsertMock = vi.fn().mockResolvedValue({ error: null })
    const approvalChainInsertSingleMock = vi.fn().mockResolvedValue({
      data: { id: 'chain-1' },
      error: null,
    })

    requireRequestContextMock.mockResolvedValue({
      roleName: 'HR',
      userId: 'user-1',
      permissions: ['employee_request_form:create'],
      supabase: {
        from: vi.fn((table: string) => {
          if (table === 'employee_request_form') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'erf-1',
                      created_by: 'user-1',
                      master_designation_id: 'des-1',
                      approval_director_bu_id: null,
                      approval_director_bu_profile: null,
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_chains') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: approvalChainInsertSingleMock,
                })),
              })),
            }
          }

          if (table === 'approver_master') {
            return {
              select: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        profile_id: 'manager-1',
                        approval_flow_key: 'designations:des-1',
                        approval_role_key: 'manager_approval',
                        approval_role_label: 'Manager Approval',
                        profile: {
                          full_name: 'Manager One',
                          email: 'manager@example.com',
                          username: 'manager1',
                        },
                      },
                      {
                        profile_id: 'director-1',
                        approval_flow_key: 'designations:des-1',
                        approval_role_key: 'director_approval',
                        approval_role_label: 'Director BU',
                        profile: {
                          full_name: 'Master Director',
                          email: 'master-director@example.com',
                          username: 'master-director',
                        },
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_steps') {
            return {
              insert: approvalStepsInsertMock,
            }
          }

          throw new Error(`Unexpected table ${table}`)
        }),
      },
    })

    const { default: handler } = await import('../start-chain.post')

    const result = await handler({} as any)

    expect(result).toEqual({ ok: true, chain_id: 'chain-1' })
    expect(approvalStepsInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        approval_role_key: 'manager_approval',
        approver_email: 'manager@example.com',
      }),
      expect.objectContaining({
        approval_role_key: 'director_approval',
        approval_role_label: 'Director BU',
        approver_email: 'master-director@example.com',
        approver_name: 'Master Director',
      }),
    ])
  })

  it('auto approves the ERF with a single approved chain and step when auto_approval is true', async () => {
    readBodyMock.mockResolvedValue({
      employee_request_form_id: 'erf-1',
      auto_approval: true,
    })

    const approvalStepsInsertMock = vi.fn().mockResolvedValue({ error: null })
    const approvalChainInsertSingleMock = vi.fn().mockResolvedValue({
      data: { id: 'chain-1' },
      error: null,
    })

    requireRequestContextMock.mockResolvedValue({
      roleName: 'HR',
      userId: 'user-1',
      permissions: ['employee_request_form:create'],
      supabase: {
        from: vi.fn((table: string) => {
          if (table === 'employee_request_form') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'erf-1',
                      created_by: 'requester-1',
                      master_designation_id: 'des-1',
                      approval_director_bu_id: null,
                      approval_director_bu_profile: null,
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_chains') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: approvalChainInsertSingleMock,
                })),
              })),
            }
          }

          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'requester-1',
                      full_name: 'Rina Requester',
                      email: 'rina@example.com',
                      username: 'rina',
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === 'approval_steps') {
            return {
              insert: approvalStepsInsertMock,
            }
          }

          throw new Error(`Unexpected table ${table}`)
        }),
      },
    })

    const { default: handler } = await import('../start-chain.post')

    const result = await handler({} as any)

    expect(result).toEqual({ ok: true, chain_id: 'chain-1' })
    expect(approvalChainInsertSingleMock).toHaveBeenCalled()
    expect(approvalStepsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        approval_role_key: 'auto_approval',
        approval_role_label: 'Auto Approval',
        approver_email: 'rina@example.com',
        approver_name: 'Rina Requester',
        status: 'approved',
      }),
    )
    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledWith(expect.anything(), 'erf-1')
    expect(runInBackgroundMock).not.toHaveBeenCalled()
  })
})
