import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const requireAnyPermissionMock = vi.fn()
const isAdminRoleMock = vi.fn()
const syncRecruitmentFlowStageMock = vi.fn()
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

vi.mock("~~/server/lib/utils.js", () => ({
  isAdminRole: isAdminRoleMock,
}))

vi.mock("~~/server/services/recruitmentFlowStageService.js", () => ({
  syncRecruitmentFlowStage: syncRecruitmentFlowStageMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

describe("POST /api/employee-request-forms/[id]/close", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readBodyMock.mockResolvedValue({
      category: "canceled",
      reason: "Position request canceled.",
    })
    isAdminRoleMock.mockReturnValue(false)
    syncRecruitmentFlowStageMock.mockResolvedValue("closed")

    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "employee_request_form") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            update: vi.fn((payload) => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => Promise.resolve({
                  data: payload.status === "closed" ? [{ id: "erf-1" }] : [],
                  error: null,
                })),
              })),
            })),
          }
        }),
      },
    })
  })

  it("closes the ERF with canceled category", async () => {
    const { default: handler } = await import("../[id]/close.post")

    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.anything(),
      ["employee_request_form:close"],
    )
    expect(syncRecruitmentFlowStageMock).toHaveBeenCalledWith(
      expect.anything(),
      "erf-1",
    )
    expect(result).toEqual({ ok: true })
  })

  it("maps done category into employee hired", async () => {
    readBodyMock.mockResolvedValue({
      category: "done",
      reason: "Hiring complete.",
    })

    const updateMock = vi.fn((payload) => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: payload.closed_category === "employee hired" ? [{ id: "erf-1" }] : [],
          error: null,
        })),
      })),
    }))

    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn(() => ({
          update: updateMock,
        })),
      },
    })

    const { default: handler } = await import("../[id]/close.post")
    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as any)

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      closed_category: "employee hired",
    }))
    expect(result).toEqual({ ok: true })
  })
})
