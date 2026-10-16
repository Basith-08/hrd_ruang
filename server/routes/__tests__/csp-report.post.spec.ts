import { beforeEach, describe, expect, it, vi } from "vitest"

const readBodyMock = vi.fn()
const setResponseStatusMock = vi.fn()
const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => {})

vi.mock("h3", () => ({
  defineEventHandler: (handler) => handler,
  readBody: readBodyMock,
  setResponseStatus: setResponseStatusMock,
}))

describe("/csp-report route", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-19T10:00:00.000Z"))
    readBodyMock.mockResolvedValue({
      "csp-report": {
        "document-uri": "https://app.example.com/dashboard",
        "violated-directive": "script-src-elem",
        "effective-directive": "script-src-elem",
        "blocked-uri": "https://evil.example.com/script.js",
        "source-file": "https://app.example.com/dashboard",
        "line-number": 12,
        "column-number": 4,
        disposition: "report",
        "original-policy": "default-src 'self'; report-uri /csp-report",
        referrer: "https://app.example.com/login",
        "status-code": 200,
      },
    })

    const { resetRateLimitStore } = await import("~~/server/lib/rateLimit.js")
    resetRateLimitStore()
  })

  it("accepts and logs sanitized CSP violations", async () => {
    const { default: handler } = await import("../csp-report.post.ts")

    await expect(
      handler({
        node: {
          req: {
            headers: {
              "x-forwarded-for": "10.0.0.3",
            },
            socket: {},
          },
        },
      }),
    ).resolves.toEqual({ ok: true })

    expect(consoleWarnMock).toHaveBeenCalledWith(
      "CSP violation report:",
      expect.objectContaining({
        document_uri: "https://app.example.com/dashboard",
        violated_directive: "script-src-elem",
        blocked_uri: "https://evil.example.com/script.js",
      }),
    )
  })

  it("returns 429 after exceeding the per-ip report limit", async () => {
    const { default: handler } = await import("../csp-report.post.ts")
    const event = {
      node: {
        req: {
          headers: {
            "x-forwarded-for": "10.0.0.3",
          },
          socket: {},
        },
      },
    }

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await handler(event)
    }

    await expect(handler(event)).resolves.toEqual({
      ok: false,
      error: "Too many CSP reports. Please retry shortly.",
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 429)
  })
})
