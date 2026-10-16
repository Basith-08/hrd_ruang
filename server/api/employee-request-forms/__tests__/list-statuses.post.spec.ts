import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const requireAnyPermissionMock = vi.fn()
const requireRequestContextMock = vi.fn()

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

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

function createEmployeeRequestFormSelectChain(rows: Array<Record<string, unknown>>) {
  return {
    in: vi.fn().mockResolvedValue({
      data: rows,
      error: null,
    }),
  }
}

describe("POST /api/employee-request-forms/list-statuses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readBodyMock.mockResolvedValue({
      employee_request_form_ids: ["erf-1", "erf-2", "erf-3", "erf-4", "erf-5"],
    })
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "employee_request_form") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            select: vi.fn(() =>
              createEmployeeRequestFormSelectChain([
                {
                  id: "erf-1",
                  recruitment_flow_stage: "assessment_list_created",
                },
                {
                  id: "erf-2",
                  recruitment_flow_stage: "interview_evaluation_in_progress",
                },
                {
                  id: "erf-3",
                  recruitment_flow_stage: "candidate_selected",
                },
                {
                  id: "erf-4",
                  recruitment_flow_stage: "employee_contract_form_in_progress",
                },
                {
                  id: "erf-5",
                  recruitment_flow_stage: "assign_recruiter",
                },
              ]),
            ),
          }
        }),
      },
    })
  })

  it("returns persisted ERF stages and vacancy statuses for the requested ERFs", async () => {
    const { default: handler } = await import("../list-statuses.post")

    const result = await handler({} as any)

    expect(requireAnyPermissionMock).toHaveBeenCalled()
    expect(result).toEqual({
      recruitment_flow_stages: [
        {
          employee_request_form_id: "erf-1",
          stage: "assessment_list_created",
        },
        {
          employee_request_form_id: "erf-2",
          stage: "interview_evaluation_in_progress",
        },
        {
          employee_request_form_id: "erf-3",
          stage: "candidate_selected",
        },
        {
          employee_request_form_id: "erf-4",
          stage: "employee_contract_form_in_progress",
        },
        {
          employee_request_form_id: "erf-5",
          stage: "assign_recruiter",
        },
      ],
      vacancy_statuses: [
        {
          employee_request_form_id: "erf-1",
          status: "sourcing",
        },
        {
          employee_request_form_id: "erf-2",
          status: "interview",
        },
        {
          employee_request_form_id: "erf-3",
          status: "accepted",
        },
        {
          employee_request_form_id: "erf-4",
          status: "accepted",
        },
        {
          employee_request_form_id: "erf-5",
          status: "request",
        },
      ],
    })
  })
})
