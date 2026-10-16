import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAnyPermissionMock = vi.fn()
const getCandidateSupabaseAdminMock = vi.fn()
const isCandidateDatabaseConfiguredMock = vi.fn(() => true)

vi.mock("~~/server/lib/context.js", () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock("~~/server/services/candidateSupabaseAdmin.js", () => ({
  getCandidateSupabaseAdmin: getCandidateSupabaseAdminMock,
  isCandidateDatabaseConfigured: isCandidateDatabaseConfiguredMock,
}))

function createDashboardSupabase() {
  const operations: string[] = []

  return {
    __operations: operations,
    from: vi.fn((table: string) => {
      if (table === "employee_request_form") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "erf-1" },
                error: null,
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => {
                operations.push("employee_request_form")
                return Promise.resolve({
                  data: [{ id: "erf-1" }],
                  error: null,
                })
              }),
            })),
          })),
        }
      }

      if (table === "approval_chains" || table === "employee_contract_form") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn().mockImplementation(() => {
              operations.push(table)
              return Promise.resolve({ error: null })
            }),
          })),
        }
      }

      throw new Error(`Unexpected dashboard table: ${table}`)
    }),
  }
}

function createCandidateSupabase() {
  const operations: string[] = []

  return {
    __operations: operations,
    from: vi.fn((table: string) => {
      if (table === "candidate_form" || table === "candidate_applications") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn().mockImplementation(() => {
              operations.push(table)
              return Promise.resolve({ error: null })
            }),
          })),
        }
      }

      throw new Error(`Unexpected candidate table: ${table}`)
    }),
  }
}

describe("employeeRequestFormService.deleteEmployeeRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isCandidateDatabaseConfiguredMock.mockReturnValue(true)
  })

  it("deletes linked candidate, approval, and contract records before deleting the ERF", async () => {
    const dashboardSupabase = createDashboardSupabase()
    const candidateSupabase = createCandidateSupabase()
    getCandidateSupabaseAdminMock.mockReturnValue(candidateSupabase)

    const { deleteEmployeeRequestForm } = await import("../employeeRequestFormService.js")
    await deleteEmployeeRequestForm(
      {
        supabase: dashboardSupabase,
        userId: "user-1",
        roleName: "staff recruitment",
        permissions: ["employee_request_form:delete"],
      } as never,
      "erf-1",
    )

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.objectContaining({ roleName: "staff recruitment" }),
      ["employee_request_form:delete"],
    )
    expect(candidateSupabase.__operations).toEqual([
      "candidate_form",
      "candidate_applications",
    ])
    expect(dashboardSupabase.__operations).toEqual([
      "approval_chains",
      "employee_contract_form",
      "employee_request_form",
    ])
  })
})
