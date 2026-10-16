import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const setResponseStatusMock = vi.fn()
const requireCandidateProjectionSyncTokenMock = vi.fn()
const syncCandidateProjectionEventMock = vi.fn()
const getSupabaseAdminMock = vi.fn()

vi.mock("h3", () => ({
  defineEventHandler: (handler) => handler,
  readBody: readBodyMock,
  setResponseStatus: setResponseStatusMock,
}))

vi.mock("~~/server/services/supabaseAdmin.js", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}))

vi.mock("~~/server/services/candidateProjectionEventService.js", () => ({
  requireCandidateProjectionSyncToken: requireCandidateProjectionSyncTokenMock,
  syncCandidateProjectionEvent: syncCandidateProjectionEventMock,
}))

describe("/internal/candidate-events route", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-19T09:30:00.000Z"))
    readBodyMock.mockResolvedValue({ event_type: "candidate.updated" })
    getSupabaseAdminMock.mockReturnValue({ admin: true })
    syncCandidateProjectionEventMock.mockResolvedValue({ ok: true })

    const { resetRateLimitStore } = await import("~~/server/lib/rateLimit.js")
    resetRateLimitStore()
  })

  it("accepts candidate sync events below the rate limit", async () => {
    const { default: handler } = await import("../candidate-events.post.ts")

    await expect(
      handler({
        node: {
          req: {
            headers: {
              "x-forwarded-for": "10.0.0.2",
            },
            socket: {},
          },
        },
      }),
    ).resolves.toEqual({ ok: true })
    expect(requireCandidateProjectionSyncTokenMock).toHaveBeenCalled()
  })

  it("returns 429 after exceeding the per-ip sync limit", async () => {
    const { default: handler } = await import("../candidate-events.post.ts")
    const event = {
      node: {
        req: {
          headers: {
            "x-forwarded-for": "10.0.0.2",
          },
          socket: {},
        },
      },
    }

    for (let attempt = 0; attempt < 120; attempt += 1) {
      await handler(event)
    }

    await expect(handler(event)).resolves.toEqual({
      ok: false,
      error: "Too many candidate sync events. Please retry shortly.",
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 429)
  })
})
