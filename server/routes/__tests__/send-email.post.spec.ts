import { beforeEach, describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
const setResponseStatusMock = vi.fn()

const requireRequestContextMock = vi.fn()
const validateSendEmailBodyMock = vi.fn()
const sendEmailMock = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  readBody: readBodyMock,
  setResponseStatus: setResponseStatusMock,
}))

vi.mock('~~/server/utils/requestContext', () => ({
  requireRequestContext: requireRequestContextMock,
}))

vi.mock('~~/server/services/emailService.js', () => ({
  validateSendEmailBody: validateSendEmailBodyMock,
  sendEmail: sendEmailMock,
}))

describe('/send-email route', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-19T09:30:00.000Z'))
    readBodyMock.mockResolvedValue({
      to: 'test@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    })
    validateSendEmailBodyMock.mockReturnValue([])
    sendEmailMock.mockResolvedValue(undefined)

    const { resetRateLimitStore } = await import('~~/server/lib/rateLimit.js')
    resetRateLimitStore()
  })

  it('rejects non-admin authenticated users', async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: 'manager',
      userId: 'user-manager',
    })

    const { default: handler } = await import('../send-email.post')

    await expect(handler({} as never)).resolves.toEqual({
      ok: false,
      error: 'Only administrators can send emails from this endpoint.',
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 403)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('allows authenticated administrators to send email', async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: 'super_admin',
      userId: 'user-admin',
    })

    const { default: handler } = await import('../send-email.post')

    await expect(handler({} as never)).resolves.toEqual({
      ok: true,
    })
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    })
  })

  it('returns 429 after exceeding the per-user email limit', async () => {
    requireRequestContextMock.mockResolvedValue({
      roleName: 'super_admin',
      userId: 'user-admin',
    })

    const { default: handler } = await import('../send-email.post')
    const event = {
      node: {
        req: {
          headers: {},
          socket: {},
        },
      },
    } as never

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await handler(event)
    }

    await expect(handler(event)).resolves.toEqual({
      ok: false,
      error: 'Too many email requests. Please wait a minute before trying again.',
    })
    expect(setResponseStatusMock).toHaveBeenCalledWith(expect.anything(), 429)
  })
})
