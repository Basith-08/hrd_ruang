import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('resolveTrustedAppOrigin', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.APP_BASE_URL
  })

  it('prefers APP_BASE_URL when configured', async () => {
    process.env.APP_BASE_URL = 'https://hrd.example.com/app?ignored=true'
    const { resolveTrustedAppOrigin } = await import('../origin.js')

    expect(resolveTrustedAppOrigin({} as never)).toBe('https://hrd.example.com')
  })

  it('throws when APP_BASE_URL is missing', async () => {
    const { resolveTrustedAppOrigin } = await import('../origin.js')

    expect(() => resolveTrustedAppOrigin({} as never)).toThrow('APP_BASE_URL is not configured.')
  })
})
