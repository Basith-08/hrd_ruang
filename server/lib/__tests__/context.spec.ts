import { beforeEach, describe, expect, it, vi } from "vitest"

const authGetUserMock = vi.fn()
const maybeSingleRoleMock = vi.fn()
const maybeSingleProfileMock = vi.fn()

const supabaseMock = {
  auth: {
    getUser: authGetUserMock,
  },
  from: vi.fn((table) => {
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleProfileMock,
          })),
        })),
      }
    }

    if (table === "user_roles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleRoleMock,
          })),
        })),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  }),
}

vi.mock("~~/server/services/supabaseAdmin.js", () => ({
  getSupabaseAdmin: () => supabaseMock,
}))

vi.mock("~~/server/lib/utils.js", () => ({
  uniqueStrings: (values) => [...new Set(values.filter(Boolean))],
}))

describe("getRequestContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authGetUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
      },
      error: null,
    })
    maybeSingleProfileMock.mockResolvedValue({
      data: { is_active: true },
      error: null,
    })
    maybeSingleRoleMock.mockResolvedValue({
      data: {
        role_id: "role-1",
        roles: {
          name: "super_admin",
          role_permissions: [
            { permissions: { name: "dashboard:read" } },
          ],
        },
      },
      error: null,
    })
  })

  it("returns the request context for active users", async () => {
    const { getRequestContext } = await import("../context.js")

    await expect(
      getRequestContext({ authorization: "Bearer token-123" }),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: "user-1",
          roleName: "super_admin",
        permissions: ["dashboard:read"],
      }),
    )
  })

  it("rejects inactive users even when the access token is valid", async () => {
    maybeSingleProfileMock.mockResolvedValue({
      data: { is_active: false },
      error: null,
    })

    const { getRequestContext } = await import("../context.js")

    await expect(
      getRequestContext({ authorization: "Bearer token-123" }),
    ).rejects.toMatchObject({
      message: "Account is inactive.",
      status: 403,
    })
  })
})
