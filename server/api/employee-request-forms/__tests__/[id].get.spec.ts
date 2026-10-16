import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAnyPermissionMock = vi.fn()
const requireRequestContextMock = vi.fn()
const queryNotMock = vi.fn()
const queryMaybeSingleMock = vi.fn()
const queryEqMock = vi.fn()
const selectMock = vi.fn()
const fromMock = vi.fn()

vi.mock("~~/server/lib/context.js", () => ({
  requireAnyPermission: requireAnyPermissionMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

describe("GET /api/employee-request-forms/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    queryMaybeSingleMock.mockResolvedValue({
      data: {
        id: "erf-1",
        approval_director_hrd_date: "2026-04-20T09:00:00",
      },
      error: null,
    })

    queryNotMock.mockReturnValue({
      maybeSingle: queryMaybeSingleMock,
    })

    queryEqMock.mockReturnValue({
      eq: queryEqMock,
      not: queryNotMock,
      maybeSingle: queryMaybeSingleMock,
    })

    selectMock.mockReturnValue({
      eq: queryEqMock,
    })

    fromMock.mockReturnValue({
      select: selectMock,
    })
  })

  it("limits approved-only access to HRD-approved ERFs", async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      permissions: ["recruitment:approved_erf_read"],
      supabase: {
        from: fromMock,
      },
    })

    const { default: handler } = await import("../[id].get")

    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: ["recruitment:approved_erf_read"],
      }),
      [
        "employee_request_form:read",
        "recruitment:approved_erf_read",
        "recruitment:vacancy_pipeline_detail",
        "recruitment:closed_vacancy_detail",
      ],
    )
    expect(fromMock).toHaveBeenCalledWith("employee_request_form")
    expect(queryEqMock).toHaveBeenCalledWith("id", "erf-1")
    expect(queryNotMock).toHaveBeenCalledWith("approval_director_hrd_date", "is", null)
    expect(result).toEqual({
      employee_request_form: {
        id: "erf-1",
        approval_director_hrd_date: "2026-04-20T09:00:00",
      },
    })
  })

  it("keeps manager access scoped to their own ERFs", async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: "Manager",
      userId: "manager-1",
      permissions: ["employee_request_form:read"],
      supabase: {
        from: fromMock,
      },
    })

    const { default: handler } = await import("../[id].get")

    await handler({
      context: {
        params: {
          id: "erf-2",
        },
      },
    } as any)

    expect(queryEqMock).toHaveBeenNthCalledWith(1, "id", "erf-2")
    expect(queryEqMock).toHaveBeenNthCalledWith(2, "created_by", "manager-1")
    expect(queryNotMock).not.toHaveBeenCalled()
  })

  it("allows recruitment detail permissions without approved-only filtering", async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      permissions: ["recruitment:vacancy_pipeline_detail"],
      supabase: {
        from: fromMock,
      },
    })

    const { default: handler } = await import("../[id].get")

    await handler({
      context: {
        params: {
          id: "erf-3",
        },
      },
    } as any)

    expect(queryEqMock).toHaveBeenCalledWith("id", "erf-3")
    expect(queryNotMock).not.toHaveBeenCalled()
  })
})
