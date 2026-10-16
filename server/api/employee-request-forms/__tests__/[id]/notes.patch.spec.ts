import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const requireAnyPermissionMock = vi.fn()
const isAdminRoleMock = vi.fn()
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

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

describe("PATCH /api/employee-request-forms/[id]/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readBodyMock.mockResolvedValue({
      notes: "Recruitment note",
    })
    isAdminRoleMock.mockReturnValue(false)
    requireRequestContextMock.mockResolvedValue({
      roleName: "HR",
      userId: "user-1",
      supabase: {
        from: vi.fn((table: string) => {
          if (table !== "employee_request_form") {
            throw new Error(`Unexpected table: ${table}`)
          }

          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => Promise.resolve({
                  data: [{ id: "erf-1" }],
                  error: null,
                })),
              })),
            })),
          }
        }),
      },
    })
  })

  it("updates notes field only", async () => {
    const { default: handler } = await import("../../[id]/notes.patch")

    const result = await handler({
      context: {
        params: {
          id: "erf-1",
        },
      },
    } as any)

    expect(requireAnyPermissionMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        "employee_request_form:update",
        "recruitment:vacancy_pipeline_detail",
        "recruitment:closed_vacancy_detail",
      ],
    )
    expect(result).toEqual({ ok: true, notes: "Recruitment note" })
  })
})
