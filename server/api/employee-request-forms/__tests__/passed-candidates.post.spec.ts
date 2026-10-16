import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const requireAnyPermissionMock = vi.fn()
const isStaffRoleMock = vi.fn()
const listManagedCandidateUsersFromCandidateDatabaseMock = vi.fn()
const requireRequestContextMock = vi.fn()
let persistedStageRows: Array<Record<string, unknown>> = []

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3")
  return {
    ...actual,
    readBody: readBodyMock,
  }
})

vi.mock("~~/server/lib/context.js", () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock("~~/server/lib/utils.js", () => ({
  isStaffRole: isStaffRoleMock,
}))

vi.mock("~~/server/services/candidateDatabaseReadService.js", () => ({
  listManagedCandidateUsersFromCandidateDatabase:
    listManagedCandidateUsersFromCandidateDatabaseMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

function createInterviewSelectChain(rows: Array<Record<string, unknown>>) {
  return {
    in: vi.fn().mockResolvedValue({
      data: rows,
      error: null,
    }),
  }
}

describe("POST /api/employee-request-forms/passed-candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    persistedStageRows = [
      {
        id: "erf-1",
        recruitment_flow_stage: "interview_scheduled",
      },
    ]
    readBodyMock.mockResolvedValue({
      employee_request_form_ids: ["erf-1"],
    })
    isStaffRoleMock.mockReturnValue(false)
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
        full_name: "Brian Joyo",
        email: "brian@example.com",
      },
    ])
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "interview_evaluation_forms") {
            return {
              select: vi.fn(() =>
                createInterviewSelectChain([
                  {
                    employee_request_form_id: "erf-1",
                    interview_date: "2026-05-25",
                    candidate_service_application_id: "application-1",
                    candidate_service_candidate_id: "candidate-account-1",
                    candidate_name: "Brian Joyo",
                  },
                  {
                    employee_request_form_id: "erf-1",
                    interview_date: "2026-05-25",
                    candidate_service_application_id: "application-1",
                    candidate_service_candidate_id: "candidate-account-1",
                    candidate_name: "Brian Joyo",
                  },
                ]),
              ),
            }
          }

          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => createInterviewSelectChain(persistedStageRows)),
            }
          }

          throw new Error(`Unexpected table: ${table}`)
        }),
      },
    })
  })

  it("counts unique interviewed candidates instead of interview rows", async () => {
    const { default: handler } = await import("../passed-candidates.post")

    const result = await handler({} as any)

    expect(requireAnyPermissionMock).toHaveBeenCalled()
    expect(result).toMatchObject({
      recruitment_flow_stages: [
        {
          employee_request_form_id: "erf-1",
          stage: "interview_scheduled",
        },
      ],
      vacancy_pipeline: [
        {
          employee_request_form_id: "erf-1",
          candidate_count: 1,
          interview_scheduled_count: 1,
        },
      ],
    })
  })

  it("prioritizes employee form progress when the selected employee has started the form", async () => {
    persistedStageRows = [
      {
        id: "erf-1",
        recruitment_flow_stage: "candidate_selected",
      },
    ]
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "employee",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
        full_name: "Brian Joyo",
        email: "brian@example.com",
      },
    ])
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "interview_evaluation_forms") {
            return {
              select: vi.fn(() =>
                createInterviewSelectChain([
                  {
                    employee_request_form_id: "erf-1",
                    interview_date: "2026-05-25",
                    candidate_service_application_id: "application-1",
                    candidate_service_candidate_id: "candidate-account-1",
                    candidate_name: "Brian Joyo",
                  },
                ]),
              ),
            }
          }

          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => createInterviewSelectChain(persistedStageRows)),
            }
          }

          throw new Error(`Unexpected table: ${table}`)
        }),
      },
    })

    const { default: handler } = await import("../passed-candidates.post")

    const result = await handler({} as any)

    expect(result).toMatchObject({
      recruitment_flow_stages: [
        {
          employee_request_form_id: "erf-1",
          stage: "candidate_selected",
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: "erf-1",
          status: "accepted",
        },
      ],
    })
  })

  it("returns the persisted candidate sourcing stage when the ERF is still in sourcing", async () => {
    persistedStageRows = [
      {
        id: "erf-1",
        recruitment_flow_stage: "candidate_sourcing",
      },
    ]
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-20T08:00:00",
        full_name: "Brian Joyo",
        email: "brian@example.com",
      },
    ])
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "interview_evaluation_forms") {
            return {
              select: vi.fn(() => createInterviewSelectChain([])),
            }
          }

          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => createInterviewSelectChain(persistedStageRows)),
            }
          }

          throw new Error(`Unexpected table: ${table}`)
        }),
      },
    })

    const { default: handler } = await import("../passed-candidates.post")

    const result = await handler({} as any)

    expect(result).toMatchObject({
      recruitment_flow_stages: [
        {
          employee_request_form_id: "erf-1",
          stage: "candidate_sourcing",
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: "erf-1",
          status: "sourcing",
        },
      ],
    })
  })

  it("returns interview evaluation in progress when one interviewer has completed the assessment", async () => {
    persistedStageRows = [
      {
        id: "erf-1",
        recruitment_flow_stage: "interview_evaluation_in_progress",
      },
    ]
    listManagedCandidateUsersFromCandidateDatabaseMock.mockResolvedValue([
      {
        id: "candidate-1",
        employee_request_form_id: "erf-1",
        role: "candidate",
        candidate_form_completion_status: "in_progress",
        candidate_form_created_at: "2026-05-20T08:00:00",
        candidate_form_updated_at: "2026-05-21T09:00:00",
        full_name: "Brian Joyo",
        email: "brian@example.com",
      },
    ])
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "interview_evaluation_forms") {
            return {
              select: vi.fn(() =>
                createInterviewSelectChain([
                  {
                    employee_request_form_id: "erf-1",
                    interview_date: null,
                    candidate_service_application_id: "application-1",
                    candidate_service_candidate_id: "candidate-account-1",
                    candidate_name: "Brian Joyo",
                    interviewers: [
                      {
                        recommendation: "continue_recruitment",
                        scores: Array.from({ length: 10 }, (_, index) => ({
                          score: 5,
                          item_number: index + 1,
                        })),
                      },
                      {
                        recommendation: null,
                        scores: [],
                      },
                    ],
                  },
                ]),
              ),
            }
          }

          if (table === "employee_request_form") {
            return {
              select: vi.fn(() => createInterviewSelectChain(persistedStageRows)),
            }
          }

          throw new Error(`Unexpected table: ${table}`)
        }),
      },
    })

    const { default: handler } = await import("../passed-candidates.post")
    const result = await handler({} as any)

    expect(result).toMatchObject({
      recruitment_flow_stages: [
        {
          employee_request_form_id: "erf-1",
          stage: "interview_evaluation_in_progress",
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: "erf-1",
          status: "interview",
        },
      ],
    })
  })
})
