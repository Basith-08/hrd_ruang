import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAnyPermissionMock = vi.fn()
const isStaffRoleMock = vi.fn()
const listManagedCandidateUsersByEmployeeRequestFormIdsMock = vi.fn()
const requireRequestContextMock = vi.fn()

vi.mock("~~/server/lib/context.js", () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock("~~/server/lib/errors.js", () => ({
  createHttpError: (statusCode, message) => {
    const error = new Error(message)
    error.statusCode = statusCode
    error.expose = true
    return error
  },
}))

vi.mock("~~/server/lib/utils.js", () => ({
  isStaffRole: isStaffRoleMock,
}))

vi.mock("~~/server/services/candidateDatabaseReadService.js", () => ({
  listManagedCandidateUsersByEmployeeRequestFormIds:
    listManagedCandidateUsersByEmployeeRequestFormIdsMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

describe("GET /api/employee-request-forms/[id]/pipeline-candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isStaffRoleMock.mockReturnValue(false)
    listManagedCandidateUsersByEmployeeRequestFormIdsMock.mockResolvedValue([
      {
        id: "candidate-account-1",
        candidate_service_application_id: "application-1",
        candidate_service_candidate_id: "candidate-account-1",
        full_name: "Brian Joyo",
        email: "brian@example.com",
        role: "employee",
      },
      {
        id: "candidate-account-2",
        candidate_service_application_id: null,
        candidate_service_candidate_id: "candidate-account-2",
        full_name: "Ayu Lestari",
        email: "ayu@example.com",
        role: "candidate",
      },
      {
        id: "candidate-account-3",
        candidate_service_application_id: "application-3",
        candidate_service_candidate_id: "candidate-account-3",
        full_name: "Employee Portal User",
        email: "employee@example.com",
        role: "employee",
      },
    ])
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table) => {
          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "erf-1",
                      status: "open",
                      recruitment_flow_stage: "interview_evaluation_completed",
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === "employee_contract_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            }
          }

          if (table !== "interview_evaluation_forms") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        employee_request_form_id: "erf-1",
                        interview_date: "2026-05-25",
                        candidate_service_application_id: "application-1",
                        candidate_service_candidate_id: "candidate-account-1",
                        candidate_name: "Brian Joyo",
                        interviewers: [
                          {
                            id: "interviewer-1",
                            recommendation: "hire",
                            scores: Array.from({ length: 10 }, (_, index) => ({
                              item_number: index + 1,
                              score: 4,
                            })),
                          },
                        ],
                      },
                      {
                        employee_request_form_id: "erf-1",
                        interview_date: "2026-05-26",
                        candidate_service_application_id: null,
                        candidate_service_candidate_id: "candidate-account-2",
                        candidate_name: "Ayu Lestari",
                        interviewers: [
                          {
                            id: "interviewer-2",
                            recommendation: null,
                            scores: [],
                          },
                        ],
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }),
      },
    })
  })

  it("returns pipeline people with matched interview dates even after role becomes employee", async () => {
    const { default: handler } = await import("../../[id]/pipeline-candidates.get")

    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as never)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        "employee_request_form:read",
        "employee_contract_form:read",
        "employee_contract_form:create",
        "employee_contract_form:update",
        "recruitment:approved_erf_read",
        "recruitment:vacancy_pipeline",
        "recruitment:vacancy_pipeline_detail",
        "recruitment:closed_vacancy_detail",
      ],
    )
    expect(listManagedCandidateUsersByEmployeeRequestFormIdsMock).toHaveBeenCalledWith(
      {
        isStaff: false,
        roleName: "HR",
        userId: "user-1",
      },
      ["erf-1"],
    )
    expect(result).toEqual({
      candidates: [
        {
          id: "candidate-account-2",
          full_name: "Ayu Lestari",
          email: "ayu@example.com",
          role: "candidate",
          interview_dates: ["2026-05-26"],
          hasCompletedInterview: false,
          hasExistingContract: false,
        },
        {
          id: "candidate-account-1",
          full_name: "Brian Joyo",
          email: "brian@example.com",
          role: "employee",
          interview_dates: ["2026-05-25"],
          hasCompletedInterview: true,
          hasExistingContract: false,
        },
        {
          id: "candidate-account-3",
          full_name: "Employee Portal User",
          email: "employee@example.com",
          role: "employee",
          interview_dates: [],
          hasCompletedInterview: false,
          hasExistingContract: false,
        },
      ],
    })
  })

  it("marks a candidate as having an existing contract so a second candidate on the same ERF can still be picked", async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table) => {
          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "erf-1",
                      status: "open",
                      recruitment_flow_stage: "employee_contract_form_in_progress",
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === "employee_contract_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: [{ candidate_id: "candidate-account-1" }],
                  error: null,
                }),
              })),
            }
          }

          if (table !== "interview_evaluation_forms") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        employee_request_form_id: "erf-1",
                        interview_date: "2026-05-25",
                        candidate_service_application_id: "application-1",
                        candidate_service_candidate_id: "candidate-account-1",
                        candidate_name: "Brian Joyo",
                        interviewers: [
                          {
                            id: "interviewer-1",
                            recommendation: "hire",
                            scores: Array.from({ length: 10 }, (_, index) => ({
                              item_number: index + 1,
                              score: 4,
                            })),
                          },
                        ],
                      },
                      {
                        employee_request_form_id: "erf-1",
                        interview_date: "2026-05-26",
                        candidate_service_application_id: null,
                        candidate_service_candidate_id: "candidate-account-2",
                        candidate_name: "Ayu Lestari",
                        interviewers: [
                          {
                            id: "interviewer-2",
                            recommendation: "hire",
                            scores: Array.from({ length: 10 }, (_, index) => ({
                              item_number: index + 1,
                              score: 4,
                            })),
                          },
                        ],
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }),
      },
    })

    const { default: handler } = await import("../../[id]/pipeline-candidates.get")
    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as never)

    const byId = Object.fromEntries(result.candidates.map((candidate) => [candidate.id, candidate]))

    expect(byId["candidate-account-1"].hasExistingContract).toBe(true)
    expect(byId["candidate-account-2"].hasExistingContract).toBe(false)
    expect(byId["candidate-account-2"].hasCompletedInterview).toBe(true)
  })

  it("still returns candidates even when the ERF has not reached NECF stage", async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table) => {
          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "erf-1",
                      status: "open",
                      recruitment_flow_stage: "interview_evaluation_in_progress",
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }

          if (table === "employee_contract_form") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            }
          }

          if (table !== "interview_evaluation_forms") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }),
      },
    })

    const { default: handler } = await import("../../[id]/pipeline-candidates.get")
    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as never)

    expect(listManagedCandidateUsersByEmployeeRequestFormIdsMock).toHaveBeenCalledWith(
      {
        isStaff: false,
        roleName: "HR",
        userId: "user-1",
      },
      ["erf-1"],
    )
    expect(result.candidates).toHaveLength(3)
  })
})
