import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const setResponseStatusMock = vi.fn()
const resolveLoginIdentifierMock = vi.fn()

vi.mock("h3", () => ({
  defineEventHandler: (handler) => handler,
  readBody: readBodyMock,
  setResponseStatus: setResponseStatusMock,
}))

vi.mock("~~/server/services/authService.js", () => ({
  resolveLoginIdentifier: resolveLoginIdentifierMock,
}))

describe("/auth/resolve-login route", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-19T09:30:00.000Z"))
    readBodyMock.mockResolvedValue({ identifier: "candidate-user" })
    resolveLoginIdentifierMock.mockResolvedValue({ email: "candidate@example.com" })

    const { resetRateLimitStore } = await import("~~/server/lib/rateLimit.js")
    resetRateLimitStore()
  })

  it("resolves the login identifier below the rate limit", async () => {
    const { default: handler } = await import("../resolve-login.post.ts")

    await expect(
      handler({
        node: {
          req: {
            headers: {
              "x-forwarded-for": "10.0.0.1",
            },
            socket: {},
          },
        },
      }),
    ).resolves.toEqual({ email: "candidate@example.com" })
  })

  it("returns 429 after exceeding the per-ip lookup limit", async () => {
    const { default: handler } = await import("../resolve-login.post.ts")
    const event = {
      node: {
        req: {
          headers: {
            "x-forwarded-for": "10.0.0.1",
          },
          socket: {},
        },
      },
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await handler(event)
    }

    await expect(handler(event)).resolves.toEqual({
      ok: false,
      error: "Too many login identifier lookups. Please try again in a minute.",
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 429)
  })
})
