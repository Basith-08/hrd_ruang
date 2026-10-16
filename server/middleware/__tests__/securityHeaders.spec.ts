import { beforeEach, describe, expect, it, vi } from 'vitest'

const setResponseHeaderMock = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  setResponseHeader: setResponseHeaderMock,
}))

describe('securityHeaders middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    delete process.env.NUXT_PUBLIC_SUPABASE_URL
    delete process.env.HRD_PINTU_SUPABASE_URL
  })

  it('sets baseline security headers', async () => {
    const { default: middleware } = await import('../securityHeaders')

    middleware({} as never)

    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'X-Content-Type-Options',
      'nosniff',
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'X-Frame-Options',
      'DENY',
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Security-Policy-Report-Only',
      expect.stringContaining("default-src 'self'"),
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Security-Policy-Report-Only',
      expect.stringContaining("object-src 'none'"),
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Reporting-Endpoints',
      'csp-endpoint="/csp-report"',
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Security-Policy-Report-Only',
      expect.stringContaining('report-uri /csp-report'),
    )
  })

  it('includes configured Supabase origins in the report-only CSP', async () => {
    process.env.NUXT_PUBLIC_SUPABASE_URL = 'https://project-ref.supabase.co'
    process.env.HRD_PINTU_SUPABASE_URL = 'https://candidate-ref.supabase.co'

    const { default: middleware } = await import('../securityHeaders')

    middleware({} as never)

    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Security-Policy-Report-Only',
      expect.stringContaining(
        "connect-src 'self' https://project-ref.supabase.co https://candidate-ref.supabase.co",
      ),
    )
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Content-Security-Policy-Report-Only',
      expect.stringContaining(
        "img-src 'self' data: blob: https://project-ref.supabase.co https://candidate-ref.supabase.co",
      ),
    )
  })
})
