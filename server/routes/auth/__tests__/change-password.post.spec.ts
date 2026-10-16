import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const setResponseStatusMock = vi.fn()
const requireRequestContextMock = vi.fn()
const changeAuthenticatedPasswordMock = vi.fn()

vi.mock("h3", () => ({
  defineEventHandler: (handler) => handler,
  readBody: readBodyMock,
  setResponseStatus: setResponseStatusMock,
}))

vi.mock("~~/server/utils/requestContext", () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock("~~/server/services/authService.js", () => ({
  changeAuthenticatedPassword: changeAuthenticatedPasswordMock,
}))

describe("/auth/change-password route", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-02T03:10:00.000Z"))
    readBodyMock.mockResolvedValue({
      currentPassword: "current123",
      newPassword: "newsecret123",
    })
    requireRequestContextMock.mockResolvedValue({
      userId: "user-1",
      authUser: { email: "john@example.com" },
      supabase: {},
    })
    changeAuthenticatedPasswordMock.mockResolvedValue(undefined)

    const { resetRateLimitStore } = await import("~~/server/lib/rateLimit.js")
    resetRateLimitStore()
  })

  it("changes password for the authenticated user", async () => {
    const { default: handler } = await import("../change-password.post.ts")

    await expect(
      handler({
        node: {
          req: {
            headers: {
              authorization: "Bearer token",
              "x-forwarded-for": "10.0.0.2",
            },
            socket: {},
          },
        },
      }),
    ).resolves.toEqual({ ok: true })

    expect(changeAuthenticatedPasswordMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      {
        currentPassword: "current123",
        newPassword: "newsecret123",
      },
    )
  })

  it("returns 429 after exceeding the per-ip change password limit", async () => {
    const { default: handler } = await import("../change-password.post.ts")
    const event = {
      node: {
        req: {
          headers: {
            authorization: "Bearer token",
            "x-forwarded-for": "10.0.0.2",
          },
          socket: {},
        },
      },
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await handler(event)
    }

    await expect(handler(event)).resolves.toEqual({
      ok: false,
      error: "Too many password change attempts. Please try again in a few minutes.",
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 429)
  })
})
